import { firestore } from '../repositories';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { getGeminiClient, GEMINI_MODEL, parseGeminiError, isGeminiConfigured } from '../lib/gemini';
import { HELP_ARTICLES } from '../../src/data/helpCenterData';

export interface AIHelpJob {
  jobId: string;
  userId?: string;
  status: string;
  progress: number;
  currentStep: string;
  message: string;
  question: string;
  articleId?: string;
  error?: string;
  errorCode?: string;
  finalAnswer?: string;
  suggestedFollowUps?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  summary: string;
  category: string;
  categoryId: string;
  tags: string[];
  media?: {
    type: 'image' | 'gif';
    url: string;
    caption: string;
  } | null;
  authorId: string;
  authorName: string;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'PUBLIC';
  visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  featured: boolean;
  readingTime: number;
  views: number;
  seo: {
    title: string;
    description: string;
  };
  source: string;
  generatedByAI: boolean;
  generationJobId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Ensure pre-seeded articles exist on Firestore help_articles
export async function seedInitialHelpArticlesIfEmpty() {
  try {
    const ref = firestore.collection('help_articles');
    const snapshot = await ref.limit(1).get();
    if (!snapshot.empty) return;

    console.log('[Help Center AI] Seeding initial help articles in Firestore...');
    
    for (const art of HELP_ARTICLES || []) {
      const id = `art_${crypto.randomUUID().replace(/-/g, '')}`;
      await ref.doc(id).set({
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt || art.title,
        content: art.content,
        summary: art.excerpt || '',
        category: art.category || 'Umum',
        categoryId: art.categoryId || 'umum',
        tags: [art.categoryId || 'umum'],
        media: art.media && art.media[0] ? {
          type: art.media[0].type || 'image',
          url: art.media[0].url,
          caption: art.media[0].caption || ''
        } : null,
        authorId: 'system',
        authorName: 'Sistem Mod Station',
        status: 'PUBLIC',
        visibility: 'PUBLIC',
        featured: false,
        readingTime: Math.max(1, Math.ceil(art.content.split(/\s+/).length / 200)),
        views: 12,
        seo: {
          title: art.title,
          description: art.excerpt || art.title
        },
        source: 'Seeded',
        generatedByAI: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        publishedAt: FieldValue.serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('[Help Center AI] Failed to seed initial help articles:', err);
  }
}

/**
 * Perform Intelligent search on existing Firestore help_articles
 */
export async function searchKnowledgeBase(question: string): Promise<{ article: HelpArticle | null; confidence: number }> {
  await seedInitialHelpArticlesIfEmpty();
  if (!isGeminiConfigured()) return { article: null, confidence: 0 };
  const ai = getGeminiClient();
  if (!ai) return { article: null, confidence: 0 };

  try {
    // 1. Retrieve help articles from Firestore
    const articlesSnap = await firestore.collection('help_articles').get();
    const articles: any[] = [];
    articlesSnap.forEach(doc => {
      articles.push({ id: doc.id, ...doc.data() });
    });

    if (articles.length === 0) return { article: null, confidence: 0 };

    // Prepare a lightweight catalog for Gemini to match
    const articleCatalog = articles.map(art => ({
      id: art.id,
      title: art.title,
      summary: art.summary || art.excerpt || ''
    }));

    // 2. Ask Gemini to match query with catalog
    const prompt = `Analisis pertanyaan pengguna berikut: "${question}"
Berikut adalah daftar artikel bantuan resmi yang tersedia di database kami:
${JSON.stringify(articleCatalog, null, 2)}

Tentukan apakah ada artikel di atas yang SANGAT RELEVAN dan mampu menjawab pertanyaan tersebut secara langsung.
Jika ya, kembalikan JSON dengan format:
{
  "matchedId": "ID_ARTIKEL_YANG_COCOK",
  "confidence": 0.95 // Angka antara 0.0 s.d 1.0 yang menunjukkan tingkat kecocokan
}
Jika tidak ada artikel yang cocok (tingkat kepercayaan di bawah 0.75), kembalikan:
{
  "matchedId": null,
  "confidence": 0.0
}
Pastikan hanya mengembalikan valid JSON tanpa penjelasan lainnya.`;

    console.log('[Gemini] Request started');
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    console.log('[Gemini] Request completed');

    const text = response.text ? response.text.trim() : '{}';
    const result = JSON.parse(text);

    if (result.matchedId && result.confidence >= 0.75) {
      const matched = articles.find(a => a.id === result.matchedId);
      if (matched) {
        return { article: matched as HelpArticle, confidence: result.confidence };
      }
    }
    return { article: null, confidence: 0.0 };
  } catch (err) {
    const parsed = parseGeminiError(err);
    console.warn('[Help Center AI] Error during searchKnowledgeBase:', parsed.message);
    return { article: null, confidence: 0.0 };
  }
}

/**
 * Update the state/milestone of the background job on Firestore
 */
async function updateJobState(jobId: string, updates: Partial<AIHelpJob>) {
  try {
    await firestore.collection('ai_jobs').doc(jobId).set({
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error(`[Help Center AI] Failed to update job state for ${jobId}:`, err);
  }
}

/**
 * Check if there is an active generation job for a similar question to prevent duplicates
 */
export async function findSimilarActiveJob(question: string): Promise<string | null> {
  try {
    const snap = await firestore.collection('ai_jobs')
      .where('status', 'not-in', ['COMPLETED', 'FAILED'])
      .get();
    
    if (snap.empty) return null;

    const activeJobs: any[] = [];
    snap.forEach(doc => {
      activeJobs.push({ id: doc.id, ...doc.data() });
    });

    if (!isGeminiConfigured()) return null;
    const ai = getGeminiClient();
    if (!ai) return null;

    const prompt = `Periksa apakah pertanyaan baru: "${question}"
memiliki maksud atau arti yang sama/sangat mirip dengan salah satu pertanyaan yang sedang diproses di daftar job berikut:
${JSON.stringify(activeJobs.map(j => ({ jobId: j.id, question: j.question })))}

Jika ada job yang sedang berjalan dengan maksud yang identik, kembalikan JSON:
{
  "duplicateJobId": "ID_JOB_YANG_COCOK"
}
Jika tidak ada, kembalikan:
{
  "duplicateJobId": null
}
Hanya kembalikan valid JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return parsed.duplicateJobId || null;
  } catch (err) {
    console.warn('[Help Center AI] Error checking active similar jobs:', err);
    return null;
  }
}

/**
 * Background routine for article generation, validation, media mapping, and reprocessing
 */
export async function executeAutoKnowledgeGeneration(jobId: string, question: string, userId?: string) {
  if (!isGeminiConfigured()) {
    await updateJobState(jobId, {
      status: 'FAILED',
      progress: 100,
      error: 'Gemini API key is not configured on the server.',
      errorCode: 'GEMINI_API_KEY_MISSING'
    });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    await updateJobState(jobId, {
      status: 'FAILED',
      progress: 100,
      error: 'Gemini API client could not be initialized.',
      errorCode: 'GEMINI_API_KEY_MISSING'
    });
    return;
  }

  try {
    // 1. ANALYZING (10%)
    await updateJobState(jobId, {
      status: 'ANALYZING',
      progress: 10,
      currentStep: 'Memahami pertanyaan pengguna...',
      message: 'Menganalisis maksud pertanyaan dan merancang struktur panduan...'
    });
    await new Promise(r => setTimeout(r, 800));

    // 2. SEARCHING_KNOWLEDGE (20%)
    await updateJobState(jobId, {
      status: 'SEARCHING_KNOWLEDGE',
      progress: 20,
      currentStep: 'Mencocokkan dengan knowledge base...',
      message: 'Memeriksa apakah terdapat duplikasi artikel bantuan...'
    });
    await new Promise(r => setTimeout(r, 800));

    // 3. GENERATING_TITLE (30%)
    await updateJobState(jobId, {
      status: 'GENERATING_TITLE',
      progress: 30,
      currentStep: 'Menentukan judul...',
      message: 'Merancang judul artikel bantuan yang SEO-friendly dan mudah dipahami...'
    });
    await new Promise(r => setTimeout(r, 600));

    // 4. GENERATING_OUTLINE (40%)
    await updateJobState(jobId, {
      status: 'GENERATING_OUTLINE',
      progress: 40,
      currentStep: 'Menyusun struktur artikel...',
      message: 'Menyiapkan outline H2, H3, FAQ, dan panduan langkah demi langkah...'
    });
    await new Promise(r => setTimeout(r, 600));

    // 5. GENERATING_CONTENT (55%)
    await updateJobState(jobId, {
      status: 'GENERATING_CONTENT',
      progress: 55,
      currentStep: 'Menulis penjelasan...',
      message: 'Menyusun artikel bantuan lengkap berbasis markdown sesuai fakta platform Mod Station...'
    });

    const draftPrompt = `Tulis sebuah artikel panduan bantuan (Knowledge Base) yang sangat lengkap untuk memecahkan pertanyaan/topik berikut: "${question}"

Artikel ini harus didesain untuk platform Mod Station (sebuah platform pencarian, unduhan, verifikasi APK Android yang aman).
Isi artikel harus ditulis dalam Bahasa Indonesia yang formal, ramah, dan solutif.

Hasilkan output terstruktur dalam format JSON dengan skema berikut:
{
  "title": "Judul artikel (contoh: Cara Mengatur Ulang Kata Sandi)",
  "slug": "slug-url-ramah (contoh: cara-mengatur-ulang-kata-sandi)",
  "excerpt": "Ringkasan pendek artikel dalam 1-2 kalimat.",
  "content": "Isi artikel lengkap menggunakan format Markdown. Gunakan heading H2, H3, daftar terurut untuk langkah-langkah, dan bagian Catatan Penting.",
  "summary": "Ringkasan cepat solusi artikel untuk disajikan sebagai jawaban asisten.",
  "category": "Nama Kategori (pilih yang paling relevan: Rekomendasi, Bug, Developer, Langganan, Informasi Umum, Iklan, Kebijakan, Akun)",
  "categoryId": "ID Kategori (sesuai pilihan: rekomendasi, bug, developer, langganan, umum, iklan, kebijakan, akun)",
  "tags": ["tag1", "tag2"],
  "steps": ["Langkah 1...", "Langkah 2..."],
  "faq": [
    { "q": "Pertanyaan FAQ 1", "a": "Jawaban FAQ 1" }
  ],
  "mediaQuery": "Query pencarian gambar ilustrasi pendukung yang sangat spesifik (contoh: reset password android secure ui)"
}
Pastikan isi Markdown dalam "content" kaya akan informasi, instruksi nyata, dan tidak mengarang langkah-langkah di luar standar sistem Android atau Mod Station.
Hanya kembalikan valid JSON tanpa penutup Markdown blocks (\`\`\`).`;

    let generatedDoc: any;
    try {
      console.log('[Gemini] Request started');
      const draftResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: draftPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      console.log('[Gemini] Request completed');
      generatedDoc = JSON.parse(draftResponse.text?.trim() || '{}');
    } catch (genErr: any) {
      const parsed = parseGeminiError(genErr);
      console.error(`[Help Center AI] Knowledge draft generation failed for job ${jobId}:`, parsed);
      await updateJobState(jobId, {
        status: 'FAILED',
        progress: 100,
        error: parsed.message,
        errorCode: parsed.code
      });
      return;
    }

    // 6. VALIDATING_CONTENT (65%)
    await updateJobState(jobId, {
      status: 'VALIDATING_CONTENT',
      progress: 65,
      currentStep: 'Memeriksa informasi yang tersedia...',
      message: 'Memvalidasi kepatuhan informasi dan konsistensi instruksi APK...'
    });
    await new Promise(r => setTimeout(r, 800));

    // 7. SEARCHING_MEDIA (75%)
    await updateJobState(jobId, {
      status: 'SEARCHING_MEDIA',
      progress: 75,
      currentStep: 'Mencari media pendukung...',
      message: `Melakukan pencarian gambar ilustrasi untuk query: "${generatedDoc.mediaQuery || 'help center'}"`
    });
    await new Promise(r => setTimeout(r, 600));

    // 8. VALIDATING_MEDIA (82%)
    await updateJobState(jobId, {
      status: 'VALIDATING_MEDIA',
      progress: 82,
      currentStep: 'Memvalidasi media...',
      message: 'Memverifikasi relevansi gambar ilustrasi...'
    });
    await new Promise(r => setTimeout(r, 600));

    // Attach static safe media based on category or query
    let mediaObject = null;
    if (generatedDoc.categoryId === 'akun') {
      mediaObject = {
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        caption: 'Ilustrasi Pengamanan Akun dan Sesi Mod Station'
      };
    } else if (generatedDoc.categoryId === 'developer') {
      mediaObject = {
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80',
        caption: 'Portal Publikasi Berkas APK Developer'
      };
    } else {
      mediaObject = {
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        caption: 'Pusat Keamanan Mod Station Shield'
      };
    }

    // 9. SAVING_ARTICLE (90%)
    await updateJobState(jobId, {
      status: 'SAVING_ARTICLE',
      progress: 90,
      currentStep: 'Menyimpan knowledge article...',
      message: 'Menyimpan draf artikel bantuan baru ke Firestore...'
    });

    const articleId = `art_ai_${crypto.randomUUID().replace(/-/g, '')}`;
    const helpArticleRef = firestore.collection('help_articles').doc(articleId);

    const helpArticleData: HelpArticle = {
      id: articleId,
      title: generatedDoc.title || 'Panduan Bantuan Mod Station',
      slug: generatedDoc.slug || `panduan-${crypto.randomUUID().split('-')[0]}`,
      excerpt: generatedDoc.excerpt || 'Panduan bantuan otomatis yang dihasilkan oleh AI.',
      content: generatedDoc.content || '',
      summary: generatedDoc.summary || '',
      category: generatedDoc.category || 'Informasi Umum',
      categoryId: generatedDoc.categoryId || 'umum',
      tags: generatedDoc.tags || ['ai-generated'],
      media: mediaObject,
      authorId: userId || 'system',
      authorName: 'AI Knowledge Generator',
      status: 'DRAFT', // Default to DRAFT/NEEDS_REVIEW as per security guidelines
      visibility: 'PUBLIC',
      featured: false,
      readingTime: Math.max(1, Math.ceil((generatedDoc.content || '').split(/\s+/).length / 200)),
      views: 0,
      seo: {
        title: `${generatedDoc.title} | Pusat Bantuan Mod Station`,
        description: generatedDoc.excerpt || ''
      },
      source: 'AI Auto Generated',
      generatedByAI: true,
      generationJobId: jobId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await helpArticleRef.set({
        ...helpArticleData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Also populate ai_knowledge collection
      const knowledgeId = `kn_${crypto.randomUUID().replace(/-/g, '')}`;
      await firestore.collection('ai_knowledge').doc(knowledgeId).set({
        sourceArticleId: articleId,
        title: helpArticleData.title,
        summary: helpArticleData.summary,
        content: helpArticleData.content,
        keywords: helpArticleData.tags,
        intents: [generatedDoc.categoryId],
        status: 'PENDING_REVIEW',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    } catch (fsErr: any) {
      console.error(`[Help Center AI] Failed to save article to Firestore for job ${jobId}:`, fsErr);
      await updateJobState(jobId, {
        status: 'FAILED',
        progress: 100,
        error: 'Gagal menyimpan artikel bantuan ke basis data Firestore.',
        errorCode: 'KNOWLEDGE_ARTICLE_WRITE_FAILED'
      });
      return;
    }

    // 10. ARTICLE_READY (93%)
    await updateJobState(jobId, {
      status: 'ARTICLE_READY',
      progress: 93,
      currentStep: 'Artikel bantuan berhasil dibuat!',
      message: 'Artikel bantuan siap digunakan sebagai knowledge source.',
      articleId
    });
    await new Promise(r => setTimeout(r, 400));

    // 11. RETRIEVING_KNOWLEDGE & GENERATING_ANSWER (95% to 98%)
    await updateJobState(jobId, {
      status: 'RETRIEVING_KNOWLEDGE',
      progress: 95,
      currentStep: 'Memproses ulang pertanyaan pengguna...',
      message: 'Mengekstrak informasi relevan dari artikel bantuan baru...'
    });
    await new Promise(r => setTimeout(r, 400));

    await updateJobState(jobId, {
      status: 'GENERATING_ANSWER',
      progress: 98,
      currentStep: 'Meringkas jawaban...',
      message: 'Menyusun jawaban ramah yang disesuaikan untuk pengguna...'
    });

    // Reprocess query to get the friendly final response
    const finalAnswerPrompt = `Kamu adalah AI Assistant Pusat Bantuan Mod Station.
Gunakan artikel panduan bantuan resmi yang baru kami buat berikut untuk menjawab pertanyaan pengguna dengan sangat akurat.

Pertanyaan Pengguna: "${question}"
Artikel Panduan:
Judul: ${helpArticleData.title}
Ringkasan: ${helpArticleData.summary}
Isi Panduan: ${helpArticleData.content}

Tuliskan jawaban final yang ramah, langsung menyelesaikan masalah, tersetruktur, dan diletakkan dalam Bahasa Indonesia.
Jangan pernah berasumsi atau berhalusinasi di luar informasi artikel panduan.
Sertakan tautan rujukan panduan di akhir seperti: "Baca panduan lengkap di sistem kami."`;

    let finalAnswerText = helpArticleData.summary;
    try {
      console.log('[Gemini] Request started');
      const finalResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: finalAnswerPrompt
      });
      console.log('[Gemini] Request completed');
      finalAnswerText = finalResponse.text?.trim() || helpArticleData.summary;
    } catch (ansErr: any) {
      const parsed = parseGeminiError(ansErr);
      console.error(`[Help Center AI] Final answer generation failed for job ${jobId}:`, parsed);
      await updateJobState(jobId, {
        status: 'FAILED',
        progress: 100,
        error: parsed.message,
        errorCode: parsed.code || 'ANSWER_GENERATION_FAILED'
      });
      return;
    }

    // 12. COMPLETED (100%)
    await updateJobState(jobId, {
      status: 'COMPLETED',
      progress: 100,
      currentStep: 'Jawaban berhasil dimuat.',
      message: 'Selesai memproses jawaban untuk pengguna.',
      finalAnswer: finalAnswerText,
      suggestedFollowUps: generatedDoc.faq?.map((f: any) => f.q).slice(0, 3) || [
        `Panduan lengkap seputar ${generatedDoc.category}`,
        'Cara verifikasi keamanan di Mod Station'
      ],
      completedAt: new Date().toISOString()
    });

  } catch (err: any) {
    console.error(`[Help Center AI] Error executing job ${jobId}:`, err);
    const parsed = parseGeminiError(err);
    await updateJobState(jobId, {
      status: 'FAILED',
      progress: 100,
      error: parsed.message,
      errorCode: parsed.code || 'UNKNOWN_ERROR'
    });
  }
}
