import React, { useState, useEffect, useRef } from 'react';
import { 
  History, Headphones, Send, Plus, 
  Paperclip, Image as ImageIcon, X, Clock, 
  HelpCircle, ChevronRight, AlertCircle, Sparkles, 
  CheckCircle2, FileText, RefreshCw, Bot, 
  User as UserIcon, LogOut, RotateCcw, Check, CheckCheck
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { 
  AeroUser, CSTicket, CSMessage, CSAttachment, 
  CSTicketStatus, CSConversationState, CSAction 
} from '../../types';
import { 
  sendUserTicketMessage, 
  requestHumanAgent,
  cancelHumanAgentRequest,
  endTicketChat,
  listenToUserTickets, 
  listenToSingleTicket, 
  QUICK_HELP_OPTIONS,
  QUICK_CATEGORIES 
} from '../../services/customerService';

interface CustomerServiceViewProps {
  currentUser?: AeroUser | any | null;
  onNavigate: (view: string, id?: string) => void;
  onSignIn?: () => void;
  initialTicketId?: string;
  onBack?: () => void;
}

export default function CustomerServiceView({
  currentUser,
  onNavigate,
  onSignIn,
  initialTicketId,
  onBack
}: CustomerServiceViewProps) {
  // Navigation internal mode: 'chat' | 'reports'
  const [viewMode, setViewMode] = useState<'chat' | 'reports'>('chat');

  // Real data state
  const [userTickets, setUserTickets] = useState<CSTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId || null);
  const [activeTicket, setActiveTicket] = useState<CSTicket | null>(null);
  
  // WhatsApp-like Controlled Chat composer state
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<CSAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string>('Meninjau permintaan..');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derive authenticated user identity cleanly without hardcoding
  const userId = currentUser?.id || currentUser?.uid || currentUser?.email || 'guest-session';
  const userEmail = currentUser?.email || '';
  const userName = currentUser?.name || (userEmail ? userEmail.split('@')[0] : '');
  const greetingName = userName ? `Hai ${userName}` : 'Hai!';

  // 1. Multi-step AI thinking indicator animation
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (isSending) {
      setThinkingStep('Meninjau permintaan..');
      timer1 = setTimeout(() => {
        setThinkingStep('Berpikir....');
      }, 900);
      timer2 = setTimeout(() => {
        setThinkingStep('Mendapatkan jawaban...');
      }, 1800);
      timer3 = setTimeout(() => {
        setThinkingStep('Merespon...');
      }, 2700);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isSending]);

  // 2. Subscribe to User's Tickets list in Firestore
  useEffect(() => {
    const unsub = listenToUserTickets(userId, userEmail, (tickets) => {
      setUserTickets(tickets);
    });
    return () => unsub();
  }, [userId, userEmail]);

  // 3. Subscribe to Single Active Ticket in Firestore with optimistic reconciliation
  useEffect(() => {
    if (!activeTicketId) {
      setActiveTicket(null);
      return;
    }
    const unsub = listenToSingleTicket(activeTicketId, (incomingTicket) => {
      if (!incomingTicket) return;
      setActiveTicket((prev) => {
        if (!prev) return incomingTicket;
        
        // Preserve any pending optimistic / failed messages not yet saved in Firestore
        const incomingIds = new Set((incomingTicket.messages || []).map(m => m.id));
        const pendingOptimistic = (prev.messages || []).filter(
          m => (m.status === 'sending' || m.status === 'failed') && !incomingIds.has(m.id)
        );

        return {
          ...incomingTicket,
          messages: [...(incomingTicket.messages || []), ...pendingOptimistic]
        };
      });
    });
    return () => unsub();
  }, [activeTicketId]);

  // Auto-scroll on new messages or thinking state
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (viewMode === 'chat') {
      scrollToBottom('smooth');
    }
  }, [activeTicket?.messages, viewMode, isSending]);

  // Handle auto-adjusting textarea height like WhatsApp
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Keyboard handler: Enter sends message, Shift+Enter makes newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send message implementation with Optimistic UI
  const handleSendMessage = async (customText?: string, customCategory?: string, customAttachments?: CSAttachment[], retryMsgId?: string) => {
    const textToSend = customText !== undefined ? customText.trim() : inputText.trim();
    const attachmentsToSend = customAttachments || attachments;

    if (!textToSend && attachmentsToSend.length === 0) return;

    // Generate unique client message ID for deduplication
    const clientMsgId = retryMsgId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // 1. Optimistic User Bubble creation
    const optimisticMsg: CSMessage = {
      id: clientMsgId,
      ticketId: activeTicketId || '',
      senderId: userId,
      senderType: 'user',
      senderName: userName || 'Anda',
      message: textToSend,
      attachments: attachmentsToSend,
      createdAt: nowIso,
      status: 'sending'
    };

    // 2. IMMEDIATELY Clear input & attachments (WhatsApp style)
    if (customText === undefined) {
      setInputText('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setUploadError(null);

    // 3. IMMEDIATELY update local state with optimistic user bubble
    setActiveTicket((prev) => {
      if (prev) {
        const filtered = (prev.messages || []).filter(m => m.id !== clientMsgId);
        return {
          ...prev,
          lastMessage: textToSend || (attachmentsToSend.length > 0 ? 'Lampiran dikirim' : ''),
          updatedAt: nowIso,
          messages: [...filtered, optimisticMsg]
        };
      } else {
        return {
          id: '',
          ticketCode: '#CS-BARU',
          userId,
          userName: userName || 'Pengguna',
          userEmail: userEmail || 'pengguna@modstation.id',
          userAvatar: currentUser?.avatar || '',
          category: customCategory || 'Umum',
          subject: textToSend.length > 50 ? `${textToSend.substring(0, 47)}...` : textToSend || 'Kendala Pengguna',
          status: 'open',
          state: 'AI_CHAT',
          lastMessage: textToSend || 'Lampiran dikirim',
          messages: [optimisticMsg],
          createdAt: nowIso,
          updatedAt: nowIso
        };
      }
    });

    // 4. Scroll down immediately to user bubble
    setTimeout(() => scrollToBottom('smooth'), 50);

    // 5. Start background AI / Server processing
    setIsSending(true);

    try {
      const res = await sendUserTicketMessage({
        ticketId: activeTicketId || undefined,
        messageId: clientMsgId,
        userId,
        userName: userName || 'Pengguna',
        userEmail: userEmail || 'pengguna@modstation.id',
        userAvatar: currentUser?.avatar || '',
        messageText: textToSend,
        category: customCategory || 'Umum',
        attachments: attachmentsToSend
      });

      if (res.ticket) {
        if (!activeTicketId && res.ticket.id) {
          setActiveTicketId(res.ticket.id);
        }
        // Reconcile and set confirmed ticket state
        setActiveTicket(res.ticket);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (err: any) {
      console.warn('[CS Send Error]', err);
      // Mark message as failed in UI with retry option
      setActiveTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map(m => m.id === clientMsgId ? { ...m, status: 'failed' } : m)
        };
      });
      setUploadError('Gagal mengirim pesan ke server. Silakan klik "Coba lagi".');
    } finally {
      setIsSending(false);
    }
  };

  // Retry sending a failed message
  const handleRetryMessage = (failedMsg: CSMessage) => {
    handleSendMessage(failedMsg.message, activeTicket?.category, failedMsg.attachments, failedMsg.id);
  };

  // Handle Quick Help Button trigger
  const handleQuickHelpClick = async (question: string) => {
    await handleSendMessage(question);
  };

  // Handle Quick Category Button trigger
  const handleCategoryClick = async (categoryTitle: string, queryPrompt?: string) => {
    const promptText = queryPrompt || `Kendala: ${categoryTitle}`;
    await handleSendMessage(promptText, categoryTitle);
  };

  // Handle Action Click from Famo AI response
  const handleActionClick = async (action: CSAction) => {
    if (action.type === 'REQUEST_HUMAN_AGENT') {
      if (!activeTicket?.id) {
        await handleSendMessage('Saya ingin terhubung dengan Customer Service Mod Station');
      } else {
        await handleRequestAgent(activeTicket.id);
      }
    } else if (action.type === 'OPEN_FAQ' || action.type === 'OPEN_HELP') {
      onNavigate('faq');
    } else if (action.type === 'OPEN_REPORT_HISTORY') {
      setViewMode('reports');
    } else if (action.type === 'OPEN_APP' && action.targetId) {
      onNavigate('app-detail', action.targetId);
    } else if (action.type === 'OPEN_GAME') {
      onNavigate('games');
    }
  };

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Ukuran file melebihi batas ${MAX_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newAttachment: CSAttachment = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        url: result,
        size: file.size
      };
      setAttachments(prev => [...prev, newAttachment]);
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca berkas lampiran.');
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Request Human Agent Queue
  const handleRequestAgent = async (ticketId: string, category?: string) => {
    setIsSending(true);
    try {
      const res = await requestHumanAgent({ ticketId, category });
      if (res.ticket) {
        setActiveTicket(res.ticket);
      }
    } catch (err) {
      console.warn('Error entering agent queue:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Cancel Human Agent Queue
  const handleCancelAgent = async () => {
    if (!activeTicket?.id) return;
    setIsSending(true);
    try {
      await cancelHumanAgentRequest(activeTicket.id);
    } catch (err) {
      console.warn('Error cancelling agent queue:', err);
    } finally {
      setIsSending(false);
    }
  };

  // End active agent chat
  const handleEndChat = async () => {
    if (!activeTicket?.id) return;
    setIsEndingChat(true);
    try {
      await endTicketChat(activeTicket.id);
      setShowEndChatModal(false);
    } catch (err) {
      console.warn('Error ending chat:', err);
    } finally {
      setIsEndingChat(false);
    }
  };

  // Format timestamp safely
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: CSTicketStatus, state?: CSConversationState) => {
    if (state === 'WAITING_QUEUE' || state === 'REQUESTING_AGENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-500 animate-spin" />
          Dalam Antrean
        </span>
      );
    }

    if (state === 'IN_AGENT_CHAT' || state === 'AGENT_ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live CS
        </span>
      );
    }

    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Bot className="w-3 h-3 text-blue-500" />
            Famo AI
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Diproses
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Selesai
          </span>
        );
      default:
        return null;
    }
  };

  const isInQueue = activeTicket?.state === 'WAITING_QUEUE' || activeTicket?.state === 'REQUESTING_AGENT';
  const isInAgentChat = activeTicket?.state === 'IN_AGENT_CHAT' || activeTicket?.state === 'AGENT_ASSIGNED';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-120px)]" id="customer-service-container">
      {/* 1. Header Customer Service */}
      <header className="flex items-center justify-between pb-3 mb-2 border-b border-[#D2D2D7]/60 dark:border-[#38383A] shrink-0">
        <div className="flex items-center gap-3">
          <BackButton 
            onClick={() => {
              if (viewMode === 'reports') {
                setViewMode('chat');
              } else if (activeTicket) {
                setActiveTicket(null);
                setActiveTicketId(null);
              } else if (onBack) {
                onBack();
              } else if (window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate('help-center');
              }
            }}
            label="Customer Service"
            showText={true}
          />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {isInAgentChat && (
            <button
              type="button"
              onClick={() => setShowEndChatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Akhiri Sesi Chat"
              id="btn-akhiri-chat-header"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Akhiri</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode(prev => prev === 'chat' ? 'reports' : 'chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              viewMode === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-[#F5F5F7] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
            title="Buka Riwayat Laporan"
            id="btn-riwayat-laporan"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laporan</span>
            {userTickets.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewMode === 'reports' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}>
                {userTickets.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. MODE: RIWAYAT LAPORAN */}
      {viewMode === 'reports' ? (
        <div className="flex-1 overflow-y-auto space-y-3" id="reports-history-view">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Riwayat Laporan & Tiket Bantuan
            </h2>
            <button
              onClick={() => {
                setActiveTicketId(null);
                setViewMode('chat');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tiket Baru</span>
            </button>
          </div>

          {userTickets.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-white/5 flex items-center justify-center mx-auto text-[#6E6E73] dark:text-[#A1A1A6]">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Belum ada riwayat laporan.
              </p>
              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] max-w-sm mx-auto">
                Jika Anda mengalami kendala saat mengunduh atau menggunakan Mod Station, silakan kirimkan pesan pada kami.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden divide-y divide-[#D2D2D7]/50 dark:divide-[#38383A]">
              {userTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setActiveTicketId(ticket.id);
                    setViewMode('chat');
                  }}
                  className={`p-3.5 hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    activeTicketId === ticket.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {ticket.ticketCode || `#CS-${ticket.id.slice(-5)}`}
                      </span>
                      <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">•</span>
                      <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                        {ticket.category || 'Umum'}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                      {ticket.subject || ticket.lastMessage}
                    </h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {getStatusBadge(ticket.status, ticket.state)}
                    <ChevronRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 3. MODE: CHAT CUSTOMER SERVICE */
        <div className="flex-1 flex flex-col min-h-0 relative" id="cs-chat-view">
          {/* Active Ticket Header */}
          {activeTicket && activeTicket.id && (
            <div className="px-3.5 py-2 mb-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {activeTicket.ticketCode}
                </span>
                <span className="text-[#6E6E73] dark:text-[#A1A1A6] truncate max-w-[200px]">
                  {activeTicket.subject}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(activeTicket.status, activeTicket.state)}
                <button
                  onClick={() => setActiveTicketId(null)}
                  className="p-1 rounded-lg text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white cursor-pointer"
                  title="Tutup tiket ini"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Scrollable Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3 min-h-0" id="chat-messages-container">
            {/* Profil Customer Service & Greeting Section */}
            {(!activeTicket?.messages || activeTicket.messages.length === 0) && (
              <div className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] space-y-4">
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Customer Service Mod Station
                    </h2>
                    <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                      Kami siap membantu Anda.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Agen tersedia</span>
                  </div>
                </div>

                {/* Quick Help Buttons */}
                <div className="space-y-2 pt-2 border-t border-[#D2D2D7]/40 dark:border-[#38383A]">
                  <p className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6]">
                    Pilih topik atau kendala cepat:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_HELP_OPTIONS.map((btnText) => (
                      <button
                        key={btnText}
                        type="button"
                        disabled={isSending}
                        onClick={() => handleQuickHelpClick(btnText)}
                        className="w-full text-left p-3 rounded-xl bg-white dark:bg-white/5 border border-[#D2D2D7]/50 dark:border-white/5 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="line-clamp-1">{btnText}</span>
                        <ChevronRight className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] group-hover:text-blue-600 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Category Buttons */}
                <div className="space-y-2 pt-2 border-t border-[#D2D2D7]/40 dark:border-[#38383A]">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        disabled={isSending}
                        onClick={() => handleCategoryClick(cat, `Kendala: ${cat}`)}
                        className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#D2D2D7]/50 dark:border-white/5 hover:border-blue-500/50 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Queue State Card */}
            {isInQueue && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Menghubungkan Anda ke antrean Customer Service
                    </h3>
                    <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                      Urutan antrean Anda: <strong className="text-amber-600 dark:text-amber-400 font-mono">{activeTicket?.queuePosition || 1}</strong>. Perkiraan tunggu sekitar <strong className="text-amber-600 dark:text-amber-400 font-mono">{activeTicket?.estimatedWaitMinutes || 2} menit</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCancelAgent}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-200 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
                  >
                    Batal Antrean
                  </button>
                </div>
              </div>
            )}

            {/* Render Actual Thread Messages */}
            {activeTicket?.messages && activeTicket.messages.length > 0 && (
              <div className="space-y-3 pt-1">
                {activeTicket.messages.map((msg) => {
                  const isUser = msg.senderType === 'user';
                  const isSystem = msg.senderType === 'system';
                  const isAI = msg.senderType === 'ai' || msg.senderType === 'bot';
                  const isPending = msg.status === 'sending';
                  const isFailed = msg.status === 'failed';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/50 dark:border-[#38383A] text-center max-w-md">
                          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
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
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            <Headphones className="w-3 h-3" />
                            <span>{msg.senderName || 'Customer Service'}</span>
                          </div>
                        )}
                        <p className="whitespace-pre-line">{msg.message}</p>

                        {/* Action Buttons in AI/CS response */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#D2D2D7]/40 dark:border-white/10 flex flex-col gap-1.5">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleActionClick(act)}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  act.type === 'REQUEST_HUMAN_AGENT'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-white dark:bg-white/10 hover:bg-slate-100 text-[#1D1D1F] dark:text-[#F5F5F7]'
                                }`}
                              >
                                <span>{act.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5 pt-1.5 border-t border-white/20 dark:border-white/10">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className="rounded-xl overflow-hidden">
                                {att.type.startsWith('image/') ? (
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    className="max-h-48 rounded-xl object-contain bg-black/10"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/10 text-xs">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span className="truncate flex-1">{att.name}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isUser && (
                          <span>
                            {isPending ? '• Mengirim...' : (isFailed ? '• Gagal' : '• Terkirim')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Multi-Step Thinking Indicator */}
            {isSending && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/50 dark:border-[#38383A] w-fit">
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                  {thinkingStep}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview & Error Alert */}
          {uploadError && (
            <div className="p-2.5 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="p-1 hover:text-red-800 dark:hover:text-red-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 mb-2 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] shrink-0">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 text-xs">
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 text-[#6E6E73] hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* BOTTOM CHAT COMPOSER */}
          <div className="pt-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.txt,.zip"
              className="hidden"
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A]"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
                title="Unggah lampiran"
              >
                <Plus className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Tulis pesan..."
                className="flex-1 px-2 py-1.5 text-xs sm:text-sm bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#6E6E73] dark:placeholder-[#A1A1A6] focus:outline-none resize-none max-h-[100px]"
                id="cs-message-input"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-colors cursor-pointer shrink-0"
                title="Kirim Pesan"
                id="btn-send-message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to End Chat */}
      {showEndChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Akhiri Sesi Chat CS?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Percakapan dengan Customer Service akan diselesaikan dan disimpan secara otomatis ke Riwayat Laporan Anda.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEndChatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEndChat}
                disabled={isEndingChat}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isEndingChat && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Akhiri Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
