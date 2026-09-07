import React, { useState } from 'react';
import { Bell, ArrowLeft, CheckCheck, RefreshCw, Sparkles, Layers, ShieldCheck, User, Settings, ArrowUpRight } from 'lucide-react';
import { NotificationItem, NotificationCategory } from '../types';

interface NotificationCenterViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectApp?: (slug: string) => void;
  onNavigateToApp?: (slug: string) => void;
  onNavigateToPreferences?: () => void;
  onBackHome?: () => void;
  onEnablePush?: () => Promise<boolean>;
  pushEnabled?: boolean;
}

export default function NotificationCenterView({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onSelectApp,
  onNavigateToApp,
  onNavigateToPreferences,
  onBackHome,
  onEnablePush,
  pushEnabled
}: NotificationCenterViewProps) {
  const handleAppSelect = onSelectApp || onNavigateToApp;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [requestingPush, setRequestingPush] = useState(false);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const filteredNotifications = safeNotifications.filter(item => {
    if (!item) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'app_update') return item.type === 'app_update';
    if (activeCategory === 'new_app') return item.type === 'new_app';
    if (activeCategory === 'collection') return item.type === 'collection';
    if (activeCategory === 'system') return item.type === 'system' || item.type === 'account';
    return true;
  });

  const unreadCount = safeNotifications.filter(n => n && !n.read).length;

  const handlePushClick = async () => {
    if (!onEnablePush) return;
    setRequestingPush(true);
    try {
      await onEnablePush();
    } finally {
      setRequestingPush(false);
    }
  };

  const getIconForType = (type: NotificationCategory) => {
    switch (type) {
      case 'app_update':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'new_app':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'collection':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'account':
        return <User className="w-4 h-4 text-emerald-500" />;
      case 'system':
      default:
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="notification-center-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          {onBackHome && (
            <button
              onClick={onBackHome}
              aria-label="Kembali ke beranda"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Pusat Notifikasi</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Informasi pembaruan aplikasi diikuti, rilis baru, serta pengumuman sistem Aero.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-blue-500" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}

          {onNavigateToPreferences && (
            <button
              onClick={onNavigateToPreferences}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Pengaturan Notifikasi"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Push Notification Banner if disabled */}
      {!pushEnabled && onEnablePush && (
        <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Aktifkan Notifikasi Web Browser
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dapatkan pemberitahuan seketika saat aplikasi yang Anda ikuti merilis update APK baru.
              </p>
            </div>
          </div>
          <button
            onClick={handlePushClick}
            disabled={requestingPush}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
          >
            {requestingPush ? 'Meminta Izin...' : 'Aktifkan Sekarang'}
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold">
        {[
          { id: 'all', label: 'Semua', count: notifications.length },
          { id: 'app_update', label: 'Pembaruan Aplikasi', count: notifications.filter(n => n.type === 'app_update').length },
          { id: 'new_app', label: 'Aplikasi Baru', count: notifications.filter(n => n.type === 'new_app').length },
          { id: 'collection', label: 'Koleksi & Rekomendasi', count: notifications.filter(n => n.type === 'collection').length },
          { id: 'system', label: 'Sistem & Akun', count: notifications.filter(n => n.type === 'system' || n.type === 'account').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === tab.id
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/20">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      {filteredNotifications.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto px-4 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
            Belum ada notifikasi.
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Anda akan menerima notifikasi di sini saat ada pembaruan versi dari aplikasi yang Anda ikuti atau pengumuman platform.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const timeStr = new Date(notif.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) onMarkRead(notif.id);
                  if (notif.targetSlug && onNavigateToApp) {
                    onNavigateToApp(notif.targetSlug);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  notif.read
                    ? 'bg-white dark:bg-white/[0.02] border-slate-100 dark:border-white/5 opacity-85 hover:opacity-100'
                    : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    notif.read ? 'bg-slate-100 dark:bg-white/5' : 'bg-white dark:bg-slate-800 shadow-sm'
                  }`}>
                    {getIconForType(notif.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${notif.read ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-black text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                      {timeStr}
                    </span>
                  </div>
                </div>

                {notif.targetSlug && onNavigateToApp && (
                  <div className="shrink-0 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      <span>Buka</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
