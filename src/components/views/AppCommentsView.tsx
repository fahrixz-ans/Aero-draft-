import React, { useState } from 'react';
import { MessageSquare, Heart, Reply, Flag, Send, Check } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AppData } from '../../types';

interface AppCommentsViewProps {
  app: AppData;
  onBack: () => void;
  currentUser?: any;
}

export default function AppCommentsView({
  app,
  onBack,
  currentUser
}: AppCommentsViewProps) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 'c1',
      author: 'Rifki Pratama',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
      time: '2 jam yang lalu',
      content: 'Apakah versi ini sudah mendukung fitur screen share kualitas full HD?',
      likes: 4,
      isLiked: false,
      replies: [
        {
          id: 'r1',
          author: 'Admin Mod Station',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
          time: '1 jam yang lalu',
          content: 'Halo kak Rifki, betul sekali. Versi ini sudah mendukung screen share HD dan resolusi dinamis.',
          isAdmin: true
        }
      ]
    },
    {
      id: 'c2',
      author: 'Dewi Lestari',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80',
      time: '5 jam yang lalu',
      content: 'Downloadnya cepet banget gaada 1 menit udah selesai. Makasih Mod Station!',
      likes: 8,
      isLiked: true,
      replies: []
    }
  ]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengguna Baru',
      avatar: currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
      time: 'Baru saja',
      content: commentText,
      likes: 0,
      isLiked: false,
      replies: []
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const handleToggleLike = (id: string) => {
    setComments(comments.map(c => {
      if (c.id === id) {
        return {
          ...c,
          likes: c.isLiked ? c.likes - 1 : c.likes + 1,
          isLiked: !c.isLiked
        };
      }
      return c;
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="app-comments-view-container">
      {/* Back button */}
      <BackButton onBack={onBack} label={`Kembali ke Detail ${app.name}`} showText={true} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={app.icon}
          alt={app.name}
          referrerPolicy="no-referrer"
          className="w-14 h-14 rounded-2xl object-cover shadow-sm"
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Diskusi & Komentar {app.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tanyakan masalah instalasi, kompatibilitas perangkat, atau bagikan saran.
          </p>
        </div>
      </div>

      {/* Write comment box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10">
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tulis pertanyaan atau tanggapan Anda..."
            rows={3}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Komentar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {comment.author}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {comment.time}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {comment.content}
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => handleToggleLike(comment.id)}
                className={`flex items-center gap-1 cursor-pointer transition-colors ${
                  comment.isLiked ? 'text-red-500 font-bold' : 'hover:text-red-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500' : ''}`} />
                <span>{comment.likes} Suka</span>
              </button>

              <button className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                <Reply className="w-3.5 h-3.5" />
                <span>Balas</span>
              </button>

              <button className="flex items-center gap-1 hover:text-amber-600 ml-auto cursor-pointer">
                <Flag className="w-3 h-3" />
                <span>Laporkan</span>
              </button>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-blue-500/30 space-y-2.5">
                {comment.replies.map((rep) => (
                  <div key={rep.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={rep.avatar}
                        alt={rep.author}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {rep.author}
                      </span>
                      {rep.isAdmin && (
                        <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-black rounded-md">
                          OFFICIAL
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto">{rep.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {rep.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
