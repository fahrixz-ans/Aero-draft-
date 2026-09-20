import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Download, Search, RefreshCw, Check, AlertCircle, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStoredSubscribers, deleteStoredSubscriber } from '../../utils/appStorage';

export default function AdminNewsletterManagement() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const list: any[] = [];
      try {
        const snap = await getDocs(collection(db, 'subscribers'));
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Firestore subscribers read notice:', err);
      }

      // Merge with stored subscribers
      const localSubs = getStoredSubscribers();
      localSubs.forEach(s => {
        if (!list.some(l => l.email === s.email)) {
          list.push(s);
        }
      });

      setSubscribers(list);
    } catch (err: any) {
      setMessage({ text: 'Gagal memuat langganan buletin: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Hapus ${email} dari daftar buletin?`)) return;

    try {
      try {
        await deleteDoc(doc(db, 'subscribers', id));
      } catch (err) {
        // local fallback
      }
      deleteStoredSubscriber(id);
      setSubscribers(prev => prev.filter(s => s.id !== id && s.email !== email));
      setMessage({ text: `Berhasil menghapus ${email}`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Gagal menghapus pelanggan: ' + err.message, type: 'error' });
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Email,Tanggal Langganan", ...subscribers.map(s => `${s.email},${s.subscribedAt || s.createdAt || ''}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `modstation_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = subscribers.filter(s => 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            Pengelolaan Buletin & Langganan Email
          </div>
          <h2 className="text-xl font-black mt-1">Daftar Pelanggan Buletin</h2>
          <p className="text-xs text-slate-400 mt-1">
            Total {subscribers.length} pengguna terdaftar untuk menerima pembaruan aplikasi dan berita Mod Station.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadSubscribers}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan alamat email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-2xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Alamat Email</th>
                <th className="py-3 px-4">Tanggal Bergabung</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {filtered.map((sub, idx) => (
                <tr key={sub.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{sub.email}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {sub.subscribedAt || sub.createdAt ? new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(sub.id, sub.email)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada pelanggan buletin yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
