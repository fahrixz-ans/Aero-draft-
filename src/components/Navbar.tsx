import React, { useState } from 'react';
import GlobalHeader from './navigation/GlobalHeader';
import MobileMenuDrawer from './MobileMenuDrawer';
import { UserRole, SubscriptionPlan } from '../types';

interface NavbarProps {
  apps?: any[];
  currentView: string;
  categoryFilter?: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchFocus?: () => void;
  onToggleSidebar?: () => void;
  user?: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  onSignIn?: () => void;
  onSignOut?: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

/**
 * Navbar
 * Universal top-level navigation container for Mod Station.
 * Renders the single GlobalHeader across all viewports and views,
 * paired with the existing animated slide-in drawer.
 */
export default function Navbar({
  apps = [],
  currentView,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  onSignIn = () => {},
  onSignOut = () => {},
  unreadNotificationCount = 0,
  onOpenNotifications
}: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isOwnerConsole = currentView === 'admin' || currentView.startsWith('admin-') || currentView === 'owner';

  return (
    <>
      {/* 1. Global Header: Minimal, centered branding, character morph title, = to × morph */}
      <GlobalHeader
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen(prev => !prev)}
        onNavigate={onNavigate}
        isOwnerConsole={isOwnerConsole}
      />

      {/* 2. Universal Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        user={user}
        userRole={userRole}
        subscriptionPlan={subscriptionPlan}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotifications={onOpenNotifications}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        apps={apps}
      />
    </>
  );
}

