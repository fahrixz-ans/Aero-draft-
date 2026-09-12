import React from 'react';
import { Bell, CheckCheck, X, Sparkles, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onMarkAllRead?: () => void;
  onNavigateToApp?: (slug: string) => void;
  onSelectApp?: (slug: string) => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkRead,
  onMarkAllAsRead,
  onMarkAllRead,
  onNavigateToApp,
  onSelectApp
}: NotificationCenterModalProps) {
  if (!isOpen) return null;

  const handleMarkRead = onMarkRead || onMarkAsRead || (() => {});
  const handleMarkAllRead = onMarkAllRead || onMarkAllAsRead || (() => {});
  const handleNavigateApp = onSelectApp || onNavigateToApp;

  const notifsList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notifsList.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 id="notification-center-title" className="text-sm font-black text-slate-900 dark:text-white">
                Pemberitahuan
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="Tandai semua telah dibaca"
                aria-label="Tandai semua pemberitahuan telah dibaca"
                className="p-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup jendela pemberitahuan"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg btn-close-effect cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Belum ada pemberitahuan baru
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Update versi aplikasi yang kamu simpan akan muncul di sini.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) handleMarkRead(item.id);
                  if (item.appSlug && handleNavigateApp) {
                    handleNavigateApp(item.appSlug);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                  !item.read
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                    : 'bg-white dark:bg-slate-900/40 border-slate-150 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {/* Status indicator dot or icon */}
                <div className="pt-0.5 shrink-0">
                  {item.type === 'app_updated' ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  ) : item.type === 'report_resolved' ? (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {item.appSlug && (
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                        Lihat Aplikasi <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-center">
          <p className="text-[11px] text-slate-400">
            Aero akan memberitahu saat ada pembaruan versi pada aplikasi yang kamu simpan.
          </p>
        </div>
      </div>
    </div>
  );
}
