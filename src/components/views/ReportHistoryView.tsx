import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Send, 
  Plus, 
  MessageSquare, 
  ShieldCheck,
  Headphones,
  Paperclip,
  Check,
  X
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { listenToUserTickets, listenToSingleTicket, sendUserTicketMessage } from '../../services/customerService';
import { CSTicket, CSMessage } from '../../types';

interface ReportHistoryViewProps {
  currentUser?: any;
  initialTicketId?: string | null;
  onNavigate: (view: string, param?: string) => void;
  onBack?: () => void;
}

export default function ReportHistoryView({
  currentUser,
  initialTicketId,
  onNavigate,
  onBack
}: ReportHistoryViewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [tickets, setTickets] = useState<CSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId || null);
  const [selectedTicket, setSelectedTicket] = useState<CSTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const userId = currentUser?.id || currentUser?.uid || currentUser?.email || 'guest-session';
  const userEmail = currentUser?.email || '';
  const userName = currentUser?.name || (userEmail ? userEmail.split('@')[0] : 'Pengguna');

  const handleBackClick = () => {
    if (selectedTicketId) {
      setSelectedTicketId(null);
      setSelectedTicket(null);
    } else if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('help-center');
    }
  };

  // Subscribe to all tickets of current user
  useEffect(() => {
    const unsub = listenToUserTickets(userId, userEmail, (fetched) => {
      setTickets(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [userId, userEmail]);

  // Subscribe to single ticket when selected
  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }
    const unsub = listenToSingleTicket(selectedTicketId, (ticket) => {
      setSelectedTicket(ticket);
    });
    return () => unsub();
  }, [selectedTicketId]);

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (filter === 'active') {
      return t.status === 'open' || t.status === 'in_progress';
    }
    if (filter === 'resolved') {
      return t.status === 'resolved' || t.status === 'closed';
    }
    return true;
  });

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
      case 'in_progress':
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

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicketId || isSending) return;
    const text = replyText.trim();
    setReplyText('');
    setIsSending(true);

    try {
      await sendUserTicketMessage({
        ticketId: selectedTicketId,
        userId,
        userName,
        userEmail,
        messageText: text,
        category: selectedTicket?.category || 'Laporan'
      });
    } catch (err) {
      console.error('Error replying to ticket:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 1. DETAIL LAPORAN VIEW
  if (selectedTicketId && selectedTicket) {
    const isClosed = selectedTicket.status === 'resolved' || selectedTicket.status === 'closed';

    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="report-detail-root">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton onBack={handleBackClick} label="Detail Laporan" showText={true} />
          {getStatusBadge(selectedTicket.status)}
        </div>

        {/* Ticket Header Card */}
        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] p-4 sm:p-5 space-y-3">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
              {selectedTicket.subject || selectedTicket.issueType || 'Laporan Kendala'}
            </h1>
            <p className="text-xs font-mono text-[#6E6E73] dark:text-[#A1A1A6]">
              {selectedTicket.ticketCode || `#FTR-${selectedTicket.id.substring(0, 8).toUpperCase()}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D2D2D7]/40 dark:border-[#38383A] text-xs">
            <div>
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Kategori:</span>
              <p className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{selectedTicket.category || 'Umum'}</p>
            </div>
            <div>
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Dibuat:</span>
              <p className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{formatDate(selectedTicket.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Messages / Conversation List */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] px-1">
            Percakapan & Tindak Lanjut
          </h2>

          <div className="space-y-3">
            {(selectedTicket.messages || []).map((msg, index) => {
              const isUser = msg.senderType === 'user' || msg.senderId === userId;
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-[#F5F5F7] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] border border-[#D2D2D7]/60 dark:border-[#38383A] rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        {msg.senderName || 'Customer Service'}
                      </p>
                    )}
                    <p className="whitespace-pre-line">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] mt-1 px-1">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reply Area or Closed Banner */}
        {isClosed ? (
          <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Laporan telah diselesaikan
            </p>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
              Tiket ini telah ditutup. Jika memiliki kendala baru, silakan buat laporan baru.
            </p>
          </div>
        ) : (
          <div className="sticky bottom-4 pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="flex items-center gap-2 p-2 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] shadow-sm"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tulis balasan..."
                disabled={isSending}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#6E6E73] dark:placeholder-[#A1A1A6] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                aria-label="Kirim balasan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 2. LIST LAPORAN VIEW
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="report-history-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label="Riwayat Laporan" showText={true} />
        <button
          onClick={() => onNavigate('customer-service')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Laporan</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/40 dark:border-[#38383A] max-w-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
              : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F]'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 py-1 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-white dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
              : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F]'
          }`}
        >
          Aktif
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`flex-1 py-1 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'resolved'
              ? 'bg-white dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
              : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F]'
          }`}
        >
          Selesai
        </button>
      </div>

      {/* List Container */}
      <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            Memuat riwayat laporan...
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="divide-y divide-[#D2D2D7]/50 dark:divide-[#38383A]">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="p-4 hover:bg-slate-200/40 dark:hover:bg-white/5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="space-y-1 truncate">
                  <div className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                    {t.subject || t.issueType || 'Laporan Kendala'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                    <span>{t.ticketCode || `#FTR-${t.id.substring(0, 8).toUpperCase()}`}</span>
                    <span>•</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(t.status)}
                  <ChevronRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-[#6E6E73] dark:text-[#A1A1A6] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Belum ada laporan
            </p>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] max-w-xs mx-auto">
              Anda belum memiliki tiket atau laporan kendala pada filter ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
