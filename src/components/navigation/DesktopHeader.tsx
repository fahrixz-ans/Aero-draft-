import React from 'react';
import GlobalHeader from './GlobalHeader';

interface DesktopHeaderProps {
  currentView?: string;
  categoryFilter?: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSearchFocus?: () => void;
  onToggleSidebar?: () => void;
  user?: any;
  userRole?: string;
  subscriptionPlan?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  isDrawerOpen?: boolean;
  onOpenDrawer?: () => void;
}

/**
 * DesktopHeader
 * Wraps GlobalHeader for full consistency across all platforms.
 */
export default function DesktopHeader({
  onNavigate,
  isDrawerOpen = false,
  onOpenDrawer = () => {}
}: DesktopHeaderProps) {
  return (
    <GlobalHeader
      isDrawerOpen={isDrawerOpen}
      onToggleDrawer={onOpenDrawer}
      onNavigate={onNavigate}
    />
  );
}

