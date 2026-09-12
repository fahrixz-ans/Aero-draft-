import React, { useState, useMemo } from 'react';
import { AppData } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AppCard from '../AppCard';

interface DeveloperAppListProps {
  developer: string;
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
}

export default function DeveloperAppList({ developer, apps, onSelectApp, onDownloadApp }: DeveloperAppListProps) {
  const [expanded, setExpanded] = useState(false);

  const filteredApps = useMemo(() => {
    return apps.filter(app => app.developer === developer);
  }, [apps, developer]);

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="font-bold text-slate-800 dark:text-white">{developer}</span>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
      </button>

      {expanded && (
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 space-y-4">
          {filteredApps.length > 0 ? (
            filteredApps.map(app => (
              <AppCard key={app.id} app={app} onSelect={onSelectApp} onDownload={onDownloadApp} />
            ))
          ) : (
            <p className="text-sm text-slate-500">Tidak ada aplikasi ditemukan.</p>
          )}
        </div>
      )}
    </div>
  );
}
