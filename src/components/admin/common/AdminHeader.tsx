import React, { useState } from 'react';
import { 
  Menu, Search, Bell, ShieldAlert, CheckCircle2, 
  User, LogOut, Settings, ExternalLink, ChevronDown, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface AdminHeaderProps {
  user: any;
  onOpenMobileDrawer: () => void;
  onOpenSearch: () => void;
  onNavigateRoute: (route: string) => void;
  onSignOut?: () => void;
  pendingModerationCount?: number;
  securityAlertCount?: number;
  pageTitle?: string;
}

export default function AdminHeader({
  user,
  onOpenMobileDrawer,
  onOpenSearch,
  onNavigateRoute,
  onSignOut,
  pendingModerationCount = 0,
  securityAlertCount = 0,
  pageTitle = 'Dashboard'
}: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const totalAlerts = pendingModerationCount + securityAlertCount;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Mobile Drawer Button & Page Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileDrawer}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Input Trigger */}
      <div className="flex-1 max-w-md mx-auto">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            <span className="truncate">Cari aplikasi, versi, laporan, pengguna...</span>
          </div>
          <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 shrink-0">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right: Notifications & Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Public Website Preview Link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Lihat Website Publik"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Website</span>
        </a>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fade-in text-xs space-y-2">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Pemberitahuan System</span>
                {totalAlerts > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold rounded-full">
                    {totalAlerts} perlu perhatian
                  </span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto px-2 space-y-1">
                {pendingModerationCount > 0 ? (
                  <div 
                    onClick={() => {
                      onNavigateRoute('moderation');
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 hover:bg-amber-100/60 transition-colors cursor-pointer flex items-start gap-2.5"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {pendingModerationCount} Laporan Moderation
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Memerlukan peninjauan admin pada antrean moderasi.
                      </div>
                    </div>
                  </div>
                ) : null}

                {securityAlertCount > 0 ? (
                  <div 
                    onClick={() => {
                      onNavigateRoute('security-alerts');
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 hover:bg-red-100/60 transition-colors cursor-pointer flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {securityAlertCount} Peringatan Keamanan APK
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pemeriksaan tandatangan atau pemindaian keamanan terindikasi riskan.
                      </div>
                    </div>
                  </div>
                ) : null}

                {totalAlerts === 0 && (
                  <div className="py-6 text-center text-slate-400 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">Semua Sistem Normal</p>
                    <p className="text-[10px]">Tidak ada laporan atau peringatan aktif.</p>
                  </div>
                )}
              </div>

              <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    onNavigateRoute('moderation');
                    setShowNotifications(false);
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Lihat Semua Antrean Moderasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block text-left truncate max-w-[120px]">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.displayName || 'Administrator'}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                Super Admin
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-xs space-y-1">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'Administrator'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@aeroapk.com'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold rounded text-[10px]">
                  Role: Super Administrator
                </span>
              </div>

              <button
                onClick={() => {
                  onNavigateRoute('access-admins');
                  setShowProfileMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Pengaturan Akun & Profil</span>
              </button>

              <button
                onClick={() => {
                  onNavigateRoute('settings-general');
                  setShowProfileMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Konfigurasi Sistem</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="w-full px-3.5 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Administrator</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
