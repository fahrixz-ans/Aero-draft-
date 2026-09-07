import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, Check, Save } from 'lucide-react';
import { EmergencyControlsState } from '../../types/intelligence';

interface EmergencyControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controls: EmergencyControlsState;
  onUpdate: (updates: Partial<EmergencyControlsState>, reason: string) => Promise<boolean>;
}

export const EmergencyControlsModal: React.FC<EmergencyControlsModalProps> = ({
  isOpen,
  onClose,
  controls,
  onUpdate
}) => {
  const [disableRecs, setDisableRecs] = useState(controls.disableRecommendations);
  const [disableUpload, setDisableUpload] = useState(controls.disableDeveloperUpload);
  const [disableAnalytics, setDisableAnalytics] = useState(controls.disableAnalyticsAggregation);
  const [maintenance, setMaintenance] = useState(controls.emergencyMaintenanceMode);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Alasan perubahan kontrol darurat wajib diisi untuk audit log.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const ok = await onUpdate(
        {
          disableRecommendations: disableRecs,
          disableDeveloperUpload: disableUpload,
          disableAnalyticsAggregation: disableAnalytics,
          emergencyMaintenanceMode: maintenance
        },
        reason.trim()
      );
      if (ok) {
        onClose();
      } else {
        setErrorMessage('Gagal memperbarui kontrol darurat.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 bg-red-500/10 border-b border-red-200 dark:border-red-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-sm">Kontrol Darurat Platform (Emergency Controls)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Perubahan saklar darurat akan langsung berdampak ke perilaku API platform dan dicatat permanen dalam Audit Log.
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Toggle 1: Disable Recommendations */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer">
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                  Matikan Rak Rekomendasi
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Fallback ke kurasi katalog standar jika ada anomali click-fraud
                </span>
              </div>
              <input
                type="checkbox"
                checked={disableRecs}
                onChange={(e) => setDisableRecs(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
            </label>

            {/* Toggle 2: Disable Developer Upload */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer">
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                  Bekukan Unggahan Pengembang
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Kunci sesi unggah APK baru untuk pemeliharaan keamanan
                </span>
              </div>
              <input
                type="checkbox"
                checked={disableUpload}
                onChange={(e) => setDisableUpload(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
            </label>

            {/* Toggle 3: Disable Analytics Aggregation */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer">
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                  Tunda Agregasi Analytics
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Ringankan beban CPU server dengan menunda kalkulasi cron
                </span>
              </div>
              <input
                type="checkbox"
                checked={disableAnalytics}
                onChange={(e) => setDisableAnalytics(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
            </label>
          </div>

          {/* Justification input */}
          <div className="pt-2">
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Alasan Perubahan (Wajib)
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: Investigasi lonjakan kegagalan unduh atau audit berkas VirusTotal..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
            {errorMessage && (
              <p className="text-red-500 text-[11px] mt-1">{errorMessage}</p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
