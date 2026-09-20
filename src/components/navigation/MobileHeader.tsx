import React from 'react';
import GlobalHeader from './GlobalHeader';

interface MobileHeaderProps {
  currentView?: string;
  onNavigate: (view: string, slug?: string) => void;
  onSearchFocus?: () => void;
  isDrawerOpen?: boolean;
  onOpenDrawer: () => void;
  subscriptionPlan?: string;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

/**
 * MobileHeader
 * Wraps GlobalHeader for full consistency across all platforms.
 */
export default function MobileHeader({
  onNavigate,
  isDrawerOpen = false,
  onOpenDrawer
}: MobileHeaderProps) {
  return (
    <GlobalHeader
      isDrawerOpen={isDrawerOpen}
      onToggleDrawer={onOpenDrawer}
      onNavigate={onNavigate}
    />
  );
}

