import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  FileText, 
  ChevronRight, 
  Bot, 
  User as UserIcon,
  HelpCircle,
  RotateCcw,
  Check,
  Search
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { HELP_QUESTIONS, HELP_ARTICLES, HelpQuestion } from '../../data/helpCenterData';

interface HelpAIAssistantViewProps {
  initialQuestion?: string;
  onNavigate: (view: string, slug?: string) => void;
  onBack?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  category?: string;
  articleTitle?: string;
  articleSlug?: string;
  followUps?: string[];
  feedback?: 'positive' | 'negative' | null;
  timestamp: string;
}

export default function HelpAIAssistantView({
  initialQuestion,
  onNavigate,
  onBack
}: HelpAIAssistantViewProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('help-center');
    }
  };

  // Scroll smoothly to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle initial question if navigated with one
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  // Knowledge-based AI response generator strictly grounded in Mod Station docs
  const handleSendMessage = (textToSend?: string) => {
    const questionText = (textToSend || inputText).trim();
    if (!questionText) return;

    const userMsgId = 'user-' + Date.now();
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: questionText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    // AI Knowledge matching logic
    setTimeout(() => {
      const lowerQuery = questionText.toLowerCase();

      // Find best matching question or article in Knowledge Base
      let matchedQuestion: HelpQuestion | undefined = HELP_QUESTIONS.find(
        (q) => lowerQuery.includes(q.question.toLowerCase()) || 
               q.question.toLowerCase().includes(lowerQuery) ||
               lowerQuery.includes(q.categoryName.toLowerCase())
      );

      // Keyword based fuzzy match
      if (!matchedQuestion) {
        if (lowerQuery.includes('sandi') || lowerQuery.includes('password')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-1');
        } else if (lowerQuery.includes('developer') || lowerQuery.includes('unggah') || lowerQuery.includes('upload') || lowerQuery.includes('publikasi')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-2');
        } else if (lowerQuery.includes('shield') || lowerQuery.includes('aman') || lowerQuery.includes('virus') || lowerQuery.includes('malware')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-3');
        } else if (lowerQuery.includes('premium') || lowerQuery.includes('iklan') || lowerQuery.includes('langganan')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-4');
        } else if (lowerQuery.includes('donasi') || lowerQuery.includes('qris') || lowerQuery.includes('rekening')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-7');
        } else if (lowerQuery.includes('bug') || lowerQuery.includes('lapor') || lowerQuery.includes('tiket') || lowerQuery.includes('cs')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-6');
        } else if (lowerQuery.includes('dmca') || lowerQuery.includes('hak cipta') || lowerQuery.includes('copyright')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-9');
        } else if (lowerQuery.includes('update') || lowerQuery.includes('versi') || lowerQuery.includes('perbarui')) {
          matchedQuestion = HELP_QUESTIONS.find(q => q.id === 'q-10');
        }
      }

      let aiResponseText = '';
      let category = 'Pusat Bantuan';
      let articleTitle = '';
      let articleSlug = '';
      let followUps: string[] = [
        'Bagaimana cara mengganti kata sandi?',
        'Bagaimana cara mendaftar sebagai Developer?',
        'Bagaimana cara melaporkan kendala pada aplikasi?'
      ];

      if (matchedQuestion) {
        aiResponseText = matchedQuestion.shortAnswer;
        category = matchedQuestion.categoryName;
        articleTitle = matchedQuestion.question;
        articleSlug = matchedQuestion.articleSlug;
        if (matchedQuestion.suggestedFollowUps) {
          followUps = matchedQuestion.suggestedFollowUps;
        }
      } else {
        // Fallback rule from Prompt Section AA
        aiResponseText = 'Saya belum menemukan informasi yang cukup untuk menjawab pertanyaan tersebut.\n\nSilakan lihat Artikel Bantuan atau hubungi Customer Service Mod Station.';
        category = 'Informasi Umum';
      }

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiResponseText,
        category,
        articleTitle: articleTitle || undefined,
        articleSlug: articleSlug || undefined,
        followUps,
        feedback: null,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleFeedback = (msgId: string, type: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, feedback: type } : m))
    );
  };

  // If no conversation has started, show Landing Page (Section X)
  const isLandingMode = messages.length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-[calc(100vh-8rem)]" id="help-ai-assistant-root">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <BackButton onBack={handleBackClick} label="Pusat Bantuan" showText={true} />
        {!isLandingMode && (
          <button
            onClick={() => setMessages([])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Percakapan Baru</span>
          </button>
        )}
      </div>

      {isLandingMode ? (
        /* LANDING PAGE (Section X & Y) */
        <div className="flex-1 flex flex-col justify-center space-y-8 max-w-xl mx-auto w-full py-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight pt-2">
              Asisten AI Pusat Bantuan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Dapatkan jawaban langsung dari basis pengetahuan resmi Mod Station seputar aplikasi, akun, dan keamanan.
            </p>
          </div>

          {/* Prominent Search / Ask Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative"
          >
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-blue-600 dark:text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tanya Asisten AI..."
                className="w-full pl-12 pr-14 py-4 rounded-2xl bg-white dark:bg-[#161617] border border-slate-200/90 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2.5 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all cursor-pointer shadow-xs"
                aria-label="Kirim pertanyaan"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Kamu mungkin juga akan bertanya */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Kamu mungkin juga akan bertanya
            </p>

            <div className="grid grid-cols-1 gap-2">
              {HELP_QUESTIONS.slice(0, 6).map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSendMessage(q.question)}
                  className="w-full p-3.5 rounded-xl bg-white dark:bg-[#161617] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left flex items-center justify-between gap-3 group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      <span className="font-bold text-slate-400 dark:text-slate-500 mr-1.5">[{q.categoryName}]</span>
                      {q.question}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-600">
                    ?
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CHAT VIEW (Section Z & AA) */
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-6 flex-1 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  /* User Bubble */
                  <div className="flex justify-end">
                    <div className="max-w-md rounded-2xl rounded-tr-xs bg-blue-600 text-white px-4.5 py-3 shadow-xs space-y-1">
                      <p className="text-sm font-medium leading-relaxed">
                        {msg.text}
                      </p>
                      <div className="text-[10px] text-blue-200 text-right">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AI Response Bubble (Section Z) */
                  <div className="flex flex-col items-start space-y-3 max-w-2xl">
                    <div className="rounded-3xl rounded-tl-xs bg-white dark:bg-[#161617] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-4 w-full">
                      
                      {/* AI Header */}
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {msg.articleTitle ? `Artikel: [${msg.category}] ${msg.articleTitle}` : `[${msg.category}] Mod Station Support`}
                        </span>
                      </div>

                      {/* Main Answer */}
                      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </div>

                      {/* Closing message */}
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                        Semoga informasi ini membantu!
                      </p>

                      {/* Feedback Buttons */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeedback(msg.id, 'positive')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              msg.feedback === 'positive'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Puas</span>
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'negative')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              msg.feedback === 'negative'
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Tidak</span>
                          </button>
                        </div>

                        {msg.articleSlug && (
                          <button
                            onClick={() => onNavigate('help-articles', msg.articleSlug)}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Buka Artikel Lengkap</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Follow up suggestions */}
                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="space-y-1.5 pl-2 pt-1 w-full">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Kamu Mungkin Juga Ingin Bertanya
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.followUps.map((fu, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(fu)}
                              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/70 dark:border-white/10 transition-colors cursor-pointer"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-white dark:bg-[#161617] border border-slate-200/80 dark:border-white/10 max-w-xs text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Asisten AI sedang menyusun jawaban...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="sticky bottom-0 pt-3 bg-gradient-to-t from-slate-100 dark:from-[#0d1117] via-slate-100/90 dark:via-[#0d1117]/90 to-transparent"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tanyakan hal lain seputar Mod Station..."
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white dark:bg-[#161617] border border-slate-200/90 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-all cursor-pointer"
                aria-label="Kirim"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
