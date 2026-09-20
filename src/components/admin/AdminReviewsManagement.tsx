import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Trash2, ShieldAlert, Check, RefreshCw, Filter, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function AdminReviewsManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const list: any[] = [];
      try {
        const snap = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')));
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      } catch (err) {
        // fallback query without ordering if index is missing
        const snap = await getDocs(collection(db, 'reviews'));
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      }
      setReviews(list);
    } catch (err: any) {
      setMessage({ text: 'Gagal memuat ulasan: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
      setMessage({ text: 'Ulasan berhasil dihapus', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Gagal menghapus ulasan: ' + err.message, type: 'error' });
    }
  };

  const filtered = reviews.filter(r => {
    const matchesSearch = 
      (r.comment || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.appName || '').toLowerCase().includes(search.toLowerCase());
    const matchesRating = ratingFilter === 'all' || r.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            Moderasi Ulasan & Rating Pengguna
          </div>
          <h2 className="text-xl font-black mt-1">Manajemen Ulasan Aplikasi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau dan moderasi ulasan publik dari pengguna untuk menjaga kualitas komunitas Mod Station.
          </p>
        </div>

        <button
          onClick={loadReviews}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari teks komentar, pengguna, atau nama aplikasi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Rating ⭐</option>
            <option value="5">5 Bintang ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Bintang ⭐⭐⭐⭐</option>
            <option value="3">3 Bintang ⭐⭐⭐</option>
            <option value="2">2 Bintang ⭐⭐</option>
            <option value="1">1 Bintang ⭐</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filtered.map((rev, idx) => (
          <div key={rev.id || idx} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-amber-500/30 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-sm flex items-center justify-center shrink-0">
                  {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.userName || 'Pengguna Anonim'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                      {rev.appName || rev.appId || 'Aplikasi'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                      />
                    ))}
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(rev.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                title="Hapus Ulasan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              {rev.comment}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Tidak ada ulasan yang sesuai dengan kriteria pencarian.
          </div>
        )}
      </div>
    </div>
  );
}
