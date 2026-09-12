import React, { useState } from 'react';
import DesktopHeader from './navigation/DesktopHeader';
import MobileHeader from './navigation/MobileHeader';
import MobileMenuDrawer from './MobileMenuDrawer';
import { useResponsive } from '../hooks/useResponsive';
import { UserRole, SubscriptionPlan } from '../types';

interface NavbarProps {
  currentView: string;
  categoryFilter?: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchFocus: () => void;
  onToggleSidebar?: () => void;
  user: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  onSignIn: () => void;
  onSignOut: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

export default function Navbar({
  currentView,
  categoryFilter = '',
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onSearchFocus,
  onToggleSidebar,
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  onSignIn,
  onSignOut,
  unreadNotificationCount = 0,
  onOpenNotifications
}: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isDesktop } = useResponsive(768);

  return (
    <>
      {/* 1. Desktop & Tablet Header (Rendered on desktop viewports) */}
      {isDesktop && (
        <DesktopHeader
          currentView={currentView}
          categoryFilter={categoryFilter}
          onNavigate={onNavigate}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          onSearchFocus={onSearchFocus}
          onToggleSidebar={onToggleSidebar}
          user={user}
          userRole={userRole}
          subscriptionPlan={subscriptionPlan}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          unreadNotificationCount={unreadNotificationCount}
          onOpenNotifications={onOpenNotifications}
        />
      )}

      {/* 2. Mobile Header (Rendered on mobile viewports) */}
      {!isDesktop && (
        <MobileHeader
          currentView={currentView}
          onNavigate={onNavigate}
          onSearchFocus={onSearchFocus}
          isDrawerOpen={isDrawerOpen}
          onOpenDrawer={() => setIsDrawerOpen(prev => !prev)}
          subscriptionPlan={subscriptionPlan}
          unreadNotificationCount={unreadNotificationCount}
          onOpenNotifications={onOpenNotifications}
        />
      )}

      {/* 3. Universal Slide-out Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        user={user}
        userRole={userRole}
        subscriptionPlan={subscriptionPlan}
        unreadNotificationCount={unreadNotificationCount}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
    </>
  );
}
