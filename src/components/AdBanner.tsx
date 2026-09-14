import React from 'react';
import { SubscriptionPlan, UserRole } from '../types';
import AdSlot from './common/AdSlot';

interface AdBannerProps {
  subscriptionPlan?: SubscriptionPlan;
  userRole?: UserRole;
  slot?: 'top-banner' | 'feed-inline' | 'sidebar' | 'detail-bottom' | string;
  page?: string;
  className?: string;
  onUpgradeClick?: () => void;
}

/**
 * Clean, policy-compliant AdBanner wrapper.
 * Forwards to the unified AdSlot component.
 */
export default function AdBanner({
  subscriptionPlan = 'free',
  userRole = 'user',
  slot = 'feed-inline',
  page = 'home',
  className = '',
}: AdBannerProps) {
  return (
    <AdSlot
      page={page}
      placement={slot}
      subscriptionPlan={subscriptionPlan}
      userRole={userRole}
      className={className}
    />
  );
}

