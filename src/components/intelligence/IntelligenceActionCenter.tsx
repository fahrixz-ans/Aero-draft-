import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { IntelligenceAction, ActionSeverity, ActionStatus } from '../../types/intelligence';

interface IntelligenceActionCenterProps {
  id?: string;
  actions: IntelligenceAction[];
  onStatusChange: (actionId: string, status: ActionStatus, note?: string) => Promise<void>;
  loading?: boolean;
}

export const IntelligenceActionCenter: React.FC<IntelligenceActionCenterProps> = ({
  id = 'intelligence-action-center',
  actions,
  onStatusChange,
  loading = false
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSeverityBadge = (severity: ActionSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/60';
      case 'MEDIUM':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60';
      case 'LOW':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      case 'DISMISSED':
        return 'bg-gray-500/10 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleActionSubmit = async (actionId: string, nextStatus: ActionStatus) => {
    try {
      setIsSubmitting(true);
      await onStatusChange(actionId, nextStatus, resolutionNote.trim() || undefined);
      setActiveActionId(null);
      setResolutionNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div id={id} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl animate-pulse">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const openActions = actions.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS');

  return (
    <div id={id} className="p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Pusat Aksi: Perlu Perhatian ({openActions.length})
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Daftar anomali dan tugas operasional mendesak yang memerlukan tindakan admin
          </p>
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Semua Berjalan Normal</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tidak ada anomali atau tugas yang memerlukan perhatian saat ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((act) => (
            <div
              key={act.id}
              className={`p-4 rounded-xl border transition-all ${
                act.status === 'RESOLVED' || act.status === 'DISMISSED'
                  ? 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/60 opacity-70'
                  : 'bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 hover:border-blue-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityBadge(act.severity)}`}>
                      {act.severity}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getStatusBadge(act.status)}`}>
                      {act.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Entitas: {act.entityType} ({act.entityId})
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {act.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    {act.description}
                  </p>

                  {act.resolutionNote && (
                    <div className="mt-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-2 rounded-lg border border-emerald-200/60">
                      <span className="font-semibold">Catatan Solusi:</span> {act.resolutionNote}
                    </div>
                  )}
                </div>

                {/* Status Toggles */}
                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-start">
                  {act.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (activeActionId === act.id) {
                          setActiveActionId(null);
                        } else {
                          setActiveActionId(act.id);
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      {activeActionId === act.id ? 'Tutup' : 'Tindak Lanjuti'}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Form Drawer */}
              {activeActionId === act.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Tulis catatan penanganan atau alasan tindakan..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleActionSubmit(act.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800"
                    >
                      Sedang Diproses
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleActionSubmit(act.id, 'DISMISSED')}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 rounded-lg"
                    >
                      Abaikan
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleActionSubmit(act.id, 'RESOLVED')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      Selesaikan (Resolve)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
