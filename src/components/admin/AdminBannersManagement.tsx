import React, { useState, useEffect } from 'react';
import { 
  Flag, Plus, Edit3, Trash2, CheckCircle2, Clock, X, Save, Eye, 
  Search, Filter, RefreshCw, Video, Image as ImageIcon, Sparkles, AlertCircle, Play, ExternalLink
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy 
} from 'firebase/firestore';
import { BannerItem, BannerDestinationType } from '../../types';
import { BANNER_IMAGE_FALLBACK } from '../../services/bannerService';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminBannersManagementProps {
  currentUser: any;
  apps?: any[];
}

export default function AdminBannersManagement({ currentUser, apps = [] }: AdminBannersManagementProps) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editor Modal State
  const [showEditor, setShowEditor] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<BannerItem> | null>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'banners'), orderBy('priority', 'desc')));
      const loaded: BannerItem[] = [];
      snap.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as BannerItem);
      });
      setBanners(loaded);
    } catch (err) {
      console.warn('Firestore banners collection notice:', err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBanner({
      id: `banner-${Date.now()}`,
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      image: '',
      imageUrl: '',
      ctaLabel: 'Pelajari Selengkapnya',
      destinationType: 'internal',
      destination: 'home',
      isActive: true,
      priority: 100,
      order: 0,
      tag: 'Promo'
    });
    setShowEditor(true);
  };

  const handleOpenEditModal = (item: BannerItem) => {
    setEditingBanner({ 
      ...item, 
      mediaType: item.mediaType || 'image',
      mediaUrl: item.mediaUrl || item.imageUrl || item.image || ''
    });
    setShowEditor(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title?.trim() || !editingBanner.description?.trim()) {
      setMessage({ text: 'Judul dan deskripsi banner wajib diisi!', type: 'error' });
      return;
    }

    const mediaUrl = editingBanner.mediaUrl || editingBanner.imageUrl || editingBanner.image || BANNER_IMAGE_FALLBACK;

    setActionLoading(true);
    setMessage(null);

    try {
      const now = new Date().toISOString();
      const bannerId = editingBanner.id || `banner-${Date.now()}`;

      const dataToSave: BannerItem = {
        id: bannerId,
        title: editingBanner.title.trim(),
        description: editingBanner.description.trim(),
        mediaType: editingBanner.mediaType || 'image',
        mediaUrl: mediaUrl,
        image: mediaUrl,
        imageUrl: mediaUrl,
        thumbnailUrl: editingBanner.thumbnailUrl || '',
        ctaLabel: editingBanner.ctaLabel || 'Pelajari Selengkapnya',
        destinationType: (editingBanner.destinationType as BannerDestinationType) || 'internal',
        destination: editingBanner.destination?.trim() || 'home',
        isActive: editingBanner.isActive !== false,
        priority: Number(editingBanner.priority) || 100,
        order: Number(editingBanner.order) || 0,
        startAt: editingBanner.startAt || '',
        endAt: editingBanner.endAt || '',
        tag: editingBanner.tag || 'Promo',
        createdAt: editingBanner.createdAt || now,
        updatedAt: now
      };

      await setDoc(doc(db, 'banners', bannerId), dataToSave);

      await logAdminAction({
        action: 'banner_saved',
        entityType: 'banner',
        entityId: bannerId,
        entityName: dataToSave.title,
        metadata: { isActive: dataToSave.isActive, priority: dataToSave.priority }
      });

      setMessage({ text: `Banner "${dataToSave.title}" berhasil disimpan!`, type: 'success' });
      setShowEditor(false);
      setEditingBanner(null);
      await loadBanners();
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setMessage({ text: 'Gagal menyimpan banner: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBanner = async (item: BannerItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Banner',
      message: `Apakah Anda yakin ingin menghapus banner "${item.title}"?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await deleteDoc(doc(db, 'banners', item.id));
          await logAdminAction({
            action: 'banner_deleted',
            entityType: 'banner',
            entityId: item.id,
            entityName: item.title
          });
          setMessage({ text: 'Banner berhasil dihapus.', type: 'success' });
          await loadBanners();
        } catch (err: any) {
          setMessage({ text: 'Gagal menghapus: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleToggleActive = async (item: BannerItem) => {
    try {
      const nextActive = !item.isActive;
      await updateDoc(doc(db, 'banners', item.id), {
        isActive: nextActive,
        updatedAt: new Date().toISOString()
      });
      setMessage({ text: `Status banner "${item.title}" diubah menjadi ${nextActive ? 'Aktif' : 'Nonaktif'}.`, type: 'success' });
      await loadBanners();
    } catch (err: any) {
      setMessage({ text: 'Gagal mengubah status: ' + err.message, type: 'error' });
    }
  };

  const filteredBanners = banners.filter(item => {
    if (statusFilter === 'active' && !item.isActive) return false;
    if (statusFilter === 'inactive' && item.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Pengelolaan Banner</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola banner promosi carousel utama (mendukung Gambar, GIF, dan Video), prioritas urutan, dan periode tayang.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Banner</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau deskripsi banner..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'active', label: 'Aktif' },
            { id: 'inactive', label: 'Nonaktif' }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
          <button
            type="button"
            onClick={loadBanners}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banners Grid / List */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Memuat data banner...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Flag className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada banner terdaftar</p>
            <p className="text-xs text-slate-400">Tambahkan banner promosi atau event untuk ditampilkan pada carousel utama.</p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Banner</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Preview & Media</th>
                  <th className="py-3 px-4">Judul & Deskripsi</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Priority / Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBanners.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 w-32">
                      <div className="w-24 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200 dark:border-slate-700 shrink-0">
                        {item.mediaType === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <Video className="h-5 w-5 text-blue-400" />
                          </div>
                        ) : (
                          <img
                            src={item.mediaUrl || item.imageUrl || item.image || BANNER_IMAGE_FALLBACK}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = BANNER_IMAGE_FALLBACK; }}
                          />
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded uppercase">
                          {item.mediaType || 'image'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 space-y-1 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
                      <div className="text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</div>
                      <div className="text-[10px] font-mono text-slate-400">Tag: {item.tag || 'Promo'} • CTA: {item.ctaLabel}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-bold uppercase">
                        {item.destinationType}: {item.destination}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      <div>P: {item.priority ?? 100}</div>
                      <div className="text-[10px] text-slate-400">O: {item.order ?? 0}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                          item.isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300'
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        {item.isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span>{item.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer"
                          title="Edit Banner"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(item)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg cursor-pointer"
                          title="Hapus Banner"
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
        )}
      </div>

      {/* CREATE / EDIT BANNER MODAL WITH LIVE PREVIEW */}
      {showEditor && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingBanner.createdAt ? 'Edit Banner Promosi' : 'Tambah Banner Baru'}
              </h3>
              <button onClick={() => setShowEditor(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* LIVE PREVIEW CARD */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Live Banner Preview (User Carousel Simulation)</label>
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-500/30">
                  <div className="space-y-2 z-10 flex-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-badge text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {editingBanner.tag || 'Promo'}
                    </span>
                    <h4 className="text-base font-black tracking-tight text-white">
                      {editingBanner.title?.trim() || 'Judul Banner Promosi'}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {editingBanner.description?.trim() || 'Deskripsi singkat mengenai promo atau event menarik yang sedang berlangsung.'}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs">
                        <span>{editingBanner.ctaLabel || 'Pelajari Selengkapnya'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  <div className="w-full md:w-44 h-28 rounded-xl bg-slate-800 overflow-hidden relative shrink-0 border border-white/10">
                    <img
                      src={editingBanner.mediaUrl || editingBanner.imageUrl || editingBanner.image || BANNER_IMAGE_FALLBACK}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = BANNER_IMAGE_FALLBACK; }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Judul Banner <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    placeholder="Contoh: Festival Game Android v2.4"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tag / Kategori Badge</label>
                  <input
                    type="text"
                    value={editingBanner.tag || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, tag: e.target.value })}
                    placeholder="Contoh: Eksklusif, Event, Promo"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi Banner <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={2}
                  value={editingBanner.description || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                  placeholder="Penjelasan lengkap mengenai banner ini..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Jenis Media</label>
                  <select
                    value={editingBanner.mediaType || 'image'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, mediaType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="image">Image (Gambar)</option>
                    <option value="gif">GIF Animasi</option>
                    <option value="video">Video URL</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">URL Media (Image / GIF / Video)</label>
                  <input
                    type="url"
                    value={editingBanner.mediaUrl || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, mediaUrl: e.target.value, imageUrl: e.target.value, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Destination Type</label>
                  <select
                    value={editingBanner.destinationType || 'internal'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, destinationType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="internal">Halaman Internal (home, discover, dll)</option>
                    <option value="app">Aplikasi (Slug)</option>
                    <option value="game">Game (Slug)</option>
                    <option value="event">Event (ID)</option>
                    <option value="article">Artikel (Slug)</option>
                    <option value="category">Kategori (Nama)</option>
                    <option value="external">External URL (https://...)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Destination Target / URL <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingBanner.destination || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, destination: e.target.value })}
                    placeholder="Contoh: whatsapp, games, atau event-id"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Label CTA</label>
                  <input
                    type="text"
                    value={editingBanner.ctaLabel || 'Pelajari Selengkapnya'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Prioritas (Priority)</label>
                  <input
                    type="number"
                    value={editingBanner.priority ?? 100}
                    onChange={(e) => setEditingBanner({ ...editingBanner, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Urutan (Order)</label>
                  <input
                    type="number"
                    value={editingBanner.order ?? 0}
                    onChange={(e) => setEditingBanner({ ...editingBanner, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status Aktif</label>
                  <select
                    value={editingBanner.isActive !== false ? 'true' : 'false'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="true">Aktif (Tampil)</option>
                    <option value="false">Nonaktif (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Mulai Tampil (Start At)</label>
                  <input
                    type="datetime-local"
                    value={editingBanner.startAt || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, startAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Berakhir (End At)</label>
                  <input
                    type="datetime-local"
                    value={editingBanner.endAt || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, endAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{actionLoading ? 'Menyimpan...' : 'Simpan Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{confirmDialog.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
