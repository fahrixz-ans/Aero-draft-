import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight, X, ThumbsDown, ShieldCheck, Flame, RefreshCw, Info } from 'lucide-react';
import { AppData } from '../../types';
import { ScoredApp } from '../../services/recommendations/recommendationTypes';
import { trackRecommendationEvent } from '../../services/recommendations/recommendationAnalytics';
import { trackUserInteraction } from '../../services/recommendations/userInterestService';
import AppCard from '../AppCard';
import RefreshIconButton from '../common/RefreshIconButton';

interface RecommendationShelfProps {
  shelfId: string;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  items: ScoredApp[];
  onSelectApp: (app: AppData) => void;
  onDownloadApp?: (app: AppData) => void;
  onOfficialLink?: (app: AppData) => void;
  onSaveApp?: (app: AppData) => void;
  downloadHistory?: any[];
  currentUser?: any;
  showExplanationBadges?: boolean;
  allowDismiss?: boolean;
  onRefresh?: () => void;
}

export default function RecommendationShelf({
  shelfId,
  title,
  subtitle,
  icon: Icon = Sparkles,
  items,
  onSelectApp,
  onDownloadApp,
  onOfficialLink,
  onSaveApp,
  downloadHistory,
  currentUser,
  showExplanationBadges = true,
  allowDismiss = true,
  onRefresh
}: RecommendationShelfProps) {
  const [displayedItems, setDisplayedItems] = useState<ScoredApp[]>(items);
  const [dismissedAppIds, setDismissedAppIds] = useState<string[]>([]);
  const shelfRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpressions = useRef(false);

  useEffect(() => {
    setDisplayedItems(items.filter(item => !dismissedAppIds.includes(item.app.id)));
  }, [items, dismissedAppIds]);

  // Track impressions when shelf renders in viewport
  useEffect(() => {
    if (displayedItems.length > 0 && !hasTrackedImpressions.current) {
      hasTrackedImpressions.current = true;
      displayedItems.forEach((scored, idx) => {
        trackRecommendationEvent('impression', {
          shelfId,
          appId: scored.app.id,
          userId: currentUser?.uid,
          score: scored.score.finalScore,
          position: idx,
          fallbackLevel: scored.score.fallbackLevel
        });
      });
    }
  }, [displayedItems, shelfId, currentUser]);

  const handleDismissApp = async (e: React.MouseEvent, scored: ScoredApp) => {
    e.stopPropagation();
    const appId = scored.app.id;
    setDismissedAppIds(prev => [...prev, appId]);

    // Record dismiss event in analytics
    trackRecommendationEvent('dismiss', {
      shelfId,
      appId,
      userId: currentUser?.uid,
      score: scored.score.finalScore
    });

    // Record negative feedback to refine user profile
    await trackUserInteraction('feedback_negative', {
      app: scored.app,
      appId: scored.app.id,
      category: scored.app.category
    }, currentUser?.uid);
  };

  const handleAppClick = (scored: ScoredApp) => {
    trackRecommendationEvent('click', {
      shelfId,
      appId: scored.app.id,
      userId: currentUser?.uid,
      score: scored.score.finalScore,
      position: scored.position,
      fallbackLevel: scored.score.fallbackLevel
    });

    trackUserInteraction('view', {
      app: scored.app,
      appId: scored.app.id,
      category: scored.app.category,
      tags: scored.app.tags
    }, currentUser?.uid);

    onSelectApp(scored.app);
  };

  if (!displayedItems || displayedItems.length === 0) {
    return null;
  }

  return (
    <section ref={shelfRef} className="space-y-4 pt-2" id={`shelf-${shelfId}`}>
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/60 dark:border-white/5 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Icon className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {displayedItems[0]?.score.fallbackLevel === 'PERSONALIZED' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Personalisasi</span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pl-8 sm:pl-0">
              {subtitle}
            </p>
          )}
        </div>

        {onRefresh && (
          <RefreshIconButton
            onRefresh={onRefresh}
            label="Segarkan"
            className="self-end sm:self-auto"
          />
        )}
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedItems.map((scored, index) => {
          const { app, score } = scored;
          return (
            <div key={app.id} className="group relative flex flex-col space-y-1.5">
              {/* App Card */}
              <AppCard
                app={app}
                onSelect={() => handleAppClick(scored)}
                onDownload={onDownloadApp ? () => {
                  trackRecommendationEvent('convert_download', {
                    shelfId,
                    appId: app.id,
                    userId: currentUser?.uid,
                    score: score.finalScore
                  });
                  onDownloadApp(app);
                } : undefined}
                downloadHistory={downloadHistory}
              />

              {/* Recommendation Reason & Dismiss Controls */}
              {showExplanationBadges && (
                <div className="flex items-center justify-between gap-1.5 px-1 pt-0.5">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span 
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0b0f19] border border-slate-900/80 dark:border-white/80 px-2 py-0.5 rounded-lg shadow-xs truncate max-w-[200px]"
                      title={score.matchingFactors.join(' • ') || score.primaryReason}
                    >
                      <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-500 fill-amber-500/20" />
                      <span className="truncate">{score.primaryReason || 'Pilihan Relevan'}</span>
                    </span>
                  </div>

                  {allowDismiss && (
                    <button
                      onClick={(e) => handleDismissApp(e, scored)}
                      className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                      title="Kurang relevan untuk saya"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
