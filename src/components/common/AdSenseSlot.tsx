import React, { useEffect, useRef } from 'react';
import { isAdSenseConfigured, getAdSenseClientId, loadAdSenseScript, pushAdSenseSlot } from '../../services/adsenseService';

export interface AdSenseSlotProps {
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'fluid';
  layoutKey?: string;
  className?: string;
  responsive?: boolean;
  minHeight?: number;
}

/**
 * Production-ready, Policy-Compliant Google AdSense Slot
 * 
 * Rules Enforced:
 * 1. If AdSense is NOT configured (no client ID), it returns NULL (clean UI, no empty/placeholder boxes).
 * 2. Never disguised as a download button or navigation element.
 * 3. Prevents Cumulative Layout Shift (CLS) with appropriate minimum reserved height.
 * 4. Safe against duplicate loads in SPA route transitions.
 */
export default function AdSenseSlot({
  slotId,
  format = 'auto',
  layoutKey,
  className = '',
  responsive = true,
  minHeight = 90
}: AdSenseSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef<boolean>(false);

  // 1. Strictly hide if AdSense is not configured
  if (!isAdSenseConfigured()) {
    return null;
  }

  const clientId = getAdSenseClientId();

  useEffect(() => {
    // Ensure script is loaded once
    loadAdSenseScript();

    // Trigger ad push safely only once per mount
    if (!pushedRef.current) {
      pushedRef.current = true;
      // Slight delay to allow DOM render
      const timer = setTimeout(() => {
        pushAdSenseSlot();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [slotId]);

  // Determine reserved container height to prevent CLS
  const heightStyle = format === 'rectangle' ? 'min-h-[250px]' : `min-h-[${minHeight}px]`;

  return (
    <div 
      ref={containerRef}
      className={`adsense-wrapper w-full my-4 mx-auto overflow-hidden rounded-xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 p-2 text-center transition-colors ${heightStyle} ${className}`}
      aria-label="Iklan Sponsor"
    >
      {/* Subtle, standard Ad label compliant with Google Publisher Policies */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
          Iklan
        </span>
      </div>

      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId || undefined}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
    </div>
  );
}
