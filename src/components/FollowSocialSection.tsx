import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter, MessageCircle, Heart, Video } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface SocialLinks {
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  instagram?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

// Verified real channels for Mod Station
const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  whatsapp: 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k',
  facebook: 'https://facebook.com/ModStationOfficial',
  instagram: 'https://instagram.com/modstation.id',
  tiktok: 'https://tiktok.com/@modstation.id',
  twitter: 'https://twitter.com/modstation'
};

export default function FollowSocialSection() {
  const [links, setLinks] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    try {
      const docRef = doc(db, 'settings', 'socials');
      unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (isMounted) {
            if (snap.exists()) {
              const remoteData = snap.data() as SocialLinks;
              setLinks(prev => ({ ...prev, ...remoteData }));
            }
            setLoading(false);
          }
        },
        (err) => {
          // Gracefully fallback to default official links when offline or initializing
          if (isMounted) {
            console.warn('Remote social links offline or unavailable, using verified defaults:', err.message);
            setLoading(false);
          }
        }
      );
    } catch (err: any) {
      console.warn('Failed to listen to social links:', err?.message);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const hasLinks = Object.values(links).some(v => !!v);

  return (
    <div className="py-8 border-y border-slate-100 dark:border-white/5 my-8 flex flex-col items-center justify-center space-y-4" id="follow-mod-station-section">
      <div className="text-center space-y-1">
        <h3 className="font-bold text-base text-slate-800 dark:text-white">Follow Mod Station</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ikuti akun resmi kami untuk update aplikasi terbaru, tutorial modifikasi, dan info rilis harian.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {links.facebook && (
          <a 
            href={links.facebook} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-sm hover:scale-105"
            aria-label="Facebook Mod Station"
          >
            <Facebook className="w-5 h-5" />
          </a>
        )}
        {links.tiktok && (
          <a 
            href={links.tiktok} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2.5 bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-sm hover:scale-105"
            aria-label="TikTok Mod Station"
          >
            <Video className="w-5 h-5" />
          </a>
        )}
        {links.whatsapp && (
          <a 
            href={links.whatsapp} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all shadow-sm hover:scale-105"
            aria-label="WhatsApp Mod Station"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        )}
        {links.instagram && (
          <a 
            href={links.instagram} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition-all shadow-sm hover:scale-105"
            aria-label="Instagram Mod Station"
          >
            <Instagram className="w-5 h-5" />
          </a>
        )}
        {links.twitter && (
          <a 
            href={links.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-all shadow-sm hover:scale-105"
            aria-label="Twitter / X Mod Station"
          >
            <Twitter className="w-5 h-5" />
          </a>
        )}
        {!hasLinks && !loading && (
          <div className="flex gap-3 opacity-60">
            <span className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full"><Facebook className="w-5 h-5" /></span>
            <span className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full"><Instagram className="w-5 h-5" /></span>
            <span className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full"><Twitter className="w-5 h-5" /></span>
          </div>
        )}
      </div>

      <a 
        href={links.whatsapp || links.instagram || links.facebook || '#'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow"
      >
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        <span>Gabung Komunitas Mod Station</span>
      </a>
    </div>
  );
}
