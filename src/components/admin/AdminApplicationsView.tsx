import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Edit3, Trash2, History, Package, PlusCircle, 
  ExternalLink, ArrowUpDown, ChevronDown, CheckCircle2, AlertTriangle, HelpCircle,
  RefreshCw, X, Tag, User, Download, FileText, Archive, ArchiveRestore
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, onSnapshot, doc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { AppData, AppStatus } from '../../types';
import { CATEGORIES } from '../../data/appsData';
import AppEditorModal from './AppEditorModal';
import VersionManagerModal from './VersionManagerModal';
import ConfirmDialogModal from './ConfirmDialogModal';
import { logAdminAction } from '../../services/admin/auditLogService';

export default function AdminApplicationsView() {
  // Live State
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'downloads' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals / Actions State
  const [appToEdit, setAppToEdit] = useState<AppData | null>(null);
  const [appForVersions, setAppForVersions] = useState<AppData | null>(null);
  const [appToDelete, setAppToDelete] = useState<AppData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Firestore live collection listener
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const list: AppData[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AppData);
      });
      setApps(list);
      setLoading(false);
    }, (err) => {
      console.error('Firestore applications listener error:', err);
      setErrorMsg('Gagal terhubung ke database. Silakan segarkan halaman.');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter & Sort Logic
  const filteredApps = apps
    .filter((app) => {
      const matchSearch = 
        app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.slug?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'all' || app.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || app.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';

      if (sortBy === 'downloads') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortBy === 'updatedAt' || sortBy === 'releaseDate') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: 'name' | 'downloads' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!appToDelete) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await deleteDoc(doc(db, 'applications', appToDelete.id));
      await logAdminAction({
        action: 'app_deleted',
        entityType: 'application',
        entityId: appToDelete.id,
        entityName: appToDelete.name,
        metadata: { packageName: appToDelete.packageName }
      });
      setSuccessMsg(`Aplikasi "${appToDelete.name}" berhasil dihapus secara permanen.`);
      setAppToDelete(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal menghapus aplikasi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save / Update Action from Editor Modal
  const handleSaveApp = async (updatedAppData: AppData) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const docRef = doc(db, 'applications', updatedAppData.id);
      await setDoc(docRef, updatedAppData, { merge: true });
      await logAdminAction({
        action: 'app_updated',
        entityType: 'application',
        entityId: updatedAppData.id,
        entityName: updatedAppData.name,
        metadata: { packageName: updatedAppData.packageName }
      });
      setSuccessMsg(`Detail aplikasi "${updatedAppData.name}" berhasil diperbarui.`);
      setAppToEdit(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal menyimpan perubahan aplikasi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Archive / Publish Quick Toggle
  const handleToggleArchive = async (app: AppData) => {
    setActionLoading(true);
    const newStatus: AppStatus = app.status === 'published' ? 'archived' : 'published';
    try {
      await setDoc(doc(db, 'applications', app.id), { status: newStatus }, { merge: true });
      await logAdminAction({
        action: newStatus === 'archived' ? 'app_archived' : 'app_published',
        entityType: 'application',
        entityId: app.id,
        entityName: app.name,
        metadata: { previousStatus: app.status, newStatus }
      });
      setSuccessMsg(`Status aplikasi "${app.name}" diubah menjadi ${newStatus === 'published' ? 'Aktif (Published)' : 'Diarsipkan (Archived)'}.`);
    } catch (err: any) {
      setErrorMsg('Gagal mengubah status arsip: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-900 dark:text-slate-100">
      
      {/* Alert Banner for Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-500/10 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-rose-500/10 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Catalog Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-black tracking-tight text-slate-800 dark:text-white uppercase">
              Katalog Aplikasi Owner
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Kelola data aplikasi utama rilis, status publikasi, dan riwayat versi aman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black">
            Total {apps.length} Aplikasi
          </span>
        </div>
      </div>

      {/* Control Filters Area */}
      <div className="p-4 bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, package ID, developer, slug..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-450 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="published">Diterbitkan (Published)</option>
            <option value="draft">Draf (Draft)</option>
            <option value="archived">Diarsipkan (Archived)</option>
            <option value="scheduled">Dijadwalkan (Scheduled)</option>
          </select>
        </div>
      </div>

      {/* Main Apps Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Memuat data dari Firestore...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl bg-white dark:bg-black/10">
          <Package className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-600 dark:text-slate-400">Tidak ada aplikasi yang cocok</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Ubah kata kunci pencarian Anda atau periksa filter status.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5 font-semibold">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-black/20 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                  <th className="py-3 px-4">
                    <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 hover:text-slate-600">
                      <span>Aplikasi</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Kategori & Developer</th>
                  <th className="py-3 px-4 text-center">
                    <button onClick={() => toggleSort('downloads')} className="inline-flex items-center gap-1 hover:text-slate-600">
                      <span>Unduhan</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">
                    <button onClick={() => toggleSort('updatedAt')} className="inline-flex items-center gap-1 hover:text-slate-600">
                      <span>Pembaruan</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01]">
                    {/* App Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={app.iconUrl || app.icon || '/uploads/default-app-icon.png'} 
                          alt={app.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-white/5 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/default-app-icon.png';
                          }}
                        />
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                            {app.name}
                          </h4>
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                            {app.packageName || 'Tanpa Package ID'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Dev Column */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <Tag className="h-3 w-3 text-blue-500" />
                          {app.category}
                        </span>
                        <p className="text-[10px] font-semibold text-slate-400">
                          by {app.developerName || app.developer || 'Unknown Developer'}
                        </p>
                      </div>
                    </td>

                    {/* Downloads Column */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {new Intl.NumberFormat('id-ID').format(app.downloads || 0)}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        app.status === 'published' 
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                          : app.status === 'draft'
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-500/10 border-slate-500/25 text-slate-450 dark:text-slate-400'
                      }`}>
                        {app.status === 'published' ? 'aktif' : app.status === 'draft' ? 'draf' : app.status}
                      </span>
                    </td>

                    {/* Updated At Column */}
                    <td className="py-3.5 px-4 text-slate-450 dark:text-slate-500 font-mono text-[10px]">
                      {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : 'N/A'}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAppForVersions(app)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Kelola Riwayat Versi"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(app)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            app.status === 'archived'
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={app.status === 'archived' ? 'Terbitkan Ulang Aplikasi (Publish)' : 'Arsipkan Aplikasi (Archive)'}
                        >
                          {app.status === 'archived' ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setAppToEdit(app)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Ubah Detail Aplikasi"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAppToDelete(app)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Hapus Aplikasi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APP EDITOR MODAL */}
      {appToEdit && (
        <AppEditorModal
          app={appToEdit}
          isNew={false}
          categories={CATEGORIES as unknown as string[]}
          onSave={handleSaveApp}
          onClose={() => setAppToEdit(null)}
        />
      )}

      {/* VERSION MANAGER MODAL */}
      {appForVersions && (
        <VersionManagerModal
          app={appForVersions}
          isOpen={true}
          onClose={() => setAppForVersions(null)}
          onSaveSuccess={() => {
            setAppForVersions(null);
            setSuccessMsg('Versi aplikasi berhasil dimodifikasi di Firestore.');
          }}
        />
      )}

      {/* CONFIRM DELETE DIALOG */}
      {appToDelete && (
        <ConfirmDialogModal
          isOpen={true}
          title="Hapus Aplikasi Permanen?"
          message={`Apakah Anda yakin ingin menghapus aplikasi "${appToDelete.name}" beserta metadata rilis di Cloud Firestore secara permanen? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setAppToDelete(null)}
        />
      )}

    </div>
  );
}
