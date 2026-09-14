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
  Search,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { HELP_QUESTIONS, HELP_ARTICLES, HelpQuestion } from '../../data/helpCenterData';
import { 
  AIProcessStep, 
  buildProcessSteps, 
  SingleProcessBanner, 
  ProcessDetailModal 
} from '../common/AIProcessStatus';

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
  isError?: boolean;
}

export default function HelpAIAssistantView({
  initialQuestion,
  onNavigate,
  onBack
}: HelpAIAssistantViewProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSteps, setProcessSteps] = useState<AIProcessStep[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('help-center');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing, processSteps]);

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check API connectivity before processing
  const checkApiConnected = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/assistant/status');
      if (res.ok) {
        const data = await res.json();
        return data.connected === true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const questionText = (textToSend || inputText).trim();
    if (!questionText || isProcessing) return;

    // 1. Add user message to thread
    const userMsgId = 'user-' + Date.now();
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: questionText,
        timestamp
      }
    ];

    setMessages(updatedMessages);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // 2. Validate API FIRST before entering processing / step animations
    const isConnected = await checkApiConnected();
    if (!isConnected) {
      // Direct Error: "Error. The API is not connected yet."
      // AI profile avatar remains IDLE (static), NO process steps started
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: 'Error. The API is not connected yet.',
          category: 'Error API',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
      return;
    }

    // 3. API is connected -> Enter PROCESSING state (AI Avatar animates!)
    setIsProcessing(true);
    const initialSteps = buildProcessSteps('text');
    
    // Set first step in_progress
    initialSteps[0].status = 'in_progress';
    setProcessSteps(initialSteps);

    // Step animation controller during API call
    let currentStepIdx = 0;
    const interval = setInterval(() => {
      setProcessSteps((prevSteps) => {
        if (!prevSteps || prevSteps.length === 0) return prevSteps;
        const next = [...prevSteps];
        if (currentStepIdx < next.length - 2) {
          next[currentStepIdx].status = 'completed';
          currentStepIdx++;
          next[currentStepIdx].status = 'in_progress';
        }
        return next;
      });
    }, 600);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text
      }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: questionText,
          conversationHistory: historyPayload
        })
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok || data.code === 'API_NOT_CONNECTED') {
        // Handle API disconnection or error
        setProcessSteps((prev) => prev.map(s => ({ ...s, status: s.status === 'in_progress' ? 'failed' : s.status })));
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            sender: 'ai',
            text: data.error?.message || 'Error. The API is not connected yet.',
            category: 'Error API',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            isError: true
          }
        ]);
        setIsProcessing(false);
        return;
      }

      // Successful API response from Gemini
      setProcessSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));

      const aiAnswer = data.answer || 'Maaf, belum ada jawaban spesifik untuk pertanyaan ini.';
      const followUps = data.suggestedTopics || [
        'Panduan instalasi APK',
        'Keamanan file di Mod Station',
        'Cara memperbarui aplikasi'
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: aiAnswer,
          category: 'Pusat Bantuan Gemini AI',
          followUps,
          feedback: null,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      clearInterval(interval);
      setProcessSteps((prev) => prev.map((s) => (s.status === 'in_progress' ? { ...s, status: 'failed' } : s)));
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: 'Terjadi kendala saat menghubungkan ke server AI Pusat Bantuan.',
          category: 'Gagal Koneksi',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      // Stop animation -> return to IDLE
      setIsProcessing(false);
    }
  };

  const handleFeedback = (msgId: string, type: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: type } : m))
    );
  };

  const isLandingMode = messages.length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-120px)]" id="help-ai-assistant-root">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
        <BackButton onBack={handleBackClick} label="Pusat Bantuan" showText={true} />
        {!isLandingMode && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setProcessSteps([]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Percakapan Baru</span>
          </button>
        )}
      </div>

      {isLandingMode ? (
        /* LANDING PAGE MODE */
        <div className="flex-1 flex flex-col justify-center space-y-6 max-w-2xl mx-auto w-full py-4">
          <div className="text-center space-y-2">
            {/* AI Avatar Profile (Static IDLE in Landing Mode) */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
              Asisten AI Pusat Bantuan (Gemini)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Tanyakan panduan instalasi APK, fitur Mod Station, dan keamanannya.
            </p>
          </div>

          {/* Unified Input Container */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-white/15 w-full shadow-xs"
          >
            <button
              type="button"
              onClick={() => handleSendMessage('Apa saja fitur Mod Station?')}
              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Pertanyaan contoh"
            >
              <Plus className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Tanya Asisten AI seputar Mod Station..."
              className="flex-1 px-2 py-1.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-[100px] w-full"
              autoFocus
              id="landing-assistant-input"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-colors cursor-pointer shrink-0"
              aria-label="Kirim"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Prompt suggestions */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Pertanyaan Populer
            </p>

            <div className="grid grid-cols-1 gap-2">
              {HELP_QUESTIONS.slice(0, 5).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSendMessage(q.question)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#161617] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left flex items-center justify-between gap-3 group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      <span className="font-bold text-slate-400 dark:text-slate-500 mr-1.5">[{q.categoryName}]</span>
                      {q.question}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CHAT VIEW MODE */
        <div className="flex-1 flex flex-col justify-between overflow-hidden pt-2">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  /* User Message */
                  <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-blue-600 text-white p-3.5 shadow-xs space-y-1 text-xs sm:text-sm leading-relaxed">
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <div className="text-[10px] text-blue-200 text-right">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AI Message & Avatar */
                  <div className="flex flex-col items-start space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2.5">
                      {/* AI Profile Avatar with synchronized animation state */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isProcessing
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-blue-500/30 animate-pulse shadow-md'
                            : msg.isError
                            ? 'bg-rose-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Gemini AI Assistant
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl rounded-tl-xs p-4 sm:p-5 text-xs sm:text-sm leading-relaxed w-full border ${
                        msg.isError
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-white dark:bg-[#161617] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Follow up options */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Rekomendasi Pertanyaan
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSendMessage(fu)}
                                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/70 dark:border-white/10 transition-colors cursor-pointer"
                              >
                                {fu}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* AI Active Processing Banner (One step visible at a time with > button) */}
            {isProcessing && processSteps.length > 0 && (
              <div className="flex flex-col items-start gap-1 my-2">
                <SingleProcessBanner
                  steps={processSteps}
                  onOpenDetail={() => setShowDetailModal(true)}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM UNIFIED INPUT COMPOSER (Optimized Alignment) */}
          <div className="pt-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-white/15 w-full shadow-xs"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Unggah lampiran"
                aria-label="Unggah lampiran"
              >
                <Plus className="w-4 h-4" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.txt"
                onChange={() => {
                  handleSendMessage('Menganalisis file lampiran...');
                }}
              />

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Tulis pertanyaan seputar Mod Station..."
                className="flex-1 px-2 py-1.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-[100px] w-full"
                id="help-assistant-chat-input"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-colors cursor-pointer shrink-0"
                title="Kirim Pesan"
                aria-label="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Process Detail Overlay Modal */}
      <ProcessDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        steps={processSteps}
      />
    </div>
  );
}
