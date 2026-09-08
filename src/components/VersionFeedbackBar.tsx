import React, { useState, useEffect } from 'react';
import { ThumbsUp, Meh, ThumbsDown, Loader2 } from 'lucide-react';
import { VersionFeedback, VersionFeedbackChoice, AeroUser as User } from '../types';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VersionFeedbackBarProps {
  appId: string;
  versionId: string;
  versionName: string;
  currentUser: User | null;
  onRequireLogin: () => void;
}

export default function VersionFeedbackBar({
  appId,
  versionId,
  versionName,
  currentUser,
  onRequireLogin
}: VersionFeedbackBarProps) {
  const [selectedChoice, setSelectedChoice] = useState<VersionFeedbackChoice | null>(null);
  const [counts, setCounts] = useState<{ good: number; neutral: number; bad: number }>({ good: 0, neutral: 0, bad: 0 });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadFeedbackData();
  }, [appId, versionId, currentUser?.uid]);

  const loadFeedbackData = async () => {
    if (!appId || !versionId) return;

    try {
      // 1. Fetch user's active choice
      if (currentUser?.uid) {
        const feedbackDocRef = doc(db, 'applications', appId, 'appVersions', versionId, 'feedback', currentUser.uid);
        const docSnap = await getDoc(feedbackDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as VersionFeedback;
          setSelectedChoice(data.feedback);
        } else {
          setSelectedChoice(null);
        }
      }

      // 2. Fetch aggregation counts for this version
      const allFeedbackSnap = await getDocs(
        collection(db, 'applications', appId, 'appVersions', versionId, 'feedback')
      );
      const summary = { good: 0, neutral: 0, bad: 0 };
      allFeedbackSnap.forEach((d) => {
        const item = d.data() as VersionFeedback;
        if (item.feedback === 'good') summary.good++;
        else if (item.feedback === 'neutral') summary.neutral++;
        else if (item.feedback === 'bad') summary.bad++;
      });
      setCounts(summary);
    } catch (err) {
      console.warn('Could not load version feedback:', err);
    }
  };

  const handleVote = async (choice: VersionFeedbackChoice) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setLoading(true);
    try {
      const feedbackDocRef = doc(db, 'applications', appId, 'appVersions', versionId, 'feedback', currentUser.uid);
      const payload: VersionFeedback = {
        id: currentUser.uid,
        appId,
        versionId,
        versionName,
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        feedback: choice,
        createdAt: new Date().toISOString()
      };

      await setDoc(feedbackDocRef, payload, { merge: true });
      setSelectedChoice(choice);
      await loadFeedbackData();
    } catch (err) {
      console.error('Error recording version feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200/80 dark:border-white/5 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          Bagaimana versi ini?
        </span>
      </div>

      <div className="flex items-center gap-2" role="group" aria-label={`Umpan balik versi ${versionName}`}>
        {/* Good */}
        <button
          onClick={() => handleVote('good')}
          disabled={loading}
          aria-label="Versi ini bagus"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedChoice === 'good'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Bagus</span>
          {counts.good > 0 && <span className="text-[10px] opacity-80">({counts.good})</span>}
        </button>

        {/* Neutral */}
        <button
          onClick={() => handleVote('neutral')}
          disabled={loading}
          aria-label="Versi ini biasa saja"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedChoice === 'neutral'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
          }`}
        >
          <Meh className="w-3.5 h-3.5" />
          <span>Biasa</span>
          {counts.neutral > 0 && <span className="text-[10px] opacity-80">({counts.neutral})</span>}
        </button>

        {/* Bad */}
        <button
          onClick={() => handleVote('bad')}
          disabled={loading}
          aria-label="Versi ini bermasalah"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedChoice === 'bad'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>Bermasalah</span>
          {counts.bad > 0 && <span className="text-[10px] opacity-80">({counts.bad})</span>}
        </button>
      </div>
    </div>
  );
}
