import React, { useState } from 'react';
import { 
  Download, FileSpreadsheet, FileCode, X, CheckCircle2, 
  Layers, FileText, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { AppData, AdminAuditLog } from '../../types';

interface AdminExportModalProps {
  apps: AppData[];
  reports?: any[];
  feedbacks?: any[];
  auditLogs?: AdminAuditLog[];
  onClose: () => void;
}

export default function AdminExportModal({
  apps,
  reports = [],
  feedbacks = [],
  auditLogs = [],
  onClose
}: AdminExportModalProps) {
  const [selectedDataset, setSelectedDataset] = useState<'apps' | 'reports' | 'feedbacks' | 'audit'>('apps');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [downloading, setDownloading] = useState(false);

  const handleExport = () => {
    setDownloading(true);
    let data: any[] = [];
    let filename = `aero_${selectedDataset}_${new Date().toISOString().split('T')[0]}`;

    if (selectedDataset === 'apps') {
      data = apps.map(a => ({
        id: a.id,
        name: a.name,
        developer: a.developer,
        category: a.category,
        version: a.version,
        downloads: a.downloads,
        rating: a.rating,
        status: a.status,
        sourceType: a.sourceType,
        sha256: a.sha256 || '',
        updatedAt: a.updatedAt
      }));
    } else if (selectedDataset === 'reports') {
      data = reports;
    } else if (selectedDataset === 'feedbacks') {
      data = feedbacks;
    } else if (selectedDataset === 'audit') {
      data = auditLogs;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      if (data.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        setDownloading(false);
        return;
      }
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(h => {
            const val = row[h];
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setDownloading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ekspor Data Sistem</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Kumpulan Data (Dataset)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDataset('apps')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedDataset === 'apps'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Katalog ({apps.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDataset('reports')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedDataset === 'reports'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Laporan ({reports.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDataset('feedbacks')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedDataset === 'feedbacks'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-500" />
                <span>Ulasan ({feedbacks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDataset('audit')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedDataset === 'audit'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Audit Log ({auditLogs.length})</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Format Berkas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>CSV (Excel / Spreadsheet)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  format === 'json'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileCode className="w-4 h-4 text-purple-500" />
                <span>JSON (Raw API Data)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={downloading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas Ekspor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
