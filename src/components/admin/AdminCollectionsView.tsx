import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Edit3, Trash2, CheckCircle2, XCircle, 
  ArrowUp, ArrowDown, Search, AppWindow, Save, RefreshCw, X,
  Eye, Sliders, ShieldCheck, AlertTriangle, Play, Sparkles, Filter
} from 'lucide-react';
import { AppCollection, AppData } from '../../types';
import { SmartCollection, SmartCollectionType, SmartCollectionState, CollectionPlacement, CollectionSource } from '../../features/smartCollections/types/smartCollections';
import { SmartCollectionsService } from '../../features/smartCollections/services/smartCollectionsService';
import { isAppEligible } from '../../features/smartCollections/utils/collectionEligibility';
import { SmartCollectionShelf } from '../../features/smartCollections/components/SmartCollectionShelf';
import { fetchAllCollections, saveCollection, deleteCollection } from '../../services/admin/collectionService';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminCollectionsViewProps {
  apps: AppData[];
}

export default function AdminCollectionsView({ apps }: AdminCollectionsViewProps) {
  const [activeTab, setActiveTab] = useState<'smart' | 'legacy'>('smart');
  
  // Smart Collections State
  const [smartCollections, setSmartCollections] = useState<SmartCollection[]>([]);
  const [smartLoading, setSmartLoading] = useState(true);
  const [editingSmartCol, setEditingSmartCol] = useState<Partial<SmartCollection> | null>(null);
  const [previewCol, setPreviewCol] = useState<SmartCollection | null>(null);
  const [isNewSmart, setIsNewSmart] = useState(false);

  // Legacy Collections State
  const [legacyCollections, setLegacyCollections] = useState<AppCollection[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [editingLegacyCol, setEditingLegacyCol] = useState<AppCollection | null>(null);
  const [isNewLegacy, setIsNewLegacy] = useState(false);

  // Search queries & UI feedback
  const [searchQuery, setSearchQuery] = useState('');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load Smart Collections
  const loadSmartData = async () => {
    setSmartLoading(true);
    try {
      const data = await SmartCollectionsService.fetchSmartCollections();
      if (data.length === 0) {
        // Generate defaults if empty
        const initial = await SmartCollectionsService.generateHomeShelves(apps);
        setSmartCollections(initial);
      } else {
        setSmartCollections(data);
      }
    } catch (err) {
      console.warn('Gagal memuat Smart Collections, fallback ke memory:', err);
      const fallback = await SmartCollectionsService.generateHomeShelves(apps);
      setSmartCollections(fallback);
    } finally {
      setSmartLoading(false);
    }
  };

  // Load Legacy Collections
  const loadLegacyData = async () => {
    setLegacyLoading(true);
    try {
      const data = await fetchAllCollections();
      setLegacyCollections(data);
    } catch (err) {
      console.warn('Gagal memuat legacy collections:', err);
    } finally {
      setLegacyLoading(false);
    }
  };

  useEffect(() => {
    loadSmartData();
    loadLegacyData();
  }, [apps]);

  // ---------------------------------------------------------------------------
  // SMART COLLECTIONS HANDLERS
  // ---------------------------------------------------------------------------

  const handleCreateNewSmart = () => {
    setIsNewSmart(true);
    setEditingSmartCol({
      id: `sc_${Date.now()}`,
      title: '',
      description: '',
      type: 'EDITORIAL',
      source: 'EDITORIAL',
      placement: 'HOME',
      priority: smartCollections.length + 1,
      maxItems: 8,
      enabled: true,
      state: 'DRAFT',
      diversityRules: {
        maxSameDeveloper: 2,
        maxSameCategory: 3
      },
      editorialAppIds: [],
      items: []
    });
  };

  const handleSaveSmart = async (col: Partial<SmartCollection>) => {
    if (!col.title?.trim()) {
      setMessage({ text: 'Judul Smart Collection wajib diisi.', type: 'error' });
      return;
    }

    try {
      const regenerated = await SmartCollectionsService.generateCollection(
        {
          id: col.id || `sc_${Date.now()}`,
          title: col.title,
          description: col.description || '',
          type: col.type || 'EDITORIAL',
          source: col.source || 'EDITORIAL',
          placement: col.placement || 'HOME',
          priority: col.priority || 1,
          maxItems: col.maxItems || 8,
          enabled: col.enabled ?? true,
          state: col.state || 'PUBLISHED',
          diversityRules: col.diversityRules || { maxSameDeveloper: 2, maxSameCategory: 3 },
          editorialAppIds: col.editorialAppIds || []
        },
        apps
      );

      await SmartCollectionsService.saveSmartCollection(regenerated);
      await logAdminAction({
        action: isNewSmart ? 'category_created' : 'category_updated',
        entityType: 'collection',
        entityId: regenerated.id,
        entityName: regenerated.title
      });

      setMessage({ text: `Smart Collection "${regenerated.title}" berhasil disimpan & dievaluasi.`, type: 'success' });
      setEditingSmartCol(null);
      loadSmartData();
    } catch (err: any) {
      setMessage({ text: 'Gagal menyimpan Smart Collection: ' + err.message, type: 'error' });
    }
  };

  const handleRegenerateSmart = async (col: SmartCollection) => {
    try {
      setMessage({ text: `Memperbarui data dan peringkat "${col.title}"...`, type: 'success' });
      const regenerated = await SmartCollectionsService.generateCollection(col, apps);
      await SmartCollectionsService.saveSmartCollection(regenerated);
      await logAdminAction({
        action: 'category_updated',
        entityType: 'collection',
        entityId: col.id,
        entityName: col.title,
        metadata: { action: 'regenerate', itemCount: regenerated.items.length }
      });
      setMessage({ text: `Koleksi "${col.title}" berhasil diregenerasi (${regenerated.items.length} item aktif).`, type: 'success' });
      loadSmartData();
    } catch (err: any) {
      setMessage({ text: 'Gagal meregenerasi: ' + err.message, type: 'error' });
    }
  };

  const handleToggleState = async (col: SmartCollection) => {
    try {
      const nextState: SmartCollectionState = col.state === 'PUBLISHED' ? 'DISABLED' : 'PUBLISHED';
      const updated = {
        ...col,
        state: nextState,
        enabled: nextState === 'PUBLISHED',
        updatedAt: new Date().toISOString()
      };
      await SmartCollectionsService.saveSmartCollection(updated);
      await logAdminAction({
        action: 'category_updated',
        entityType: 'collection',
        entityId: col.id,
        entityName: col.title,
        metadata: { stateTransition: `${col.state} -> ${nextState}` }
      });
      setMessage({ text: `Status koleksi diubah ke ${nextState}.`, type: 'success' });
      loadSmartData();
    } catch (err: any) {
      setMessage({ text: 'Gagal memperbarui status: ' + err.message, type: 'error' });
    }
  };

  // Toggle app in editorial collection with live eligibility check
  const toggleEditorialApp = (app: AppData) => {
    if (!editingSmartCol) return;
    const current = editingSmartCol.editorialAppIds || [];
    const isPresent = current.includes(app.id);

    if (isPresent) {
      setEditingSmartCol({
        ...editingSmartCol,
        editorialAppIds: current.filter(id => id !== app.id)
      });
    } else {
      // Live eligibility check
      const check = isAppEligible(app);
      if (!check.eligible) {
        setMessage({ text: `Aplikasi tidak dapat dimasukkan: ${check.reason}`, type: 'error' });
        return;
      }
      setEditingSmartCol({
        ...editingSmartCol,
        editorialAppIds: [...current, app.id]
      });
    }
  };

  // ---------------------------------------------------------------------------
  // LEGACY COLLECTIONS HANDLERS
  // ---------------------------------------------------------------------------

  const handleCreateNewLegacy = () => {
    setIsNewLegacy(true);
    setEditingLegacyCol({
      id: `col_${Date.now()}`,
      title: '',
      slug: '',
      description: '',
      appIds: [],
      sortOrder: legacyCollections.length + 1,
      isPublished: true,
      type: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveLegacy = async (col: AppCollection) => {
    if (!col.title.trim()) {
      setMessage({ text: 'Judul koleksi wajib diisi.', type: 'error' });
      return;
    }

    try {
      const slug = col.slug || col.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const finalCol: AppCollection = { ...col, slug, updatedAt: new Date().toISOString() };

      await saveCollection(finalCol);
      await logAdminAction({
        action: isNewLegacy ? 'category_created' : 'category_updated',
        entityType: 'collection',
        entityId: finalCol.id,
        entityName: finalCol.title
      });

      setMessage({ text: 'Koleksi manual berhasil disimpan.', type: 'success' });
      setEditingLegacyCol(null);
      loadLegacyData();
    } catch (err: any) {
      setMessage({ text: 'Gagal menyimpan koleksi.', type: 'error' });
    }
  };

  const handleDeleteLegacy = async (id: string, title: string) => {
    if (!confirm(`Hapus koleksi "${title}"?`)) return;
    try {
      await deleteCollection(id);
      await logAdminAction({
        action: 'category_updated',
        entityType: 'collection',
        entityId: id,
        entityName: title,
        metadata: { deleted: true }
      });
      setMessage({ text: 'Koleksi manual berhasil dihapus.', type: 'success' });
      loadLegacyData();
    } catch (err) {
      setMessage({ text: 'Gagal menghapus koleksi.', type: 'error' });
    }
  };

  const filteredSmart = smartCollections.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.placement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Koleksi Aplikasi
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi rak pintar dinamis (Stage 9.9) dan koleksi manual katalog Aero.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'smart' ? (
            <button
              onClick={handleCreateNewSmart}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Smart Shelf</span>
            </button>
          ) : (
            <button
              onClick={handleCreateNewLegacy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Koleksi Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('smart')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'smart'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart Collections & Shelves (Stage 9.9)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {smartCollections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('legacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'legacy'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <AppWindow className="w-3.5 h-3.5" />
          <span>Koleksi Manual Legacy</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {legacyCollections.length}
          </span>
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama koleksi, penempatan, atau tipe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SMART COLLECTIONS VIEW                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'smart' && (
        <div className="space-y-4">
          {smartLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-500" />
              Memuat smart collections & mengevaluasi algoritma...
            </div>
          ) : filteredSmart.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              Belum ada Smart Collection yang terdaftar.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSmart.map((col) => (
                <div
                  key={col.id}
                  className="p-5 bg-white dark:bg-[#121722] border border-slate-200/80 dark:border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/40 transition-all shadow-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        {col.title}
                      </h3>
                      {/* State Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        col.state === 'PUBLISHED' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : col.state === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {col.state}
                      </span>
                      {/* Type Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {col.type}
                      </span>
                      {/* Placement Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        {col.placement}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {col.description}
                    </p>

                    {/* Metadata & Diversity metrics */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>Prioritas: <strong>#{col.priority}</strong></span>
                      <span>•</span>
                      <span>Item Aktif: <strong>{col.items?.length || 0} / {col.maxItems}</strong></span>
                      <span>•</span>
                      <span>Max Dev: <strong>{col.diversityRules?.maxSameDeveloper || 2}</strong></span>
                      <span>•</span>
                      <span>Max Kat: <strong>{col.diversityRules?.maxSameCategory || 3}</strong></span>
                      <span>•</span>
                      <span>Diperbarui: {new Date(col.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Preview */}
                    <button
                      onClick={() => setPreviewCol(col)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Lihat Preview Tampilan Shelf"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>Preview</span>
                    </button>

                    {/* Regenerate */}
                    <button
                      onClick={() => handleRegenerateSmart(col)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Regenerasi data & peringkat"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Regenerasi</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setIsNewSmart(false);
                        setEditingSmartCol(col);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Edit</span>
                    </button>

                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleState(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        col.state === 'PUBLISHED'
                          ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                      }`}
                    >
                      {col.state === 'PUBLISHED' ? 'Nonaktifkan' : 'Publikasikan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. LEGACY COLLECTIONS VIEW                                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'legacy' && (
        <div className="space-y-4">
          {legacyLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-500" />
              Memuat koleksi manual...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {legacyCollections.map((col) => (
                <div
                  key={col.id}
                  className="p-4 bg-white dark:bg-[#121722] border border-slate-200/80 dark:border-white/10 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{col.title}</h3>
                    <p className="text-xs text-slate-500">{col.description}</p>
                    <span className="text-[11px] text-slate-400">
                      {col.appIds?.length || 0} aplikasi terpilih
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsNewLegacy(false);
                        setEditingLegacyCol(col);
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLegacy(col.id, col.title)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SMART COLLECTION LIVE PREVIEW MODAL                        */}
      {/* ------------------------------------------------------------- */}
      {previewCol && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0E121A] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">
                  Live Shelf Preview (Placement: {previewCol.placement})
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {previewCol.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewCol(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Shelf rendering */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
              <SmartCollectionShelf
                collection={previewCol}
                onSelectApp={(item) => alert(`Memilih aplikasi: ${item.name}`)}
                onViewAll={(col) => alert(`Lihat semua untuk koleksi: ${col.title}`)}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewCol(null)}
                className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SMART COLLECTION EDITOR MODAL                              */}
      {/* ------------------------------------------------------------- */}
      {editingSmartCol && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0E121A] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {isNewSmart ? 'Buat Smart Collection Baru' : `Edit Smart Collection: ${editingSmartCol.title}`}
                </h2>
                <p className="text-xs text-slate-500">
                  Konfigurasi parameter algoritma, penempatan, dan kurasi editorial.
                </p>
              </div>
              <button
                onClick={() => setEditingSmartCol(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title & Placement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Koleksi *
                  </label>
                  <input
                    type="text"
                    value={editingSmartCol.title || ''}
                    onChange={(e) => setEditingSmartCol({ ...editingSmartCol, title: e.target.value })}
                    placeholder="Contoh: Aplikasi Paling Banyak Digunakan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Penempatan (Placement)
                  </label>
                  <select
                    value={editingSmartCol.placement || 'HOME'}
                    onChange={(e) => setEditingSmartCol({ ...editingSmartCol, placement: e.target.value as CollectionPlacement })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  >
                    <option value="HOME">HOME (Beranda)</option>
                    <option value="SEARCH">SEARCH (Hasil Pencarian)</option>
                    <option value="APP_DETAIL">APP_DETAIL (Halaman Aplikasi)</option>
                    <option value="CATEGORY">CATEGORY (Halaman Kategori)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Subtitle
                </label>
                <input
                  type="text"
                  value={editingSmartCol.description || ''}
                  onChange={(e) => setEditingSmartCol({ ...editingSmartCol, description: e.target.value })}
                  placeholder="Deskripsi singkat yang tampil di bawah judul shelf"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                />
              </div>

              {/* Type, Source, Priority & Max Items */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Koleksi
                  </label>
                  <select
                    value={editingSmartCol.type || 'POPULAR'}
                    onChange={(e) => setEditingSmartCol({ ...editingSmartCol, type: e.target.value as SmartCollectionType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  >
                    <option value="POPULAR">POPULAR (Populer)</option>
                    <option value="TRENDING">TRENDING (Tren Momentum)</option>
                    <option value="FRESH">FRESH (Rilis Terbaru)</option>
                    <option value="EDITORIAL">EDITORIAL (Kurasi Manual)</option>
                    <option value="PERSONALIZED">PERSONALIZED (Personalisasi)</option>
                    <option value="CONTEXTUAL">CONTEXTUAL (Kontekstual)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sumber Data
                  </label>
                  <select
                    value={editingSmartCol.source || 'RANKING'}
                    onChange={(e) => setEditingSmartCol({ ...editingSmartCol, source: e.target.value as CollectionSource })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  >
                    <option value="RANKING">RANKING</option>
                    <option value="ANALYTICS">ANALYTICS</option>
                    <option value="RECOMMENDATION">RECOMMENDATION</option>
                    <option value="SEARCH">SEARCH</option>
                    <option value="EDITORIAL">EDITORIAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioritas Tampil
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editingSmartCol.priority || 1}
                    onChange={(e) => setEditingSmartCol({ ...editingSmartCol, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maksimal Item
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="20"
                    value={editingSmartCol.maxItems || 8}
                    onChange={(e) => setEditingSmartCol({ ...editingSmartCol, maxItems: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  />
                </div>
              </div>

              {/* Diversity Rules */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-500" />
                  Aturan Keberagaman (Diversity Rules)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Maksimal Developer Sama dalam Satu Rak
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editingSmartCol.diversityRules?.maxSameDeveloper || 2}
                      onChange={(e) => setEditingSmartCol({
                        ...editingSmartCol,
                        diversityRules: {
                          maxSameDeveloper: Number(e.target.value),
                          maxSameCategory: editingSmartCol.diversityRules?.maxSameCategory || 3
                        }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">
                      Maksimal Kategori Sama dalam Satu Rak
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={editingSmartCol.diversityRules?.maxSameCategory || 3}
                      onChange={(e) => setEditingSmartCol({
                        ...editingSmartCol,
                        diversityRules: {
                          maxSameDeveloper: editingSmartCol.diversityRules?.maxSameDeveloper || 2,
                          maxSameCategory: Number(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* State & Editorial Picker if type === 'EDITORIAL' */}
              {editingSmartCol.type === 'EDITORIAL' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Pilih Aplikasi Kurasi Editorial ({editingSmartCol.editorialAppIds?.length || 0} Terpilih)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Live verification: hanya aplikasi lolos audit yang dapat dipilih
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Cari aplikasi untuk kurasi editorial..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                  />

                  <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5">
                    {apps
                      .filter(a => a.name.toLowerCase().includes(appSearchQuery.toLowerCase()) || a.developer.toLowerCase().includes(appSearchQuery.toLowerCase()))
                      .map((app) => {
                        const isSelected = (editingSmartCol.editorialAppIds || []).includes(app.id);
                        const eligibility = isAppEligible(app);

                        return (
                          <div
                            key={app.id}
                            onClick={() => toggleEditorialApp(app)}
                            className={`flex items-center justify-between p-2.5 transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50/70 dark:bg-blue-950/30' 
                                : !eligibility.eligible
                                ? 'opacity-50 cursor-not-allowed bg-slate-50/30'
                                : 'hover:bg-slate-100/50 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={app.icon || '/icon.png'} alt={app.name} className="w-7 h-7 rounded-lg object-cover" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{app.name}</p>
                                <p className="text-[10px] text-slate-400">{app.developer} • {app.category}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!eligibility.eligible && (
                                <span className="text-[10px] text-red-500 flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{eligibility.reason}</span>
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {isSelected ? 'Terpilih' : '+ Tambah'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* State Transition */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Koleksi (State Machine)
                </label>
                <select
                  value={editingSmartCol.state || 'PUBLISHED'}
                  onChange={(e) => setEditingSmartCol({ 
                    ...editingSmartCol, 
                    state: e.target.value as SmartCollectionState,
                    enabled: e.target.value === 'PUBLISHED'
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                >
                  <option value="PUBLISHED">PUBLISHED (Tampil di Aplikasi)</option>
                  <option value="READY">READY (Siap Diterbitkan)</option>
                  <option value="DRAFT">DRAFT (Konsep Internal)</option>
                  <option value="DISABLED">DISABLED (Dinonaktifkan Sementara)</option>
                  <option value="ARCHIVED">ARCHIVED (Diarsipkan)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setEditingSmartCol(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveSmart(editingSmartCol)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Smart Shelf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. LEGACY COLLECTION EDITOR MODAL                             */}
      {/* ------------------------------------------------------------- */}
      {editingLegacyCol && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E121A] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isNewLegacy ? 'Buat Koleksi Manual Baru' : 'Edit Koleksi Manual'}
            </h3>

            <div>
              <label className="block font-bold mb-1">Judul Koleksi</label>
              <input
                type="text"
                value={editingLegacyCol.title}
                onChange={(e) => setEditingLegacyCol({ ...editingLegacyCol, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Deskripsi</label>
              <input
                type="text"
                value={editingLegacyCol.description}
                onChange={(e) => setEditingLegacyCol({ ...editingLegacyCol, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLegacyCol(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveLegacy(editingLegacyCol)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
