import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calendar, Clock, ArrowRight, Share2, AlertCircle, RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { AppData, EventItem } from '../../types';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

interface EventDetailViewProps {
  eventId: string;
  apps: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onSelectApp: (app: AppData) => void;
  onBack: () => void;
}

export default function EventDetailView({
  eventId,
  apps = [],
  onNavigate,
  onSelectApp,
  onBack
}: EventDetailViewProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch event details from Firestore or fallback to aggregated catalog events
  const loadEventData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try fetching directly from Firestore 'events' collection
      let foundEvent: EventItem | null = null;
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          foundEvent = {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            mediaType: data.mediaType || 'image',
            mediaUrl: data.mediaUrl || data.imageUrl || data.image,
            imageUrl: data.imageUrl || data.image || data.mediaUrl,
            thumbnailUrl: data.thumbnailUrl || data.posterUrl,
            appId: data.appId || data.appSlug,
            startAt: data.startAt || data.startDate,
            endAt: data.endAt || data.endDate,
            isActive: data.isActive !== false,
            tag: data.tag || 'Event Aktif'
          };
        }
      } catch (err) {
        console.warn('Firestore direct event fetch notice:', err);
      }

      // 2. If not found in direct doc, query all events collection
      if (!foundEvent) {
        try {
          const snap = await getDocs(collection(db, 'events'));
          snap.forEach(d => {
            if (d.id === eventId || `event-banner-${d.id}` === eventId) {
              const data = d.data();
              foundEvent = {
                id: d.id,
                title: data.title || '',
                description: data.description || '',
                mediaType: data.mediaType || 'image',
                mediaUrl: data.mediaUrl || data.imageUrl || data.image,
                imageUrl: data.imageUrl || data.image || data.mediaUrl,
                thumbnailUrl: data.thumbnailUrl || data.posterUrl,
                appId: data.appId || data.appSlug,
                startAt: data.startAt || data.startDate,
                endAt: data.endAt || data.endDate,
                isActive: data.isActive !== false,
                tag: data.tag || 'Event Aktif'
              };
            }
          });
        } catch (e) {
          console.warn('Firestore events collection query notice:', e);
        }
      }

      // 3. Fallback mock / curated events if ID matches known demo IDs or derived catalog banners
      if (!foundEvent) {
        // Build sample events from apps
        const matchedApp = apps.find(a => a.id === eventId || a.slug === eventId);
        if (matchedApp) {
          foundEvent = {
            id: matchedApp.id,
            title: `Festival Pembaruan Resmi: ${matchedApp.name}`,
            description: `Nikmati pembaruan versi terbaru dari ${matchedApp.name}. Didukung verifikasi SHA-256 dan unduhan berkecepatan tinggi tanpa iklan interstitial di Mod Station.`,
            mediaType: 'image',
            mediaUrl: matchedApp.screenshots?.[0] || matchedApp.icon,
            imageUrl: matchedApp.screenshots?.[0] || matchedApp.icon,
            appId: matchedApp.id,
            startAt: new Date(Date.now() - 86400000).toISOString(),
            endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
            isActive: true,
            tag: 'Event Aplikasi'
          };
        }
      }

      if (foundEvent) {
        setEvent(foundEvent);

        // Load related events (exclude current)
        const allEvs: EventItem[] = [
          {
            id: 'event-tiktok-live-fest',
            title: 'Kompetisi Musik Terbesar TikTok LIVE & Gift Virtual Eksklusif',
            description: 'Gabung sekarang dan dapatkan 5 gift virtual eksklusif serta tonton live stream kreator favorit Anda.',
            mediaType: 'image',
            mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop&q=80',
            tag: 'Kompetisi',
            endAt: new Date(Date.now() + 3 * 86400000).toISOString()
          },
          {
            id: 'event-whatsapp-security',
            title: 'Audit Keamanan Berkas APK & Verifikasi SHA-256 Mod Station',
            description: 'Pelajari bagaimana Mod Station melindungi perangkat Anda dari file modifikasi berbahaya.',
            mediaType: 'image',
            mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop&q=80',
            tag: 'Keamanan',
            endAt: new Date(Date.now() + 11 * 3600000).toISOString()
          },
          {
            id: 'event-game-weekend',
            title: 'Turnamen Game RPG Mobile Akhir Pekan Berhadiah Poin',
            description: 'Uji kemampuan strategi Anda di arena game populer minggu ini.',
            mediaType: 'image',
            mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=450&fit=crop&q=80',
            tag: 'Turnamen',
            endAt: new Date(Date.now() + 5 * 86400000).toISOString()
          }
        ];

        setRelatedEvents(allEvs.filter(e => e.id !== foundEvent?.id));
      } else {
        setError('Acara tidak ditemukan di database Mod Station.');
      }
    } catch (err: any) {
      console.error('Error loading event detail:', err);
      setError('Gagal memuat detail acara. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [eventId]);

  // Handle video autoplay when active
  useEffect(() => {
    if (event?.mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [event]);

  // Calculate dynamic countdown / expiration text
  const getEventStatusText = (endAt?: string) => {
    if (!endAt) return 'Acara • Berlangsung Aktif';
    const now = new Date().getTime();
    const end = new Date(endAt).getTime();
    const diffMs = end - now;

    if (diffMs <= 0) {
      return 'Acara telah berakhir';
    }

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) {
      return `Acara • Berakhir dalam ${diffDays} hari`;
    } else if (diffHrs > 0) {
      return `Acara • Berakhir dalam ${diffHrs} jam`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `Acara • Berakhir dalam ${Math.max(1, diffMins)} menit`;
    }
  };

  // Find linked application if appId is present
  const linkedApp = apps.find(a => a.id === event?.appId || a.slug === event?.appId);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
          Memuat detail acara dari server Mod Station...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {error || 'Acara Tidak Ditemukan'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Maaf, tautan acara atau promosi yang Anda tuju mungkin sudah kedaluwarsa atau dihapus.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={loadEventData}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-blue-600/20"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const mediaUrl = event.mediaUrl || event.imageUrl;
  const isExpired = event.endAt && new Date(event.endAt).getTime() < new Date().getTime();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 pb-24">
      
      {/* 1. Header: Back & Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          aria-label="Kembali"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
          Detail Acara
        </h1>

        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: event.title, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Tautan acara disalin ke clipboard!');
            }
          }}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          aria-label="Bagikan Acara"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. App Information Bar (If linked to an application) */}
      {linkedApp && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121723] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={linkedApp.icon}
              alt={linkedApp.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {linkedApp.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Terinstal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Versi {linkedApp.version} • {linkedApp.category}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectApp(linkedApp)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
          >
            Buka Aplikasi
          </button>
        </div>
      )}

      {/* 3. Hero Media (Image, GIF, or Video) */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md">
        {event.mediaType === 'video' && mediaUrl ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            poster={event.thumbnailUrl}
            autoPlay
            muted
            playsInline
            loop
            className="w-full max-h-[480px] object-cover"
          />
        ) : (
          <img
            src={mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&h=560&fit=crop&q=80'}
            alt={event.title}
            className="w-full max-h-[480px] object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* 4. Event Status & Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>{getEventStatusText(event.endAt)}</span>
        </div>

        {event.tag && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            {event.tag}
          </span>
        )}
      </div>

      {/* 5. Event Title */}
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
        {event.title}
      </h2>

      {/* 6. Event Description */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121723] border border-slate-200 dark:border-white/10 shadow-xs">
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* 7. Acara & Penawaran Terkait (Related Events) */}
      {relatedEvents.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Acara & Penawaran Terkait
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedEvents.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  window.location.hash = `#/events/${rel.id}`;
                }}
                className="group p-4 rounded-2xl bg-white dark:bg-[#121723] border border-slate-200 dark:border-white/10 hover:border-blue-500/40 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  {rel.mediaUrl && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                      <img
                        src={rel.mediaUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {getEventStatusText(rel.endAt)}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mt-1 group-hover:text-blue-600 transition-colors">
                    {rel.title}
                  </h4>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Pelajari Selengkapnya</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
