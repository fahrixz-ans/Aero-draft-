import React, { useEffect } from 'react';
import { 
  LayoutDashboard, BarChart3, Search, Download, Activity, 
  Package, PlusCircle, History, Grid, Layers, Star, Layout, 
  Flag, Sparkles, TrendingUp, ShieldAlert, FileText, MessageSquare, 
  Headphones, MessageCircle, Shield, AlertTriangle, Database, 
  Cpu, FileCode, Users, KeyRound, Settings, Bell, Heart, Mail, CheckCircle, X
} from 'lucide-react';

export interface NavItemDef {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export interface NavCategoryDef {
  category: string;
  items: NavItemDef[];
}

export const OWNER_NAV_MATRIX: NavCategoryDef[] = [
  {
    category: 'OWNER WORKSPACE',
    items: [
      { id: 'dashboard', label: 'Dashboard', description: 'Metrik utama & performa platform', icon: LayoutDashboard },
      { id: 'applications', label: 'Apps', description: 'Katalog utama aplikasi & status', icon: Package }
    ]
  }
];

interface FullscreenNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: string;
  onSelectRoute: (routeId: string) => void;
}

export default function FullscreenNavOverlay({
  isOpen,
  onClose,
  activeRoute,
  onSelectRoute
}: FullscreenNavOverlayProps) {

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-slate-950/95 text-white flex flex-col pt-16 animate-fade-in backdrop-blur-md overflow-hidden font-sans"
      style={{ width: '100vw', height: '100dvh' }}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 pb-20">
        
        {/* Title Bar */}
        <div className="border-b border-white/10 pb-4">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Navigasi Utama Workspace</p>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">Owner Console Directory</h2>
        </div>

        {/* Matrix Categories */}
        <div className="space-y-8">
          {OWNER_NAV_MATRIX.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-white/5 pb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {group.category}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectRoute(item.id);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl text-left transition-all duration-150 flex items-start gap-3.5 group cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        isActive ? 'bg-emerald-500 text-white' : 'bg-white/10 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
