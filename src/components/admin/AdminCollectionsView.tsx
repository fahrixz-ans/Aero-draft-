import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Edit3, Trash2, CheckCircle2, XCircle, 
  ArrowUp, ArrowDown, Search, AppWindow, Save, RefreshCw, X
} from 'lucide-react';
import { AppCollection, AppData } from '../../types';
import { fetchAllCollections, saveCollection, deleteCollection } from '../../services/admin/collectionService';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminCollectionsViewProps {
  apps: AppData[];
}

export default function AdminCollectionsView({ apps }: AdminCollectionsViewProps) {
  const [collections, setCollections] = useState<AppCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState<AppCollection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCollections();
      setCollections(data);
    } catch (err) {
      console.warn('Failed loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setIsNew(true);
    setEditingCollection({
      id: `col_${Date.now()}`,
      title: '',
      slug: '',
      description: '',
      appIds: [],
      sortOrder: collections.length + 1,
      isPublished: true,
      type: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleSave = async (col: AppCollection) => {
    if (!col.title.trim()) {
      setMessage({ text: 'Judul koleksi wajib diisi.', type: 'error' });
      return;
    }

    try {
      const slug = col.slug || col.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const finalCol: AppCollection = {
        ...col,
        slug,
        updatedAt: new Date().toISOString()
      };

      await saveCollection(finalCol);
      await logAdminAction({
        action: isNew ? 'category_created' : 'category_updated',
        entityType: 'collection',
        entityId: finalCol.id,
        entityName: finalCol.title
      });

      setMessage({ text: 'Koleksi berhasil disimpan.', type: 'success' });
      setEditingCollection(null);
      loadData();
    } catch (err: any) {
      setMessage({ text: 'Gagal menyimpan koleksi.', type: 'error' });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteCollection(id);
      await logAdminAction({
        action: 'category_updated',
        entityType: 'collection',
        entityId: id,
        entityName: title,
        metadata: { deleted: true }
      });
      setMessage({ text: 'Koleksi berhasil dihapus.', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: 'Gagal menghapus koleksi.', type: 'error' });
    }
  };

  const toggleAppInCollection = (appId: string) => {
    if (!editingCollection) return;
    const current = editingCollection.appIds || [];
    const exists = current.includes(appId);
    const updated = exists ? current.filter(id => id !== appId) : [...current, appId];
    setEditingCollection({ ...editingCollection, appIds: updated });
  };

  const filteredCollections = collections.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableApps = apps.filter(a => 
    a.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
    a.developer.toLowerCase().includes(appSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Manajemen Koleksi Aplikasi (Curated Collections)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola kurasi aplikasi tematik seperti "Aplikasi Terbaik Minggu Ini", "Pilihan Redaksi", dan "Aplikasi Ringan".
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Koleksi Baru</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari koleksi berdasarkan nama atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Collections Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Memuat koleksi kurasi...</span>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold">Tidak ada koleksi ditemukan.</p>
          <p className="text-xs mt-1">Buat koleksi kurasi baru untuk ditampilkan di beranda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCollections.map((col) => {
            const collectionAppDetails = (col.appIds || [])
              .map(id => apps.find(a => a.id === id))
              .filter(Boolean) as AppData[];

            return (
              <div
                key={col.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{col.title}</h3>
                      {col.isPublished ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-500/10 text-slate-500 border border-slate-500/20">
                          Draf
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{col.description || 'Tidak ada deskripsi.'}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">/{col.slug} • Urutan #{col.sortOrder}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsNew(false);
                        setEditingCollection(col);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(col.id, col.title)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Apps in this collection */}
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Aplikasi Terdaftar ({collectionAppDetails.length})</p>
                  {collectionAppDetails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {collectionAppDetails.map(app => (
                        <div key={app.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <img src={app.icon || '/icon.png'} alt={app.name} className="w-4 h-4 rounded object-cover" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{app.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada aplikasi yang dimasukkan.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isNew ? 'Tambah Koleksi Baru' : `Edit Koleksi: ${editingCollection.title}`}
              </h3>
              <button onClick={() => setEditingCollection(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Koleksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aplikasi Produktivitas Terbaik"
                  value={editingCollection.title}
                  onChange={(e) => setEditingCollection({ ...editingCollection, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Koleksi
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan singkat mengenai koleksi ini..."
                  value={editingCollection.description}
                  onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urutan Tampilan (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={editingCollection.sortOrder}
                    onChange={(e) => setEditingCollection({ ...editingCollection, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCollection.isPublished}
                      onChange={(e) => setEditingCollection({ ...editingCollection, isPublished: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-xs">Publikasikan Koleksi Ini</span>
                  </label>
                </div>
              </div>

              {/* App Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Aplikasi Masuk Koleksi ({editingCollection.appIds?.length || 0} Terpilih)
                </label>
                <input
                  type="text"
                  placeholder="Cari aplikasi untuk ditambahkan..."
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs mb-2"
                />

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  {availableApps.map((app) => {
                    const isSelected = (editingCollection.appIds || []).includes(app.id);
                    return (
                      <div
                        key={app.id}
                        onClick={() => toggleAppInCollection(app.id)}
                        className={`flex items-center justify-between p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={app.icon || '/icon.png'} alt={app.name} className="w-6 h-6 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">{app.name}</p>
                            <p className="text-[10px] text-slate-500">{app.developer}</p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {isSelected ? 'Terpilih' : '+ Tambah'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSave(editingCollection)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Koleksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
