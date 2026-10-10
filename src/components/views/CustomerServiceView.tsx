import React, { useState } from 'react';
import { 
  Headphones, MessageSquare, Send, Mail, Phone, Clock, 
  CheckCircle, AlertCircle, HelpCircle, FileText, ChevronRight,
  ExternalLink, Sparkles, MessageCircle, ShieldCheck
} from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface CustomerServiceViewProps {
  currentUser?: any;
  onNavigate: (view: string, id?: string) => void;
  onSignIn?: () => void;
  onBack?: () => void;
}

export default function CustomerServiceView({ 
  currentUser, 
  onNavigate, 
  onSignIn, 
  onBack 
}: CustomerServiceViewProps) {
  const [topic, setTopic] = useState('general');
  const [name, setName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('home');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedTicket = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
      setTicketId(generatedTicket);
      setIsSubmitting(false);
      setIsSubmitted(true);
      setMessage('');
    }, 800);
  };

  const contactChannels = [
    {
      id: 'wa',
      title: 'WhatsApp Official Support',
      desc: 'Respon cepat untuk kendala instalasi dan verifikasi akun',
      action: 'Chat di WhatsApp',
      link: 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k',
      icon: MessageCircle,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'email',
      title: 'Email Bantuan Pengguna',
      desc: 'Kirimkan laporan bug atau kendala teknis mendalam',
      action: 'support@modstation.id',
      link: 'mailto:support@modstation.id',
      icon: Mail,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    {
      id: 'ai-help',
      title: 'AI Assistant & Panduan',
      desc: 'Dapatkan solusi instan seputar error APK, SHA-256, dan versi OS',
      action: 'Buka AI Assistant',
      onClick: () => onNavigate('help-ai'),
      icon: Sparkles,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBackClick} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Layanan Pelanggan & Bantuan</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Online 24/7
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pusat bantuan resmi Mod Station. Kami siap membantu Anda terkait download, instalasi, dan keamanan APK.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactChannels.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border ${item.color} bg-white dark:bg-gray-900/60 transition-all hover:shadow-md flex flex-col justify-between`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-current/10">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{item.desc}</p>
              </div>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {item.action}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline text-left"
                >
                  {item.action}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Ticket & Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kirim Tiket Permintaan Bantuan</h2>
          </div>

          {isSubmitted ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tiket Berhasil Dikirim!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Nomor Tiket Anda adalah <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{ticketId}</span>. Tim kami akan merespons melalui email dalam waktu maksimal 24 jam.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Kirim Pertanyaan Lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Lengkap / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Alamat Email Kontak
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Kategori Permasalahan
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="general">Pertanyaan Umum</option>
                  <option value="install">Gagal Instal / Parse Error APK</option>
                  <option value="security">Laporan Keamanan & Hash SHA-256</option>
                  <option value="developer">Pertanyaan Akun Developer / Upload APK</option>
                  <option value="report">Laporkan Aplikasi / Mod Kadaluarsa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi Masalah / Pertanyaan
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Jelaskan kendala Anda secara rinci (nama aplikasi, tipe HP, versi Android)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Data terlindungi dan tidak akan dipublikasikan.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Mengirim...' : 'Kirim Tiket'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick FAQ / Info sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Pertanyaan Sering Ditanyakan
            </h3>
            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('help-center')}
                className="w-full text-left p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-between"
              >
                <span>Cara mengatasi "App not installed"</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('help-center')}
                className="w-full text-left p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-between"
              >
                <span>Bagaimana verifikasi SHA-256 APK?</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('developer-register')}
                className="w-full text-left p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-between"
              >
                <span>Cara mendaftar jadi Developer</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
            <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Jam Operasional
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400/90 leading-relaxed">
              Tim support beroperasi setiap hari Senin - Minggu (08:00 - 22:00 WIB). Respon melalui sistem AI Assistant aktif 24 jam nonstop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
