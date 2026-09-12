import React, { useState, useEffect } from 'react';
import { 
  Headphones, MessageSquare, Send, CheckCircle, 
  Clock, AlertCircle, Search, Filter, RefreshCw, 
  User, CheckCircle2, XCircle, Paperclip, 
  FileText, Bot, ShieldCheck, Mail, LogOut, CheckCheck
} from 'lucide-react';
import { CSTicket, CSMessage, CSTicketStatus, CSAttachment, AeroUser } from '../../types';
import { 
  listenToAllAdminTickets, 
  sendAgentReply, 
  updateTicketStatus,
  claimTicket,
  endTicketChat
} from '../../services/customerService';

interface AdminCustomerServiceViewProps {
  currentUser?: AeroUser | any;
}

export default function AdminCustomerServiceView({ currentUser }: AdminCustomerServiceViewProps) {
  const [tickets, setTickets] = useState<CSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CSTicketStatus | 'queue'>('all');
  
  // Reply composer state
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Subscribe to real-time tickets from Firestore
  useEffect(() => {
    setLoading(true);
    const unsub = listenToAllAdminTickets((all) => {
      setTickets(all);
      setLoading(false);
      if (!selectedTicketId && all.length > 0) {
        setSelectedTicketId(all[0].id);
      }
    });
    return () => unsub();
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'queue') {
      return matchesSearch && (t.state === 'WAITING_QUEUE' || t.state === 'REQUESTING_AGENT');
    }

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim() || isSending) return;

    setIsSending(true);
    setActionMessage(null);

    const success = await sendAgentReply(
      selectedTicketId,
      currentUser || { name: 'Admin Mod Station', email: 'admin@modstation.id' },
      replyText.trim()
    );

    setIsSending(false);
    if (success) {
      setReplyText('');
      setActionMessage('Balasan berhasil dikirim kepada pengguna.');
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setActionMessage('Gagal mengirim balasan.');
    }
  };

  const handleClaimChat = async () => {
    if (!selectedTicketId) return;
    setIsClaiming(true);
    const result = await claimTicket(selectedTicketId);
    setIsClaiming(false);

    if (result.success) {
      setActionMessage('Anda telah bergabung dan mengambil sesi chat ini.');
    } else {
      setActionMessage(result.message || 'Gagal mengambil chat.');
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleEndChatSession = async () => {
    if (!selectedTicketId) return;
    const ok = confirm('Apakah Anda yakin ingin mengakhiri dan menyelesaikan sesi chat ini?');
    if (!ok) return;

    const success = await endTicketChat(selectedTicketId);
    if (success) {
      setActionMessage('Sesi chat telah diselesaikan.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleStatusChange = async (newStatus: CSTicketStatus) => {
    if (!selectedTicketId) return;
    await updateTicketStatus(selectedTicketId, newStatus);
    setActionMessage(`Status tiket diperbarui menjadi: ${newStatus}`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const queueCount = tickets.filter(t => t.state === 'WAITING_QUEUE' || t.state === 'REQUESTING_AGENT').length;

  return (
    <div className="space-y-6 animate-fade-in" id="admin-cs-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Headphones className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Service & Tiket Bantuan
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola dan tanggapi pesan bantuan serta pelaporan kendala pengguna secara real-time.
          </p>
        </div>

        {/* Status Counts Summary */}
        <div className="flex items-center gap-2 flex-wrap">
          {queueCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              {queueCount} Antrean Menunggu
            </span>
          )}
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            {tickets.filter(t => t.status === 'open').length} Terbuka
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
            {tickets.filter(t => t.status === 'in_progress').length} Diproses
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length} Selesai
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Grid: Ticket List (Left) + Active Conversation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TICKETS LIST */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode tiket, nama, email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(['all', 'queue', 'open', 'in_progress', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer shrink-0 ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#131924] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-blue-500/40'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st === 'queue' ? `Antrean (${queueCount})` : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                Memuat percakapan...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 text-xs text-slate-400">
                Tidak ada tiket yang cocok.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const isWaitingQueue = t.state === 'WAITING_QUEUE' || t.state === 'REQUESTING_AGENT';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                        : 'bg-white dark:bg-[#131924] border-slate-200 dark:border-white/10 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                            {t.ticketCode}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {t.category}
                          </span>
                          {isWaitingQueue && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              Antrean
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {t.userName} ({t.userEmail})
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {t.lastMessage}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isWaitingQueue
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : t.status === 'open'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : t.status === 'in_progress'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isWaitingQueue ? 'Antrean' : t.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(t.updatedAt || t.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONVERSATION THREAD */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="rounded-3xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[580px]">
              {/* Ticket Info Header */}
              <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                      {selectedTicket.ticketCode}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedTicket.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pengguna: <strong className="text-slate-600 dark:text-slate-300">{selectedTicket.userName}</strong> ({selectedTicket.userEmail})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Claim Button if in Queue or Open */}
                  {(selectedTicket.state === 'WAITING_QUEUE' || selectedTicket.state === 'REQUESTING_AGENT' || selectedTicket.status === 'open') && selectedTicket.state !== 'IN_AGENT_CHAT' && (
                    <button
                      type="button"
                      onClick={handleClaimChat}
                      disabled={isClaiming}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>{isClaiming ? 'Mengambil...' : 'Ambil Chat'}</span>
                    </button>
                  )}

                  {/* End Chat Button */}
                  {selectedTicket.state === 'IN_AGENT_CHAT' && (
                    <button
                      type="button"
                      onClick={handleEndChatSession}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Selesaikan Chat</span>
                    </button>
                  )}

                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as CSTicketStatus)}
                    aria-label="Pilih status tiket bantuan"
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="open">Open (Terbuka)</option>
                    <option value="in_progress">In Progress (Diproses)</option>
                    <option value="resolved">Resolved (Selesai)</option>
                    <option value="closed">Closed (Ditutup)</option>
                  </select>
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[420px] bg-slate-50/30 dark:bg-black/10">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => {
                    const isAgent = m.senderType === 'agent';
                    const isSystem = m.senderType === 'system';
                    const isAI = m.senderType === 'ai' || m.senderType === 'bot';

                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center my-2">
                          <div className="px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center max-w-sm">
                            {m.message}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isAgent && (
                          <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                            isAI ? 'bg-blue-600' : 'bg-slate-500'
                          }`}>
                            {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          </div>
                        )}

                        <div className={`max-w-[85%] space-y-1 ${isAgent ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 px-1">
                            <span>{m.senderName || (isAgent ? 'Agen CS' : 'Pengguna')}</span>
                            <span>•</span>
                            <span>{formatTimeOnly(m.createdAt)}</span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                              isAgent
                                ? 'bg-emerald-600 text-white rounded-tr-xs'
                                : isAI
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-slate-800 dark:text-slate-200 border border-blue-200 dark:border-blue-900/50 rounded-tl-xs'
                                : 'bg-white dark:bg-[#1a2333] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-tl-xs'
                            }`}
                          >
                            {m.message}

                            {/* Attachments */}
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 space-y-1.5 pt-2 border-t border-black/10 dark:border-white/10">
                                {m.attachments.map((att, idx) => (
                                  <div key={idx} className="rounded-lg overflow-hidden">
                                    {att.type.startsWith('image/') ? (
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="max-h-48 rounded-lg object-contain bg-black/20"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2 p-1.5 rounded bg-black/10 text-[11px] font-mono">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="truncate flex-1">{att.name}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {isAgent && (
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Headphones className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Belum ada pesan dalam tiket ini.
                  </div>
                )}
              </div>

              {/* Reply Composer */}
              <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#131924]">
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tulis balasan Customer Service resmi kepada pengguna..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Balasan</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 text-xs text-slate-400">
              Pilih salah satu tiket dari daftar di samping untuk melihat percakapan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
