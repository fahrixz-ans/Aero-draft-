import React from 'react';

interface LoadingSkeletonProps {
  type?: string;
  count?: number;
}

export default function LoadingSkeleton({ type = 'grid', count = 6 }: LoadingSkeletonProps) {
  const normType = type.toLowerCase().trim();

  // Pulse baseline utility classes
  const sh = "bg-slate-200 dark:bg-slate-800 rounded animate-pulse";
  const shDarker = "bg-slate-300 dark:bg-slate-700 rounded animate-pulse";

  // 1. HOME SKELETON
  if (normType === 'home') {
    return (
      <div className="space-y-8 animate-pulse w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="skeleton-home">
        {/* Banner Carousel Skeleton */}
        <div className={`h-40 sm:h-56 md:h-72 w-full ${sh} rounded-3xl`} />

        {/* Suggested row skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className={`h-5 w-40 ${shDarker}`} />
            <div className={`h-4 w-16 ${sh}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-4">
                <div className={`w-14 h-14 ${sh} rounded-2xl shrink-0`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-3/4 ${shDarker}`} />
                  <div className={`h-3 w-1/2 ${sh}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending grid skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className={`h-6 w-48 ${shDarker}`} />
            <div className={`h-5 w-24 ${sh}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-4">
                <div className="flex gap-4">
                  <div className={`w-14 h-14 ${sh} rounded-2xl shrink-0`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 w-3/4 ${shDarker}`} />
                    <div className={`h-3.5 w-1/2 ${sh}`} />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className={`h-4 w-12 ${sh}`} />
                  <div className={`h-7 w-20 ${shDarker}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. APPS & GAMES SKELETON (Catalog layout with Category bar)
  if (normType === 'apps' || normType === 'games' || normType === 'all') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id={`skeleton-${normType}`}>
        <div className="space-y-2">
          <div className={`h-8 w-48 sm:w-64 ${shDarker}`} />
          <div className={`h-4 w-72 sm:w-96 ${sh}`} />
        </div>

        {/* Filter categories pills bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className={`h-8 w-24 ${sh} rounded-xl shrink-0`} />
          ))}
        </div>

        {/* Grid of app cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-4">
              <div className="flex gap-4">
                <div className={`w-14 h-14 ${sh} rounded-2xl shrink-0`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-3/4 ${shDarker}`} />
                  <div className={`h-3 w-1/2 ${sh}`} />
                  <div className={`h-3 w-2/3 ${sh}`} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className={`h-4.5 w-16 ${sh}`} />
                <div className={`h-8 w-20 ${shDarker}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. APP DETAIL SKELETON
  if (normType === 'detail' || normType === 'app-detail') {
    return (
      <div className="space-y-8 animate-pulse w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="skeleton-detail">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 ${sh} rounded-3xl shrink-0`} />
          <div className="flex-1 space-y-3 w-full">
            <div className={`h-7 w-2/3 md:w-1/3 ${shDarker}`} />
            <div className={`h-4 w-1/4 ${sh}`} />
            <div className="flex flex-wrap gap-2 pt-1">
              <div className={`h-5 w-20 ${sh} rounded-full`} />
              <div className={`h-5 w-16 ${sh} rounded-full`} />
            </div>
          </div>
          <div className={`h-11 w-full md:w-40 ${shDarker} shrink-0`} />
        </div>

        {/* Technical spec details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className={`h-3 w-12 ${sh} mx-auto`} />
              <div className={`h-4 w-16 ${shDarker} mx-auto`} />
            </div>
          ))}
        </div>

        {/* Description & Screenshots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className={`h-5 w-32 ${shDarker} mb-4`} />
              <div className={`h-4 w-full ${sh}`} />
              <div className={`h-4 w-11/12 ${sh}`} />
              <div className={`h-4 w-5/6 ${sh}`} />
            </div>
            <div className="space-y-2">
              <div className={`h-5 w-32 ${shDarker} mb-4`} />
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-36 h-64 ${sh} shrink-0`} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-5 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
              <div className={`h-5 w-1/2 ${shDarker}`} />
              <div className={`h-10 w-full ${sh}`} />
              <div className={`h-10 w-full ${sh}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. DEVELOPER PROFILE SKELETON
  if (normType === 'developer-detail' || normType === 'developer') {
    return (
      <div className="space-y-8 animate-pulse w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="skeleton-developer">
        {/* Back navigation skeleton */}
        <div className={`h-5 w-24 ${sh}`} />

        {/* Identity Header */}
        <div className="p-6 sm:p-8 border border-slate-150 dark:border-slate-800 rounded-3xl space-y-6 bg-white dark:bg-slate-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Logo block */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 ${sh} rounded-2xl shrink-0`} />
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <div className={`h-5 w-24 ${sh} rounded-full`} />
                  <div className={`h-5 w-20 ${sh} rounded-full`} />
                </div>
                <div className={`h-7 w-48 sm:w-64 ${shDarker}`} />
                <div className={`h-4.5 w-full max-w-md ${sh}`} />
              </div>
            </div>
            <div className={`h-10 w-24 ${sh} shrink-0`} />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5">
                <div className={`h-3 w-16 ${sh} mx-auto`} />
                <div className={`h-5 w-10 ${shDarker} mx-auto`} />
              </div>
            ))}
          </div>
        </div>

        {/* App list section */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className={`h-5 w-40 ${shDarker}`} />
            <div className={`h-3 w-64 ${sh}`} />
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 ${sh} rounded-xl shrink-0`} />
                  <div className="space-y-1.5 min-w-0">
                    <div className={`h-4.5 w-36 ${shDarker}`} />
                    <div className="flex gap-2">
                      <div className={`h-3 w-16 ${sh}`} />
                      <div className={`h-3 w-10 ${sh}`} />
                    </div>
                  </div>
                </div>
                <div className={`h-8 w-20 ${sh} shrink-0`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 5. REVIEWS SKELETON
  if (normType === 'app-reviews' || normType === 'reviews') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-2xl mx-auto px-4 py-6" id="skeleton-reviews">
        <div className={`h-5 w-24 ${sh} mb-4`} />
        <div className="space-y-1 mb-6">
          <div className={`h-7 w-48 ${shDarker}`} />
          <div className={`h-4 w-72 ${sh}`} />
        </div>

        {/* Average ratings block */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center gap-6">
          <div className="text-center space-y-1 shrink-0">
            <div className={`h-10 w-14 ${shDarker} mx-auto`} />
            <div className={`h-4 w-20 ${sh}`} />
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <div className={`h-3.5 w-4 ${sh}`} />
                <div className={`h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full`} />
              </div>
            ))}
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${sh} rounded-full shrink-0`} />
                  <div className="space-y-1">
                    <div className={`h-4 w-24 ${shDarker}`} />
                    <div className={`h-3 w-16 ${sh}`} />
                  </div>
                </div>
                <div className={`h-4 w-12 ${sh}`} />
              </div>
              <div className={`h-4 w-full ${sh}`} />
              <div className={`h-4 w-5/6 ${sh}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. HELP CENTER SKELETON
  if (normType === 'help-center' || normType === 'pusat-bantuan' || normType === 'help-ai-assistant') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-2xl mx-auto px-4 py-6" id="skeleton-help">
        <div className="space-y-2">
          <div className={`h-8 w-60 ${shDarker}`} />
          <div className={`h-4.5 w-full max-w-sm ${sh}`} />
        </div>

        {/* Search / Ask AI Box */}
        <div className={`h-14 w-full ${sh} rounded-2xl`} />

        <div className={`h-5 w-32 ${shDarker} pt-4`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-slate-200/40 dark:border-slate-800 rounded-2xl space-y-2">
              <div className={`w-10 h-10 ${sh} rounded-xl`} />
              <div className={`h-4.5 w-28 ${shDarker}`} />
              <div className={`h-3 w-full ${sh}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. CUSTOMER SERVICE SKELETON
  if (normType === 'customer-service' || normType === 'contact') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-xl mx-auto px-4 py-6" id="skeleton-cs">
        <div className={`h-5 w-24 ${sh} mb-4`} />
        <div className="space-y-1 mb-6">
          <div className={`h-7 w-48 ${shDarker}`} />
          <div className={`h-4 w-72 ${sh}`} />
        </div>

        <div className="p-6 bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className={`h-3.5 w-20 ${sh}`} />
              <div className={`h-10 w-full ${sh}`} />
            </div>
          ))}
          <div className="space-y-1.5">
            <div className={`h-3.5 w-20 ${sh}`} />
            <div className={`h-24 w-full ${sh}`} />
          </div>
          <div className={`h-11 w-full ${shDarker} rounded-xl`} />
        </div>
      </div>
    );
  }

  // 8. DONATION SKELETON
  if (normType === 'donate' || normType === 'donasi') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-xl mx-auto px-4 py-6" id="skeleton-donate">
        <div className="text-center space-y-2 mb-8">
          <div className={`h-7 w-48 ${shDarker} mx-auto`} />
          <div className={`h-4 w-72 ${sh} mx-auto`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-4">
              <div className={`h-4 w-12 ${sh} mx-auto`} />
              <div className={`h-7 w-20 ${shDarker} mx-auto`} />
              <div className={`h-3 w-16 ${sh} mx-auto`} />
              <div className={`h-9 w-full ${sh} rounded-lg`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 9. SOCIAL MEDIA SKELETON
  if (normType === 'social-media' || normType === 'follow') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-xl mx-auto px-4 py-6" id="skeleton-social">
        <div className="space-y-2 mb-6 text-center">
          <div className={`h-7 w-52 ${shDarker} mx-auto`} />
          <div className={`h-4 w-72 ${sh} mx-auto`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
              <div className={`w-10 h-10 ${sh} rounded-full shrink-0`} />
              <div className="flex-1 space-y-1">
                <div className={`h-4.5 w-24 ${shDarker}`} />
                <div className={`h-3.5 w-16 ${sh}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. PREMIUM SKELETON
  if (normType === 'subscription' || normType === 'premium') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-3xl mx-auto px-4 py-6" id="skeleton-premium">
        <div className="text-center space-y-2 mb-8">
          <div className={`h-7 w-64 ${shDarker} mx-auto`} />
          <div className={`h-4.5 w-80 ${sh} mx-auto`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl space-y-6">
              <div className="space-y-2">
                <div className={`h-5 w-16 ${sh}`} />
                <div className={`h-7 w-32 ${shDarker}`} />
                <div className={`h-4 w-full ${sh}`} />
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex gap-2 items-center">
                    <div className={`w-4 h-4 ${sh} rounded-full shrink-0`} />
                    <div className={`h-3 w-5/6 ${sh}`} />
                  </div>
                ))}
              </div>
              <div className={`h-11 w-full ${shDarker} rounded-xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. SETTINGS SKELETON
  if (normType === 'settings') {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-2xl mx-auto px-4 py-6" id="skeleton-settings">
        <div className="space-y-2 mb-6">
          <div className={`h-7 w-36 ${shDarker}`} />
          <div className={`h-4 w-56 ${sh}`} />
        </div>

        {/* Profile Card */}
        <div className="p-4 bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-2xl flex items-center gap-4">
          <div className={`w-12 h-12 ${sh} rounded-full shrink-0`} />
          <div className="flex-1 space-y-1.5">
            <div className={`h-4.5 w-32 ${shDarker}`} />
            <div className={`h-3.5 w-44 ${sh}`} />
          </div>
        </div>

        {/* Accordions Block */}
        <div className="space-y-2.5 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-13 w-full ${sh} rounded-2xl`} />
          ))}
        </div>
      </div>
    );
  }

  // 12. LEGAL / ABOUT US / DMCA / TERMS / PRIVACY SKELETONS
  if (['about', 'about-us', 'dmca', 'terms', 'privacy', 'disclaimer'].includes(normType)) {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-2xl mx-auto px-4 py-6" id={`skeleton-${normType}`}>
        <div className={`h-5 w-24 ${sh} mb-4`} />
        <div className="space-y-1.5 mb-6">
          <div className={`h-7 w-52 ${shDarker}`} />
          <div className={`h-3 w-32 ${sh}`} />
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-3xl space-y-4">
          <div className={`h-5 w-36 ${shDarker}`} />
          <div className={`h-4 w-full ${sh}`} />
          <div className={`h-4 w-11/12 ${sh}`} />
          <div className={`h-4 w-5/6 ${sh}`} />
          <div className={`h-4 w-full ${sh}`} />
          <div className={`h-4 w-11/12 ${sh}`} />
          
          <div className={`h-5 w-40 ${shDarker} pt-4`} />
          <div className={`h-4 w-full ${sh}`} />
          <div className={`h-4 w-full ${sh}`} />
          <div className={`h-4 w-4/5 ${sh}`} />
        </div>
      </div>
    );
  }

  // DEFAULT GRID FALLBACK SKELETON
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5" id="skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col animate-pulse">
          <div className="flex items-start gap-3.5 mb-4">
            <div className={`w-14 h-14 ${sh} rounded-2xl shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-5/6 ${shDarker}`} />
              <div className={`h-3.5 w-1/2 ${sh}`} />
              <div className={`h-3 w-2/3 ${sh}`} />
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
            <div className={`h-4 w-1/4 ${sh}`} />
            <div className={`h-8 w-20 ${shDarker} rounded-lg`} />
          </div>
        </div>
      ))}
    </div>
  );
}
