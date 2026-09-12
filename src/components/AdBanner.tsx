import React from 'react';
import { SubscriptionPlan, UserRole } from '../types';
import AdSenseSlot from './common/AdSenseSlot';

interface AdBannerProps {
  subscriptionPlan?: SubscriptionPlan;
  userRole?: UserRole;
  slot?: 'top-banner' | 'feed-inline' | 'sidebar' | 'detail-bottom' | string;
  className?: string;
  onUpgradeClick?: () => void;
}

/**
 * Clean, policy-compliant AdBanner wrapper.
 * Hides for premium/admin users.
 * If AdSense is not configured, silently renders null without UI disruption.
 */
export default function AdBanner({
  subscriptionPlan = 'free',
  userRole = 'user',
  slot = 'feed-inline',
  className = '',
}: AdBannerProps) {
  // Never show ads to Premium users, Admins, or Owners
  if (subscriptionPlan === 'premium' || userRole === 'admin' || userRole === 'owner') {
    return null;
  }

  return (
    <AdSenseSlot
      slotId={`ad-slot-${slot}`}
      format={slot === 'top-banner' ? 'horizontal' : 'auto'}
      className={className}
    />
  );
}
