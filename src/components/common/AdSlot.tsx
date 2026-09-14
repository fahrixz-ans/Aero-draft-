import React from 'react';
import { SubscriptionPlan, UserRole } from '../../types';
import { isAdSenseConfigured } from '../../services/adsenseService';
import { isPageAdEnabled, AD_CONFIG } from '../../config/adPlacementConfig';
import AdSenseSlot from './AdSenseSlot';

export interface AdSlotProps {
  page?: 'home' | 'today' | 'blog' | 'blogDetail' | 'appDetail' | 'categories' | 'popular' | 'newApps' | 'helpCenter' | 'search' | string;
  placement?: 'top-banner' | 'in-content' | 'between-sections' | 'sidebar' | 'bottom-banner' | string;
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'fluid' | 'sidebar';
  minHeight?: number;
  className?: string;
  subscriptionPlan?: SubscriptionPlan;
  userRole?: UserRole;
}

/**
 * Reusable, Centralized AdSlot Component for Mod Station
 * 
 * Rules:
 * 1. Checks global & page-level configuration in adPlacementConfig.ts.
 * 2. Suppressed for Premium users, Admins, and Owners.
 * 3. NO-FAKES RULE: If AdSense is not actively configured, returns NULL (collapses cleanly without fake ads/banners/content).
 * 4. Policy-compliant Google AdSense rendering with CLS protection.
 */
export default function AdSlot({
  page = 'home',
  placement = 'in-content',
  slotId,
  format = 'auto',
  minHeight,
  className = '',
  subscriptionPlan = 'free',
  userRole = 'user'
}: AdSlotProps) {
  // 1. Hide for Premium, Admin, Owner
  if (subscriptionPlan === 'premium' || userRole === 'admin' || userRole === 'owner') {
    return null;
  }

  // 2. Check placement configuration
  if (!isPageAdEnabled(page)) {
    return null;
  }

  // 3. NO-FAKES RULE: Silently collapse if AdSense provider is not configured
  if (!isAdSenseConfigured()) {
    return null;
  }

  // Determine standard slot ID if not provided
  const computedSlotId = slotId || `slot-${page}-${placement}`;

  // Format mapping
  const adFormat = format === 'sidebar' ? 'rectangle' : format;
  const defaultMinHeight = minHeight || (format === 'sidebar' || format === 'rectangle' ? 250 : 90);

  return (
    <div 
      className={`ad-slot-container w-full max-w-7xl mx-auto my-3 px-2 sm:px-4 ${className}`}
      id={`ad-container-${computedSlotId}`}
    >
      <AdSenseSlot
        slotId={computedSlotId}
        format={adFormat as any}
        minHeight={defaultMinHeight}
        className="my-0"
      />
    </div>
  );
}
