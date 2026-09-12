import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Check, Filter, ArrowLeft, Loader2, Flag, CheckCircle2, User as UserIcon } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppData, AppReview } from '../../types';

interface AppReviewsViewProps {
  app: AppData;
  onBack: () => void;
  currentUser?: any;
  onSignIn?: () => void;
}

export default function AppReviewsView({
  app,
  onBack,
  currentUser,
  onSignIn
}: AppReviewsViewProps) {
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'critical' | '5' | '4' | '3' | '2' | '1'>('all');
  const [sortBy, setSortBy] = useState<'relevant' | 'newest'>('relevant');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'yes' | 'no'>>({});

  useEffect(() => {
    loadReviews();
  }, [app.id]);

  const loadReviews = async () => {
    if (!app.id) return;
    setLoading(true);
    try {
      const reviewsRef = collection(db, 'applications', app.id, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const loaded: AppReview[] = [];
      snap.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as AppReview);
      });
      setReviews(loaded);
    } catch (err) {
      console.error("Error loading reviews from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId: string, type: 'yes' | 'no') => {
    if (helpfulVotes[reviewId]) return; // already voted
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: type }));

    if (type === 'yes') {
      try {
        const revRef = doc(db, 'applications', app.id, 'reviews', reviewId);
        await updateDoc(revRef, { helpfulCount: increment(1) });
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r));
      } catch (err) {
        console.error("Error updating helpful count:", err);
      }
    }
  };

  // Filter logic
  const filteredReviews = reviews.filter((r) => {
    if (filterType === 'all') return true;
    if (filterType === 'positive') return r.rating >= 4;
    if (filterType === 'critical') return r.rating <= 2;
    if (filterType === '5') return r.rating === 5;
    if (filterType === '4') return r.rating === 4;
    if (filterType === '3') return r.rating === 3;
    if (filterType === '2') return r.rating === 2;
    if (filterType === '1') return r.rating === 1;
    return true;
  });

  // Sort logic
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'relevant') {
      const scoreA = (a.helpfulCount || 0) * 2 + (a.reviewText?.length || 0) / 50;
      const scoreB = (b.helpfulCount || 0) * 2 + (b.reviewText?.length || 0) / 50;
      return scoreB - scoreA;
    }
    // newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate real distribution from database reviews or app metadata
  const totalCount = reviews.length > 0 ? reviews.length : (app.ratingCount || 0);
  const effectiveAverage = app.ratingAverage || app.rating || 0;

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviews.length > 0) {
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      distribution[star] = (distribution[star] || 0) + 1;
    });
  } else if (app.ratingDistribution) {
    distribution[5] = app.ratingDistribution[5] || 0;
    distribution[4] = app.ratingDistribution[4] || 0;
    distribution[3] = app.ratingDistribution[3] || 0;
    distribution[2] = app.ratingDistribution[2] || 0;
    distribution[1] = app.ratingDistribution[1] || 0;
  }

  const navigateToWriteReview = () => {
    window.location.hash = `/apps/${app.slug || app.id}/review`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in" id="app-reviews-page">
      {/* 14. HEADER */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={app.iconUrl || app.icon}
            alt={app.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {app.name}
              </h1>
              <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                <span>⭐</span> {effectiveAverage > 0 ? effectiveAverage.toFixed(1) : 'Belum ada rating'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Rating dan ulasan
            </p>
          </div>
        </div>

        <button
          onClick={navigateToWriteReview}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          Tulis Ulasan
        </button>
      </div>

      {/* RATING SUMMARY CARD */}
      <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
          <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {effectiveAverage > 0 ? effectiveAverage.toFixed(1) : '0.0'}
          </div>
          <div className="flex items-center gap-1 text-amber-500 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(effectiveAverage)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {totalCount > 0 ? `Berdasarkan ${totalCount} ulasan riil` : 'Belum ada rating masuk'}
          </p>
        </div>

        {/* Real Distribution Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-5 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-0.5">
                  <span>{star}</span>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-slate-400 font-mono text-[11px]">
                  {pct}% ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="space-y-3">
        {/* FILTER CHIPS: (Semua) (Positif) (Kritis) (⭐5) (⭐4) (⭐3) (⭐2) (⭐1) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'positive', label: 'Positif' },
            { id: 'critical', label: 'Kritis' },
            { id: '5', label: '⭐5' },
            { id: '4', label: '⭐4' },
            { id: '3', label: '⭐3' },
            { id: '2', label: '⭐2' },
            { id: '1', label: '⭐1' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                filterType === chip.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* SORTING BAR: Semua | Paling relevan / Terbaru | [Filter Icon] */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Urutkan:</span>
            <button
              onClick={() => setSortBy('relevant')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                sortBy === 'relevant'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Paling relevan
            </button>
            <span>/</span>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                sortBy === 'newest'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Terbaru
            </button>
          </div>

          <button
            onClick={() => setShowFilterModal(true)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Filter Opsi"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* POPUP ICON FILTER MODAL */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Pilih Urutan Ulasan
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSortBy('relevant');
                  setShowFilterModal(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  sortBy === 'relevant'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Paling relevan</span>
                {sortBy === 'relevant' && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setSortBy('newest');
                  setShowFilterModal(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  sortBy === 'newest'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Terbaru</span>
                {sortBy === 'newest' && <Check className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setShowFilterModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* DAFTAR ULASAN LENGKAP */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Mengambil ulasan dari database...</p>
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum ada ulasan untuk aplikasi ini.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Jadilah pengguna pertama yang membagikan pengalaman, performa, dan fitur aplikasi ini kepada komunitas.
            </p>
            <button
              onClick={navigateToWriteReview}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Tulis Ulasan Sekarang
            </button>
          </div>
        ) : (
          sortedReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs space-y-3"
            >
              {/* [Profil] | Nama pengguna */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {rev.userPhotoUrl ? (
                    <img
                      src={rev.userPhotoUrl}
                      alt={rev.userDisplayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">
                      {rev.userDisplayName || 'Pengguna Mod Station'}
                    </h4>
                    {/* {Jumlah bintang} | {Tanggal} */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-slate-300 dark:text-white/10">·</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ulasan */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {rev.reviewText}
              </p>

              {/* Apakah ulasan ini membantu? [Ya] [Tidak] */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-medium">
                  Apakah ulasan ini membantu?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(rev.id, 'yes')}
                    disabled={!!helpfulVotes[rev.id]}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      helpfulVotes[rev.id] === 'yes'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>Ya</span>
                    {(rev.helpfulCount || 0) > 0 && <span>({rev.helpfulCount})</span>}
                  </button>
                  <button
                    onClick={() => handleVote(rev.id, 'no')}
                    disabled={!!helpfulVotes[rev.id]}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      helpfulVotes[rev.id] === 'no'
                        ? 'bg-slate-200 dark:bg-white/20 text-slate-700 dark:text-slate-200'
                        : 'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>Tidak</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
