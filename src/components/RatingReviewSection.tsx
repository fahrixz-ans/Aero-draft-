import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Flag, Edit3, Trash2, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { AppData, AppRating, AppReview, ReviewReportReason, AeroUser as User } from '../types';
import { doc, getDoc, collection, query, where, limit, getDocs, updateDoc, setDoc, addDoc, deleteDoc, orderBy, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RatingReviewSectionProps {
  app: AppData;
  currentUser: User | null;
  onRequireLogin: () => void;
  onAppUpdated?: (updatedApp: Partial<AppData>) => void;
  onNavigate?: (view: string, slug?: string) => void;
}

const REASON_LABELS: { reason: ReviewReportReason; label: string }[] = [
  { reason: 'spam', label: 'Spam atau iklan' },
  { reason: 'irrelevant', label: 'Tidak relevan dengan aplikasi' },
  { reason: 'misleading', label: 'Informasi menyesatkan' },
  { reason: 'rule_violation', label: 'Pelanggaran aturan & etika' },
  { reason: 'other', label: 'Lainnya' }
];

export default function RatingReviewSection({
  app,
  currentUser,
  onRequireLogin,
  onAppUpdated,
  onNavigate
}: RatingReviewSectionProps) {
  // Current user's rating & review
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reviews list & pagination
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const REVIEWS_PER_PAGE = 5;

  // Report review modal state
  const [reportingReview, setReportingReview] = useState<AppReview | null>(null);
  const [reportReason, setReportReason] = useState<ReviewReportReason>('spam');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'yes' | 'no'>>({});

  const handleVoteHelpful = async (reviewId: string, vote: 'yes' | 'no') => {
    if (!app.id || helpfulVotes[reviewId]) return;
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: vote }));
    try {
      const revRef = doc(db, 'applications', app.id, 'reviews', reviewId);
      if (vote === 'yes') {
        await updateDoc(revRef, { helpfulCount: increment(1) });
      } else {
        await updateDoc(revRef, { unhelpfulCount: increment(1) });
      }
    } catch (e) {
      console.warn('Could not record helpful vote:', e);
    }
  };

  // Load user's rating and all reviews
  useEffect(() => {
    loadUserRatingAndReview();
    loadPublicReviews();
  }, [app.id, currentUser?.uid]);

  const loadUserRatingAndReview = async () => {
    if (!currentUser || !app.id) {
      setUserRating(0);
      setReviewText('');
      setExistingReviewId(null);
      return;
    }

    try {
      // 1. Fetch user's rating
      const ratingDocRef = doc(db, 'applications', app.id, 'ratings', currentUser.uid);
      const ratingSnap = await getDoc(ratingDocRef);
      if (ratingSnap.exists()) {
        const data = ratingSnap.data() as AppRating;
        setUserRating(data.rating || 0);
      }

      // 2. Fetch user's review if any
      const reviewsRef = collection(db, 'applications', app.id, 'reviews');
      const q = query(reviewsRef, where('userId', '==', currentUser.uid), limit(1));
      const reviewSnap = await getDocs(q);
      if (!reviewSnap.empty) {
        const revDoc = reviewSnap.docs[0];
        const data = revDoc.data() as AppReview;
        setExistingReviewId(revDoc.id);
        setReviewText(data.reviewText || '');
      }
    } catch (err) {
      console.warn('Could not load user review/rating:', err);
    }
  };

  const loadPublicReviews = async () => {
    if (!app.id) return;
    setLoadingReviews(true);
    try {
      const reviewsRef = collection(db, 'applications', app.id, 'reviews');
      const q = query(
        reviewsRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list: AppReview[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppReview);
      });
      setReviews(list);
    } catch (err) {
      console.warn('Could not load public reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Re-aggregate ratings for the application
  const recalculateAndSyncAggregates = async () => {
    if (!app.id) return;
    try {
      const ratingsRef = collection(db, 'applications', app.id, 'ratings');
      const snap = await getDocs(ratingsRef);

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRatingSum = 0;
      let totalCount = 0;

      snap.forEach((doc) => {
        const data = doc.data() as AppRating;
        const r = Math.min(5, Math.max(1, Math.round(data.rating || 0)));
        if (r >= 1 && r <= 5) {
          distribution[r as 1 | 2 | 3 | 4 | 5]++;
          totalRatingSum += r;
          totalCount++;
        }
      });

      const ratingAverage = totalCount > 0 ? Number((totalRatingSum / totalCount).toFixed(1)) : 0;

      // Update in applications document
      const appRef = doc(db, 'applications', app.id);
      await updateDoc(appRef, {
        ratingAverage,
        ratingCount: totalCount,
        ratingDistribution: distribution,
        rating: ratingAverage // sync legacy field
      });

      if (onAppUpdated) {
        onAppUpdated({
          ratingAverage,
          ratingCount: totalCount,
          ratingDistribution: distribution,
          rating: ratingAverage
        });
      }
    } catch (err) {
      console.warn('Failed to sync rating aggregates:', err);
    }
  };

  // Handle rating click
  const handleSelectRating = async (ratingVal: number) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setUserRating(ratingVal);
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const ratingDocRef = doc(db, 'applications', app.id, 'ratings', currentUser.uid);
      const ratingData: AppRating = {
        id: currentUser.uid,
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        userDisplayName: currentUser.displayName || 'Pengguna Aero',
        userPhotoUrl: currentUser.photoURL || undefined,
        appId: app.id,
        rating: ratingVal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(ratingDocRef, ratingData, { merge: true });
      await recalculateAndSyncAggregates();
      setStatusMsg({ type: 'success', text: `Rating ${ratingVal} bintang berhasil disimpan!` });
    } catch (err: any) {
      console.error('Error saving rating:', err);
      setStatusMsg({ type: 'error', text: 'Gagal menyimpan rating. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submit/update review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (userRating === 0) {
      setStatusMsg({ type: 'error', text: 'Silakan berikan rating bintang terlebih dahulu.' });
      return;
    }

    if (!reviewText.trim()) {
      setStatusMsg({ type: 'error', text: 'Tuliskan ulasan singkat pengalamanmu.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const now = new Date().toISOString();
      const reviewPayload: Omit<AppReview, 'id'> = {
        appId: app.id,
        appName: app.name,
        appSlug: app.slug,
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        userDisplayName: currentUser.displayName || 'Pengguna Aero',
        userPhotoUrl: currentUser.photoURL || undefined,
        rating: userRating,
        reviewText: reviewText.trim(),
        status: 'published',
        createdAt: now,
        updatedAt: now
      };

      if (existingReviewId) {
        // Update existing review
        const reviewDocRef = doc(db, 'applications', app.id, 'reviews', existingReviewId);
        await updateDoc(reviewDocRef, {
          rating: userRating,
          reviewText: reviewText.trim(),
          updatedAt: now
        });
      } else {
        // Create new review
        const newRef = await addDoc(collection(db, 'applications', app.id, 'reviews'), reviewPayload);
        setExistingReviewId(newRef.id);
      }

      await recalculateAndSyncAggregates();
      await loadPublicReviews();

      setIsEditing(false);
      setStatusMsg({ type: 'success', text: 'Ulasan berhasil dipublikasikan!' });
    } catch (err: any) {
      console.error('Error saving review:', err);
      setStatusMsg({ type: 'error', text: 'Gagal mempublikasikan ulasan.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user's own review
  const handleDeleteReview = async () => {
    if (!currentUser || !existingReviewId) return;
    if (!window.confirm('Yakin ingin menghapus ulasan Anda?')) return;

    setSubmitting(true);
    try {
      await deleteDoc(doc(db, 'applications', app.id, 'reviews', existingReviewId));
      setExistingReviewId(null);
      setReviewText('');
      setIsEditing(false);
      await loadPublicReviews();
      setStatusMsg({ type: 'success', text: 'Ulasan berhasil dihapus.' });
    } catch (err) {
      console.error('Error deleting review:', err);
      setStatusMsg({ type: 'error', text: 'Gagal menghapus ulasan.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit report on another user's review
  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;

    setReportSubmitting(true);
    try {
      const selectedOption = REASON_LABELS.find(r => r.reason === reportReason);
      await addDoc(collection(db, 'reviewReports'), {
        reviewId: reportingReview.id,
        appId: app.id,
        appName: app.name,
        reason: reportReason,
        reasonLabel: selectedOption?.label || 'Lainnya',
        reportedByUserId: currentUser?.uid || 'guest',
        reportedByUserEmail: currentUser?.email || undefined,
        details: reportDetails.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setReportSuccess(true);
    } catch (err) {
      console.error('Error reporting review:', err);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Rating aggregate calculation from real data
  const ratingCount = app.ratingCount || 0;
  const ratingAverage = app.ratingAverage || 0;
  const distribution = app.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Pagination for reviews
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const displayedReviews = reviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);

  return (
    <div className="space-y-8" id="rating-and-reviews">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (onNavigate) onNavigate('rating', app.slug);
            else window.location.hash = `/apps/${app.slug}/rating`;
          }}
          className="group flex items-center gap-2 text-left cursor-pointer"
        >
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
              <span>Rating & ulasan</span>
              <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pendapat komunitas pengguna terverifikasi Mod Station
            </p>
          </div>
        </button>

        {/* 13. TULIS ULASAN Button */}
        <button
          onClick={() => {
            if (!currentUser) {
              onRequireLogin();
              return;
            }
            if (onNavigate) onNavigate('review', app.slug);
            else window.location.hash = `/apps/${app.slug}/review`;
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Tulis Ulasan</span>
        </button>
      </div>

      {/* RATING SUMMARY & DISTRIBUTION (Real Data Only) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10">
        {/* Left Column: Big Average */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10">
          {ratingCount > 0 ? (
            <>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {ratingAverage.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(ratingAverage) ? 'fill-amber-500' : 'text-slate-300 dark:text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {ratingCount} {ratingCount === 1 ? 'rating' : 'rating'}
              </span>
            </>
          ) : (
            <div className="py-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 mb-1">
                Belum ada rating
              </p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Jadilah yang pertama memberikan penilaian untuk aplikasi ini.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Breakdown Bar */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-bold">
                <span className="w-4 text-slate-500 dark:text-slate-400 text-right">{stars}</span>
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-slate-400 dark:text-slate-500 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* USER INTERACTION: RATE & WRITE REVIEW */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center text-center space-y-4">
        {existingReviewId && !isEditing ? (
          <div className="w-full text-left">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">Ulasan Anda</h3>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= userRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'}`}
                />
              ))}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-150 dark:border-white/5 mb-3">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                "{reviewText}"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('review', app.slug)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Ulasan</span>
              </button>
              <span className="text-slate-300 dark:text-white/10">·</span>
              <button
                type="button"
                onClick={handleDeleteReview}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Bagaimana pendapat Anda?</h3>
              <p className="text-xs text-slate-500">Bantu pengguna lain dengan membagikan pengalaman Anda.</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('review', app.slug)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl w-full sm:w-auto"
            >
              Tulis Ulasan
            </button>
          </>
        )}
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Ulasan Komunitas ({reviews.length})
          </h3>
          {reviews.length > 0 && (
            <button
              onClick={() => onNavigate && onNavigate('rating', app.slug)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua →
            </button>
          )}
        </div>

        {loadingReviews ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold">Memuat ulasan...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Belum ada ulasan teks untuk aplikasi ini.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Jadilah yang pertama menuliskan review pengalamanmu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    {rev.userPhotoUrl ? (
                      <img
                        src={rev.userPhotoUrl}
                        alt={rev.userDisplayName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center text-xs font-black">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.userDisplayName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating ? 'fill-amber-500' : 'text-slate-300 dark:text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Report button for other users */}
                  {currentUser?.uid !== rev.userId && (
                    <button
                      onClick={() => {
                        setReportingReview(rev);
                        setReportSuccess(false);
                      }}
                      aria-label="Laporkan review ini"
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Laporkan ulasan"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-11">
                  {rev.reviewText}
                </p>

                {/* Apakah ulasan ini membantu? [Ya] [Tidak] */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-white/5 pl-11 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Apakah ulasan ini membantu?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVoteHelpful(rev.id, 'yes')}
                      disabled={!!helpfulVotes[rev.id]}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        helpfulVotes[rev.id] === 'yes'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => handleVoteHelpful(rev.id, 'no')}
                      disabled={!!helpfulVotes[rev.id]}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        helpfulVotes[rev.id] === 'no'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      Tidak
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Halaman sebelumnya"
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Halaman berikutnya"
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: LAPORKAN REVIEW */}
      {reportingReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setReportingReview(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-review-title"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReportingReview(null)}
              aria-label="Tutup dialog"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
            >
              <Flag className="w-4 h-4" />
            </button>

            {reportSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                  Laporan Terkirim
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Terima kasih, laporan ulasan akan segera ditinjau oleh tim moderator.
                </p>
                <button
                  onClick={() => setReportingReview(null)}
                  className="w-full py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportReview} className="space-y-4">
                <h4 id="report-review-title" className="text-sm font-black text-slate-900 dark:text-white">
                  Laporkan Ulasan Ini
                </h4>
                <p className="text-xs text-slate-500">
                  Mengapa Anda melaporkan ulasan dari <span className="font-bold">{reportingReview.userDisplayName}</span>?
                </p>

                <div className="space-y-2">
                  {REASON_LABELS.map((r) => (
                    <label
                      key={r.reason}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name="review_report_reason"
                        value={r.reason}
                        checked={reportReason === r.reason}
                        onChange={() => setReportReason(r.reason)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label htmlFor="report-details" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detail Tambahan (opsional)
                  </label>
                  <textarea
                    id="report-details"
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Tuliskan keterangan bila diperlukan..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {reportSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Kirim Laporan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportingReview(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
