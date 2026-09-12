import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  ChevronDown, 
  Bookmark, 
  History, 
  Bell, 
  Crown, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';
import { UserRole, SubscriptionPlan } from '../../types';

interface AccountMenuProps {
  user: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

export default function AccountMenu({
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  onNavigate,
  onSignOut
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin' || 
    (user && (
      user.email === 'fahriandriansptr@gmail.com' || 
      user.email === 'fantrastore.id@gmail.com' || 
      user.email === 'fahriandriansaputra123@gmail.com' || 
      user.email === 'admin@aeroapk.com'
    ));

  return (
    <div className="relative" ref={dropdownRef} id="account-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-200/80 dark:border-white/10"
        id="account-menu-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Buka menu akun"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-lg object-cover"
          />
        ) : (
          <div className="w-7 h-7 bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-lg text-xs font-black">
            {(user.displayName || user.email || 'M').substring(0, 1).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[110px] truncate">
          {user.displayName?.split(' ')[0] || 'Akun'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02]">
            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
              {user.displayName || 'Pengguna Mod Station'}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
            
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                subscriptionPlan === 'premium'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}>
                {subscriptionPlan === 'premium' ? '👑 Premium' : 'Free Plan'}
              </span>
              {userRole === 'developer' && (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Developer
                </span>
              )}
            </div>
          </div>

          {/* Nav items inside menu */}
          <div className="py-1">
            <button
              onClick={() => {
                onNavigate('profile');
                setIsOpen(false);
              }}
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <UserIcon className="h-4 w-4 text-blue-500" />
              <span>Kelola Akun</span>
            </button>

            <button
              onClick={() => {
                onNavigate('bookmarks');
                setIsOpen(false);
              }}
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <Bookmark className="h-4 w-4 text-blue-500" />
              <span>Aplikasi Tersimpan</span>
            </button>

            <button
              onClick={() => {
                onNavigate('downloads');
                setIsOpen(false);
              }}
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <History className="h-4 w-4 text-emerald-500" />
              <span>Riwayat Download</span>
            </button>

            <button
              onClick={() => {
                onNavigate('notifications');
                setIsOpen(false);
              }}
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <Bell className="h-4 w-4 text-amber-500" />
              <span>Pusat Notifikasi</span>
            </button>

            <button
              onClick={() => {
                onNavigate('subscription');
                setIsOpen(false);
              }}
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <Crown className="h-4 w-4 text-amber-500" />
              <span>Status Berlangganan</span>
            </button>

            {isOwnerOrAdmin && (
              <button
                onClick={() => {
                  onNavigate('owner');
                  setIsOpen(false);
                }}
                role="menuitem"
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-white/5 transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span>Admin CMS Panel</span>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="py-1">
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
