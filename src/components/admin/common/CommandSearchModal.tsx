import React, { useState, useEffect } from 'react';
import { Search, X, Smartphone, Layers, ShieldAlert, Star, Users, History, ArrowRight } from 'lucide-react';
import { AppData, AppReport, AdminAuditLog } from '../../../types';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppData[];
  reports?: AppReport[];
  auditLogs?: AdminAuditLog[];
  onNavigateTab: (tab: string, slugOrId?: string) => void;
  onSelectApp?: (slug: string) => void;
}

export default function CommandSearchModal({
  isOpen,
  onClose,
  apps = [],
  reports = [],
  auditLogs = [],
  onNavigateTab,
  onSelectApp
}: CommandSearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Filter apps
  const matchedApps = q 
    ? apps.filter(a => a.name.toLowerCase().includes(q) || a.developerName?.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    : apps.slice(0, 5);

  // Filter reports
  const matchedReports = q
    ? reports.filter(r => r.appName?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q))
    : reports.slice(0, 4);

  // Filter audit logs
  const matchedLogs = q
    ? auditLogs.filter(l => l.action.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || (l.performedBy || l.adminEmail || '').toLowerCase().includes(q))
    : auditLogs.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 space-y-0">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aplikasi, versi, laporan, pengguna, audit log..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
            ESC
          </span>
        </div>

        {/* Search Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          
          {/* Quick Nav Category Badges */}
          {!q && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[11px] text-slate-400 font-bold self-center mr-1">Kategori:</span>
              <button 
                onClick={() => { onNavigateTab('apps'); onClose(); }}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Smartphone className="w-3 h-3 text-blue-500" />
                <span>Aplikasi</span>
              </button>
              <button 
                onClick={() => { onNavigateTab('versions'); onClose(); }}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Layers className="w-3 h-3 text-purple-500" />
                <span>Versi</span>
              </button>
              <button 
                onClick={() => { onNavigateTab('moderation'); onClose(); }}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <ShieldAlert className="w-3 h-3 text-red-500" />
                <span>Moderasi & Laporan</span>
              </button>
              <button 
                onClick={() => { onNavigateTab('access'); onClose(); }}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Users className="w-3 h-3 text-emerald-500" />
                <span>Pengguna & Pengurus</span>
              </button>
            </div>
          )}

          {/* Section: Apps */}
          {matchedApps.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span>Aplikasi Catalog</span>
              </div>
              {matchedApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    if (onSelectApp) onSelectApp(app.slug);
                    else onNavigateTab('apps', app.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'} 
                      alt="" 
                      className="w-7 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-800 shrink-0" 
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {app.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {app.category} • v{app.version} • {app.developerName || 'AeroAPK'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* Section: Reports */}
          {matchedReports.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <span>Laporan & Moderasi</span>
              </div>
              {matchedReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => {
                    onNavigateTab('moderation');
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {report.appName || 'Laporan Aplikasi'} — <span className="text-red-500">{report.reason || 'Isu'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Status: {report.status || 'open'} • Prioritas: {report.priority || 'medium'}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* Section: Audit Logs */}
          {matchedLogs.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-500" />
                <span>Audit Logs System</span>
              </div>
              {matchedLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => {
                    onNavigateTab('access');
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {log.action} oleh {log.performedBy || log.adminEmail}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {log.details || 'Aktivitas admin'}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state when nothing matched */}
          {q && matchedApps.length === 0 && matchedReports.length === 0 && matchedLogs.length === 0 && (
            <div className="py-8 text-center text-slate-500 space-y-1">
              <p className="font-medium text-slate-700 dark:text-slate-300">Tidak ada hasil untuk "{query}"</p>
              <p className="text-[11px]">Coba cari dengan kata kunci nama aplikasi, versi, atau nomor laporan.</p>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Gunakan tombol panah untuk navigasi</span>
          <span>AeroAPK Control Center</span>
        </div>

      </div>
    </div>
  );
}
