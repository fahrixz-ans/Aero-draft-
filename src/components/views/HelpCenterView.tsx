import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lock, 
  HelpCircle, 
  ChevronRight, 
  Headphones, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  KeyRound,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { HELP_CATEGORIES, HELP_QUESTIONS, HelpQuestion } from '../../data/helpCenterData';
import { listenToUserTickets } from '../../services/customerService';
import { CSTicket } from '../../types';

interface HelpCenterViewProps {
  currentUser?: any;
  onNavigate: (view: string, param?: string) => void;
  onBack?: () => void;
}

export default function HelpCenterView({
  currentUser,
  onNavigate,
  onBack
}: HelpCenterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userTickets, setUserTickets] = useState<CSTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const userId = currentUser?.id || currentUser?.uid || currentUser?.email || 'guest-session';
  const userEmail = currentUser?.email || '';

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('home');
    }
  };

  // Subscribe to real tickets
  useEffect(() => {
    const unsub = listenToUserTickets(userId, userEmail, (tickets) => {
      setUserTickets(tickets);
      setLoadingTickets(false);
    });
    return () => unsub();
  }, [userId, userEmail]);

  // Filter questions for "Jawaban Singkat"
  const filteredQuestions = selectedCategory === 'all'
    ? HELP_QUESTIONS
    : HELP_QUESTIONS.filter(q => q.categoryId === selectedCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Selesai</span>
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            <span>Diproses</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-3 h-3" />
            <span>Aktif</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="help-center-root">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label="Pusat Bantuan" showText={true} />
      </div>

      {/* Greeting & Headline */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          Halo, ada yang bisa kami bantu?
        </h1>
        <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
          Temukan solusi cepat atau hubungi layanan bantuan resmi Mod Station.
        </p>
      </div>

      {/* AI Assistant CTA Row */}
      <button
        onClick={() => onNavigate('help-ai-assistant')}
        className="w-full p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] hover:border-blue-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Tanya Asisten AI
            </div>
            <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Dapatkan jawaban instan untuk kendala umum Anda
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Laporan Saya */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
            Laporan Saya
          </h2>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden">
          {loadingTickets ? (
            <div className="p-4 text-center text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Memuat data laporan...
            </div>
          ) : userTickets.length > 0 ? (
            <div className="divide-y divide-[#D2D2D7]/50 dark:divide-[#38383A]">
              {userTickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onNavigate('reports', ticket.id)}
                  className="p-3.5 hover:bg-slate-200/40 dark:hover:bg-white/5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-medium text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                      {ticket.subject || ticket.issueType || 'Laporan Kendala'}
                    </div>
                    <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                      #{ticket.id.substring(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(ticket.status)}
                    <ChevronRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Belum ada laporan aktif.
            </div>
          )}
        </div>
      </section>

      {/* Bantuan Akun */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] px-1">
          Bantuan Akun
        </h2>

        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden">
          <button
            onClick={() => onNavigate('settings-change-password')}
            className="w-full p-3.5 hover:bg-slate-200/40 dark:hover:bg-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Ganti Kata Sandi
                </div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  Perbarui kata sandi akun Anda untuk keamanan maksimal
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
          </button>
        </div>
      </section>

      {/* Jawaban Singkat */}
      <section className="space-y-3">
        <div className="space-y-1 px-1">
          <h2 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
            Jawaban Singkat
          </h2>
          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            Pilih kategori pertanyaan yang sering diajukan:
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-[#F5F5F7] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
          >
            Semua
          </button>
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#F5F5F7] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-slate-200/60 dark:hover:bg-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Question List */}
        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden divide-y divide-[#D2D2D7]/50 dark:divide-[#38383A]">
          {filteredQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onNavigate('help-ai-assistant', q.question)}
              className="w-full p-3.5 hover:bg-slate-200/40 dark:hover:bg-white/5 text-left flex items-center justify-between gap-3 group transition-colors cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] w-5 shrink-0 pt-0.5 sm:pt-0 font-medium">
                  {idx + 1}.
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug">
                  {q.question}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] shrink-0 group-hover:text-blue-600" />
            </button>
          ))}
        </div>
      </section>

      {/* Footer Navigation to Help Articles or CS */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <button
          onClick={() => onNavigate('help-articles')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-[#F5F5F7] dark:hover:bg-[#1C1C1E] text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Buka Artikel Bantuan</span>
        </button>
        <button
          onClick={() => onNavigate('customer-service')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Hubungi Customer Service</span>
        </button>
      </div>
    </div>
  );
}

