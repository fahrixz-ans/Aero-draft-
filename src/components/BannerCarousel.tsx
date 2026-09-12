import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, ExternalLink, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerItem, AppData } from '../types';
import { BANNER_IMAGE_FALLBACK } from '../services/bannerService';

interface BannerCarouselProps {
  banners: BannerItem[];
  apps?: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  onSelectCategory?: (category: string) => void;
  autoSlideIntervalMs?: number;
}

/**
 * Determines dynamic CTA text based on banner destination type & content properties.
 * - Article -> "Jelajahi"
 * - App / Game -> "Download"
 * - WhatsApp Channel -> "Bergabung"
 */
function getDynamicCtaText(banner: BannerItem): string {
  const destType = (banner.destinationType || '').toLowerCase();
  const destination = (banner.destination || '').toLowerCase();
  const tag = (banner.tag || '').toLowerCase();

  const isWa = destination.includes('whatsapp') || tag.includes('channel') || destType === 'channel' || (destType === 'external' && destination.includes('whatsapp'));
  
  if (isWa) {
    return 'Bergabung';
  }
  if (destType === 'app' || destType === 'game') {
    return 'Download';
  }
  return 'Jelajahi';
}

/**
 * Returns badge label & theme styling based on banner type
 */
function getBadgeConfig(banner: BannerItem) {
  const destType = (banner.destinationType || '').toLowerCase();
  const destination = (banner.destination || '').toLowerCase();
  const tag = (banner.tag || '').trim();

  const isWa = destination.includes('whatsapp') || tag.toLowerCase().includes('channel') || destType === 'channel' || (destType === 'external' && destination.includes('whatsapp'));

  if (isWa) {
    return {
      text: tag || 'Channel',
      className: 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
    };
  }
  if (destType === 'app' || destType === 'game') {
    return {
      text: tag || 'Update Aplikasi',
      className: 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-xs'
    };
  }
  return {
    text: tag || 'Artikel',
    className: 'bg-amber-600 dark:bg-amber-500 text-white shadow-xs'
  };
}

export default function BannerCarousel({
  banners = [],
  apps = [],
  onNavigate,
  onDownloadApp,
  onSelectCategory,
  autoSlideIntervalMs = 5000
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [pushedBannerId, setPushedBannerId] = useState<string | null>(null);

  // Touch swipe handling refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Guard: if no banners available, render nothing
  if (!banners || banners.length === 0) {
    return null;
  }

  // Ensure current index is within valid bounds
  const activeIndex = currentIndex >= banners.length ? 0 : currentIndex;

  // Helper to schedule or reset autoplay timer
  const resetAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (banners.length <= 1 || (typeof document !== 'undefined' && document.hidden)) {
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoSlideIntervalMs);
  }, [banners.length, autoSlideIntervalMs]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        resetAutoplay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetAutoplay();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetAutoplay]);

  // Navigation handlers for touch swipe & arrows
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    resetAutoplay();
  }, [banners.length, resetAutoplay]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    resetAutoplay();
  }, [banners.length, resetAutoplay]);

  // Touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;

    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Helper to handle banner CTA click
  const triggerBannerCta = (banner: BannerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!banner || !banner.destination) return;

    if (banner.id) {
      setPushedBannerId(banner.id);
      setTimeout(() => setPushedBannerId(null), 180);
    }

    const { destinationType, destination } = banner;
    const tag = (banner.tag || '').toLowerCase();
    const isWa = destination.includes('whatsapp') || tag.includes('channel') || destinationType === 'channel' || (destinationType === 'external' && destination.includes('whatsapp'));

    if (
      isWa ||
      destinationType === 'external' || 
      destination.startsWith('http://') || 
      destination.startsWith('https://')
    ) {
      const targetUrl = destination || 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k';
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (destinationType === 'app' || destinationType === 'game') {
      const cleanSlug = destination.replace(/^\/apps\//, '');
      const matchedApp = apps.find(a => a.slug === cleanSlug || a.id === cleanSlug);
      
      if (matchedApp && onDownloadApp) {
        onDownloadApp(e, matchedApp);
      } else {
        onNavigate('detail', cleanSlug);
      }
      return;
    }

    if (destinationType === 'article' || destinationType === 'blog') {
      const cleanSlug = destination.replace(/^\/articles\//, '').replace(/^\/blog\//, '');
      onNavigate('blog-detail', cleanSlug);
      return;
    }

    if (destinationType === 'event' || destination.startsWith('events/') || destination.startsWith('/events/')) {
      const cleanEventId = destination.replace(/^\/?events\//, '');
      onNavigate('event-detail', cleanEventId);
      return;
    }

    if (destinationType === 'category') {
      if (onSelectCategory) {
        onSelectCategory(destination);
      } else {
        onNavigate('categories');
      }
      return;
    }

    const cleanView = destination.replace(/^\//, '');
    onNavigate(cleanView || 'home');
  };

  // Helper to render full background media
  const renderBannerMedia = (banner: BannerItem) => {
    const mediaType = banner.mediaType || 'image';
    const mediaUrl = banner.mediaUrl || banner.image || banner.imageUrl || BANNER_IMAGE_FALLBACK;
    const isBroken = imageErrorMap[banner.id];

    if (mediaType === 'video' && mediaUrl) {
      return (
        <video
          key={`video-${banner.id}`}
          src={mediaUrl}
          poster={banner.thumbnailUrl}
          autoPlay
          muted
          playsInline
          loop
          className="w-full h-full object-cover pointer-events-none"
        />
      );
    }

    return (
      <img
        key={`media-${banner.id}`}
        src={isBroken ? BANNER_IMAGE_FALLBACK : mediaUrl}
        alt={banner.title}
        loading="lazy"
        onError={() => setImageErrorMap(prev => ({ ...prev, [banner.id]: true }))}
        className="w-full h-full object-cover pointer-events-none"
      />
    );
  };

  return (
    <section 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 select-none"
      id="modstation-hero-banner-carousel"
      aria-label="Banner Utama Mod Station"
    >
      {/* 16:9 Aspect Ratio Main Container */}
      <div 
        className="relative overflow-hidden w-full aspect-[16/9] rounded-[18px] sm:rounded-[20px] md:rounded-[22px] border border-slate-200/80 dark:border-white/10 bg-slate-900 shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Carousel Slide Track */}
        <div 
          className="flex w-full h-full ease-out motion-reduce:transition-none"
          style={{ 
            transform: `translateX(-${activeIndex * 100}%)`,
            transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)' 
          }}
        >
          {banners.map((banner, index) => {
            const badge = getBadgeConfig(banner);
            const ctaText = getDynamicCtaText(banner);
            const isAppType = banner.destinationType === 'app' || banner.destinationType === 'game';
            
            // Look up app details if banner represents an app/game update
            const cleanAppSlug = (banner.destination || '').replace(/^\/apps\//, '');
            const matchedApp = isAppType ? apps.find(a => a.slug === cleanAppSlug || a.id === cleanAppSlug) : null;

            return (
              <div 
                key={banner.id || index} 
                className="w-full shrink-0 h-full relative overflow-hidden group cursor-pointer"
                onClick={(e) => triggerBannerCta(banner, e)}
              >
                {/* 1. Full-Width Background Media (16:9 Cover) */}
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-900">
                  {renderBannerMedia(banner)}
                </div>

                {/* 2. Smooth Bottom Gradient Overlay (Translucent -> Bright solid area) */}
                <div 
                  className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-slate-100/75 via-[48%] to-slate-100 dark:via-slate-950/80 dark:to-slate-950" 
                />

                {/* 3. Top-Left Pill Badge ({BADGES}) */}
                <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 md:top-4.5 md:left-4.5 z-20">
                  <span className={`inline-flex items-center px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>

                {/* 4. Bottom Content Overlay Section */}
                <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-4 md:p-5 lg:p-6 z-20 flex flex-col justify-end gap-1 sm:gap-1.5 md:gap-2 text-slate-900 dark:text-white">
                  
                  {/* Middle Row: Title (Left) + MOD STATION Logo (Right) */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <h2 className="font-extrabold tracking-tight text-slate-900 dark:text-white text-xs sm:text-base md:text-xl lg:text-2xl line-clamp-1">
                      {banner.title}
                    </h2>

                    {/* MOD STATION Logo Badge */}
                    <div className="flex items-center gap-1 sm:gap-1.5 font-black text-slate-900 dark:text-white shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200/60 dark:border-white/10">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[9px] sm:text-xs shadow-xs">
                        M
                      </div>
                      <span className="text-[9px] sm:text-xs md:text-sm tracking-tight font-black uppercase inline-block">
                        MOD<span className="text-blue-600 dark:text-blue-400">STATION</span>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Divider Line */}
                  <div className="w-full h-[1px] bg-slate-300/70 dark:bg-slate-700/60 my-0.5" />

                  {/* Bottom Row: Info / App Card (Left) + CTA Button (Right) */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    
                    {/* Left Info: App Info if app/game, otherwise Description */}
                    <div className="min-w-0 flex-1">
                      {isAppType ? (
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <img 
                            src={matchedApp?.icon || banner.image || BANNER_IMAGE_FALLBACK} 
                            alt={matchedApp?.name || banner.title}
                            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl object-cover shadow-xs border border-slate-200/60 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-slate-800" 
                          />
                          <div className="min-w-0 flex flex-col justify-center">
                            <span className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white line-clamp-1">
                              {matchedApp?.name || banner.title}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-1 flex items-center gap-1 font-medium">
                              <span>{matchedApp?.category || 'Aplikasi'}</span>
                              <span>•</span>
                              <span className="text-amber-500 font-bold">★ {matchedApp?.rating ? matchedApp.rating.toFixed(1) : '4.8'}</span>
                              {matchedApp?.downloads && (
                                <>
                                  <span>•</span>
                                  <span>{matchedApp.downloads}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-300 line-clamp-1 sm:line-clamp-2 leading-tight max-w-2xl font-medium">
                          {banner.description}
                        </p>
                      )}
                    </div>

                    {/* Right CTA Button */}
                    <button
                      type="button"
                      onClick={(e) => triggerBannerCta(banner, e)}
                      id={`banner-cta-button-${index}`}
                      className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white rounded-xl sm:rounded-2xl transition-all shadow-md shrink-0 cursor-pointer whitespace-nowrap btn-press-feedback"
                    >
                      <span>{ctaText}</span>
                      {ctaText === 'Bergabung' ? (
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      ) : ctaText === 'Download' ? (
                        <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      ) : (
                        <ArrowRight className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${pushedBannerId === banner.id ? 'animate-icon-arrow-right' : ''}`} />
                      )}
                    </button>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

