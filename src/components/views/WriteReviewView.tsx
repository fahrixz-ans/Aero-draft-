import React, { useState } from 'react';
import { Star, Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { AppData, AppRating } from '../../types';
import { doc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface WriteReviewViewProps {
  app: AppData;
  onBack: () => void;
  currentUser?: any;
  onSignIn?: () => void;
}

export default function WriteReviewView({
  app,
  onBack,
  currentUser,
  onSignIn
}: WriteReviewViewProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      if (onSignIn) {
        onSignIn();
      } else {
        setErrorMessage('Silakan masuk terlebih dahulu untuk mempublikasikan ulasan.');
      }
      return;
    }

    // 1. Validasi rating (minimal 1 bintang)
    if (rating < 1) {
      setErrorMessage('Harap berikan rating minimal 1 bintang.');
      return;
    }

    // 2. Validasi teks ulasan
    if (!reviewText.trim()) {
      setErrorMessage('Teks ulasan tidak boleh kosong. Ceritakan pengalaman Anda.');
      return;
    }

    setStatus('loading');
    try {
      // 3. Simpan ke database Firestore (subkoleksi reviews dan ratings)
      const reviewId = `rev-${currentUser.uid}-${Date.now()}`;
      const reviewRef = doc(db, 'applications', app.id, 'reviews', reviewId);
      
      await setDoc(reviewRef, {
        id: reviewId,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Pengguna Mod Station',
        userPhotoUrl: currentUser.photoURL || null,
        rating,
        reviewText: reviewText.trim(),
        versionReviewed: app.version || '1.0',
        helpfulCount: 0,
        status: 'published',
        createdAt: new Date().toISOString()
      });
      
      const ratingRef = doc(db, 'applications', app.id, 'ratings', currentUser.uid);
      await setDoc(ratingRef, {
        id: currentUser.uid,
        userId: currentUser.uid,
        appId: app.id,
        rating: rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 4. Update rating rata-rata dan distribusi rating pada aplikasi
      try {
        const ratingsRef = collection(db, 'applications', app.id, 'ratings');
        const snap = await getDocs(ratingsRef);

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRatingSum = 0;
        let totalCount = 0;

        snap.forEach((d) => {
          const rData = d.data() as AppRating;
          const r = Math.min(5, Math.max(1, Math.round(rData.rating || 0)));
          if (r >= 1 && r <= 5) {
            distribution[r]++;
            totalRatingSum += r;
            totalCount++;
          }
        });

        const ratingAverage = totalCount > 0 ? Number((totalRatingSum / totalCount).toFixed(1)) : rating;

        const appRef = doc(db, 'applications', app.id);
        await updateDoc(appRef, {
          ratingAverage,
          ratingCount: totalCount,
          ratingDistribution: distribution,
          rating: ratingAverage
        });
      } catch (aggErr) {
        console.warn('Non-blocking: could not recalculate aggregate:', aggErr);
      }

      // 5. Menampilkan state loading / error / sukses
      setStatus('success');

      // 6. Mengarahkan kembali ke halaman detail atau rating setelah berhasil
      setTimeout(() => {
        window.location.hash = `/apps/${app.slug || app.id}/rating`;
      }, 1200);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Gagal menyimpan ulasan ke database. Coba lagi.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in" id="write-review-page">
      {/* HEADER: ← [Nama aplikasi] */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img
          src={app.iconUrl || app.icon}
          alt={app.name}
          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shadow-xs"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            {app.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium">Beri ulasan Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs space-y-6">
        {/* BERI RATING APLIKASI INI: ☆ ☆ ☆ ☆ ☆ */}
        <div className="text-center space-y-2">
          <label className="block text-sm font-extrabold text-slate-800 dark:text-slate-200">
            Beri rating aplikasi ini:
          </label>
          <div className="flex justify-center items-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                aria-label={`${star} bintang`}
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {rating === 5 && 'Sangat Bagus!'}
              {rating === 4 && 'Bagus!'}
              {rating === 3 && 'Cukup'}
              {rating === 2 && 'Kurang Bagus'}
              {rating === 1 && 'Sangat Buruk'}
            </p>
          )}
        </div>

        {/* TULIS ULASAN: [Text area] */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Tulis ulasan:
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Bagikan pengalaman Anda menggunakan aplikasi ini (fitur, kecepatan, stabilitas)..."
            rows={5}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y font-medium"
            required
          />
        </div>

        {/* ERROR / SUCCESS STATES */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>Ulasan Anda berhasil disimpan dan dipublikasikan! Mengalihkan...</span>
          </div>
        )}

        {/* [PUBLIKASIKAN] */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mempublikasikan...</span>
              </>
            ) : (
              <span>Publikasikan</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
