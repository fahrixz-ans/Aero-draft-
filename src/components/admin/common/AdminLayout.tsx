import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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
      
      {/* Top Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full relative">
        
        {/* Desktop Sidebar (Fixed Left) */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
          <AdminSidebar
            activeRoute={activeRoute}
            onNavigateRoute={onNavigateRoute}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            pendingModerationCount={pendingModerationCount}
            securityAlertCount={securityAlertCount}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10">
              <AdminSidebar
                activeRoute={activeRoute}
                onNavigateRoute={onNavigateRoute}
                collapsed={false}
                onToggleCollapse={() => {}}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                pendingModerationCount={pendingModerationCount}
                securityAlertCount={securityAlertCount}
              />
            </div>
          </div>
        )}

        {/* Right Main Column */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Sticky Header */}
          <AdminHeader
            user={user}
            onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
            onOpenSearch={() => setSearchModalOpen(true)}
            onNavigateRoute={onNavigateRoute}
            onSignOut={onSignOut}
            pendingModerationCount={pendingModerationCount}
            securityAlertCount={securityAlertCount}
            pageTitle={pageTitle || activeRoute.replace(/-/g, ' ').toUpperCase()}
          />

          {/* Main Dashboard Content Area */}
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
