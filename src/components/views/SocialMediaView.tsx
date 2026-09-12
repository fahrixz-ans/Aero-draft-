import React from 'react';
import { 
  MessageCircle, 
  Share2, 
  Send, 
  Instagram,
  ExternalLink
} from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface SocialMediaViewProps {
  onNavigate?: (view: string) => void;
  onBack?: () => void;
}

export default function SocialMediaView({ onNavigate, onBack }: SocialMediaViewProps) {
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const socialChannels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      handle: 'Saluran Resmi Mod Station',
      description: 'Pembaruan rilis APK harian dan pengumuman keamanan.',
      link: 'https://whatsapp.com/channel/modstation',
      icon: MessageCircle,
      iconColor: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      id: 'discord',
      name: 'Discord',
      handle: 'Mod Station Community',
      description: 'Diskusi interaktif bersama sesama pengguna dan pengembang.',
      link: 'https://discord.gg/modstation',
      icon: Share2,
      iconColor: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      handle: '@modstation_official',
      description: 'Kanal mirror berkecepatan tinggi dan informasi pemeliharaan server.',
      link: 'https://t.me/modstation_official',
      icon: Send,
      iconColor: 'text-sky-500 bg-sky-500/10'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@modstation.id',
      description: 'Galeri aplikasi mingguan dan infografis tips Android.',
      link: 'https://instagram.com/modstation.id',
      icon: Instagram,
      iconColor: 'text-pink-500 bg-pink-500/10'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="social-media-view-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label="Follow Mod Station" showText={true} />
      </div>

      {/* Intro */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          Kanal Resmi
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
          Terhubunglah dengan media sosial resmi Mod Station untuk informasi pembaruan versi dan diskusi komunitas.
        </p>
      </div>

      {/* Social Channels List */}
      <div className="space-y-3">
        {socialChannels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.id}
              className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${channel.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                    {channel.name}
                  </div>
                  <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate">
                    {channel.handle}
                  </div>
                  <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] line-clamp-1">
                    {channel.description}
                  </p>
                </div>
              </div>

              <a
                href={channel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                <span>Buka</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="pt-2 text-center">
        <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
          Pastikan bergabung hanya melalui tautan resmi untuk menghindari akun palsu yang mengatasnamakan Mod Station.
        </p>
      </div>
    </div>
  );
}

