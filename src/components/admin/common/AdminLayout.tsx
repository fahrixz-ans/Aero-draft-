import React, { useState, useEffect } from 'react';
import OwnerConsoleHeader from './OwnerConsoleHeader';
import FullscreenNavOverlay from './FullscreenNavOverlay';
import CommandSearchModal from './CommandSearchModal';
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';
import { AppData, AppReport, AdminAuditLog } from '../../../types';

interface AdminLayoutProps {
  user: any;
  activeRoute: string;
  onNavigateRoute: (route: string, slugOrId?: string) => void;
  onSignOut?: () => void;
  apps?: AppData[];
  reports?: AppReport[];
  auditLogs?: AdminAuditLog[];
  pendingModerationCount?: number;
  securityAlertCount?: number;
  breadcrumbs?: BreadcrumbItem[];
  pageTitle?: string;
  children: React.ReactNode;
}

export default function AdminLayout({
  user,
  activeRoute,
  onNavigateRoute,
  onSignOut,
  apps = [],
  reports = [],
  auditLogs = [],
  pendingModerationCount = 0,
  securityAlertCount = 0,
  breadcrumbs = [],
  pageTitle,
  children
}: AdminLayoutProps) {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global Keyboard Shortcut ⌘K / Ctrl+K for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased">
      
      {/* 1. Header (PRD Section 5): Fixed top header with hamburger (=) -> (×) and centered logo */}
      <OwnerConsoleHeader
        isMenuOpen={isNavMenuOpen}
        onToggleMenu={() => setIsNavMenuOpen(!isNavMenuOpen)}
        onNavigateHome={() => onNavigateRoute('dashboard')}
      />

      {/* 2. Fullscreen Nav Overlay (PRD Section 6): 100vw x 100dvh matrix layout */}
      <FullscreenNavOverlay
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeRoute={activeRoute}
        onSelectRoute={(routeId) => onNavigateRoute(routeId)}
      />

      {/* 3. Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          
          {/* Breadcrumb Navigation Bar */}
          {breadcrumbs.length > 0 && (
            <Breadcrumb 
              items={breadcrumbs} 
              onHomeClick={() => onNavigateRoute('dashboard')}
            />
          )}

          {children}
        </main>
      </div>

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        apps={apps}
        reports={reports}
        auditLogs={auditLogs}
        onNavigateTab={onNavigateRoute}
      />

    </div>
  );
}
