import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ShieldAlert, Clock, Loader2 } from 'lucide-react';
import { AppData, AppReport, ReportType, ReportPriority, AeroUser as User } from '../types';
import { collection, query, where, limit, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppData;
  currentUser?: User | null;
  initialType?: ReportType;
  versionId?: string;
  versionName?: string;
}

const REPORT_OPTIONS: { type: ReportType; label: string; priority: ReportPriority }[] = [
  { type: 'download_problem', label: 'APK tidak bisa di-download', priority: 'high' },
  { type: 'invalid_file', label: 'File APK bermasalah', priority: 'high' },
  { type: 'incorrect_information', label: 'Informasi aplikasi salah', priority: 'low' },
  { type: 'incorrect_screenshot', label: 'Screenshot tidak sesuai', priority: 'low' },
  { type: 'broken_official_link', label: 'Link website tidak bekerja', priority: 'medium' },
  { type: 'unavailable_app', label: 'Aplikasi sudah tidak tersedia', priority: 'medium' },
  { type: 'other', label: 'Masalah lainnya', priority: 'low' }
];

export default function ReportIssueModal({
  isOpen,
  onClose,
  app,
  currentUser,
  initialType = 'download_problem',
  versionId,
  versionName
}: ReportIssueModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType>(initialType);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldownSecs, setCooldownSecs] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      setDescription('');
      setErrorMsg('');
      setSubmitted(false);

      // Check client-side cooldown
      const lastReportTime = localStorage.getItem('last_report_timestamp');
      if (lastReportTime) {
        const elapsed = Math.floor((Date.now() - parseInt(lastReportTime, 10)) / 1000);
        if (elapsed < 60) {
          setCooldownSecs(60 - elapsed);
        } else {
          setCooldownSecs(0);
        }
      }
    }
  }, [isOpen, initialType]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const timer = setInterval(() => {
      setCooldownSecs((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSecs]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSecs > 0) {
      setErrorMsg(`Harap tunggu ${cooldownSecs} detik sebelum mengirim laporan berikutnya.`);
      return;
    }

    const selectedOption = REPORT_OPTIONS.find((o) => o.type === selectedType);
    const priority = selectedOption?.priority || 'low';

    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Duplicate detection: Check if identical open report already exists for this app & user/ip
      const now = new Date();
      const reportsRef = collection(db, 'reports');

      if (currentUser?.uid) {
        const duplicateQuery = query(
          reportsRef,
          where('appId', '==', app.id),
          where('type', '==', selectedType),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'open'),
          limit(1)
        );
        const dupSnap = await getDocs(duplicateQuery);
        if (!dupSnap.empty) {
          setErrorMsg('Laporan serupa sedang dalam antrean peninjauan oleh tim Aero. Terima kasih!');
          setSubmitting(false);
          return;
        }
      }

      // 2. Insert new report
      const newReport: Omit<AppReport, 'id'> = {
        appId: app.id,
        appName: app.name,
        appSlug: app.slug,
        versionId: versionId || app.version || undefined,
        versionName: versionName || app.versionName || app.version || undefined,
        type: selectedType,
        description: description.trim(),
        status: 'open',
        priority: priority,
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      await addDoc(collection(db, 'reports'), newReport);

      // Set cooldown
      localStorage.setItem('last_report_timestamp', Date.now().toString());
      setCooldownSecs(60);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setErrorMsg('Gagal mengirim laporan. Pastikan koneksi internet aktif.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Tutup formulir laporan"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/40">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Laporan Berhasil Dikirim
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Terima kasih atas laporanmu untuk <span className="font-bold text-slate-700 dark:text-slate-200">{app.name}</span>. Tim kami akan segera memeriksa dan memperbaiki kendala tersebut.
            </p>
            <button
              onClick={onClose}
              aria-label="Selesai dan tutup"
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold rounded-xl transition-colors focus:outline-none"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/30 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="report-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Laporkan Kendala
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {app.name} {versionName ? `(v${versionName})` : ''}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Apa yang terjadi?
                </label>
                <div className="space-y-2">
                  {REPORT_OPTIONS.map((option) => (
                    <label
                      key={option.type}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        selectedType === option.type
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_type"
                        value={option.type}
                        checked={selectedType === option.type}
                        onChange={() => setSelectedType(option.type)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="report-description" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi (opsional)
                </label>
                <textarea
                  id="report-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan detail kendala yang kamu temukan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || cooldownSecs > 0}
                  aria-label="Kirim Laporan"
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Laporan...</span>
                    </>
                  ) : cooldownSecs > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Tunggu ({cooldownSecs}s)</span>
                    </>
                  ) : (
                    <span>Kirim Laporan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
