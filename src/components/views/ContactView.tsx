import React from 'react';
import { 
  MessageSquare, Headphones, 
  ChevronRight, ExternalLink, Sparkles, 
  ShieldCheck, Share2, MessageCircle
} from 'lucide-react';
import { AppBadge } from '../common/AppBadge';
import BackButton from '../navigation/BackButton';

interface ContactViewProps {
  onNavigate: (view: string) => void;
  onBack?: () => void;
}

export default function ContactView({ onNavigate, onBack }: ContactViewProps) {
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('home');
    }
  };
  // Official social media and channels configurations for Mod Station
  const socialLinks = [
    {
      id: 'whatsapp-channel',
      name: 'Channel WhatsApp',
      handle: 'Mod Station Official Channel',
      badge: 'TERVERIFIKASI',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      url: 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k',
      description: 'Dapatkan notifikasi rilis dan pembaruan APK resmi setiap hari.',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      handle: '@ModStationOfficial',
      badge: 'KOMUNITAS',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      url: 'https://facebook.com/ModStationOfficial',
      description: 'Ikuti diskusi seputar info teknologi dan game Android terhangat.',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@modstation.id',
      badge: 'UPDATE RESMI',
      badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      url: 'https://instagram.com/modstation.id',
      description: 'Highlight update aplikasi mingguan, tips, dan trik menarik.',
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: '@modstation.id',
      badge: 'VIDEO PENDEK',
      badgeColor: 'bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white border-slate-300 dark:border-white/20',
      url: 'https://tiktok.com/@modstation.id',
      description: 'Review gameplay, rekomendasi game tersembunyi, dan showcase fitur.',
      iconBg: 'bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white'
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in" id="contact-page-container">
      {/* 1. Back Navigation */}
      <div>
        <BackButton onBack={onBack} label="Kembali" showText={true} />
      </div>

      {/* 2. Header Section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
          <Headphones className="w-3.5 h-3.5" />
          <span>Hubungi Kami</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Hubungi Kami
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Temukan cara untuk menghubungi Mod Station atau langsung chat dengan Customer Service.
        </p>
      </div>

      {/* 3. Primary Action: CHAT MOD STATION */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => onNavigate('customer-service')}
          className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-200 cursor-pointer group flex items-center justify-between text-left"
          id="btn-chat-mod-station"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Chat Mod Station
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 line-clamp-1">
                Layanan bantuan instan, respon cepat, dan pelaporan kendala akun atau unduhan.
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 group-hover:bg-white/25 transition-all">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* 4. Section: SOSIAL MEDIA */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Sosial Media
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">Saluran Resmi</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {socialLinks.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-white/10 group-hover:scale-105 transition-transform`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </h3>
                    <AppBadge
                      type="custom"
                      label={item.badge}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.handle} <span className="text-slate-300 dark:text-slate-600 mx-1">•</span> {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0">
                <span className="hidden sm:inline text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                  Buka
                </span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
