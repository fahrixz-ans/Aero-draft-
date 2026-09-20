import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Save, Plus, Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchDonationConfig, saveDonationConfig } from '../../services/donationService';
import { DonationConfigData, BankAccountData } from '../../types/donation';
import { ImageUploader } from './ImageUploader';

export default function AdminDonationsManagement() {
  const [config, setConfig] = useState<DonationConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await fetchDonationConfig();
      setConfig(data);
    } catch (err: any) {
      setMessage({ text: 'Gagal memuat konfigurasi donasi: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setMessage(null);
    try {
      await saveDonationConfig(config);
      setMessage({ text: 'Konfigurasi donasi berhasil diperbarui dan disimpan ke Firestore!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Gagal menyimpan konfigurasi: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBank = () => {
    if (!config) return;
    const newBank: BankAccountData = {
      id: `bank_${Date.now()}`,
      bankName: 'Bank BCA',
      accountHolder: 'NAMA PEMILIK',
      accountNumber: '1234567890'
    };
    setConfig({
      ...config,
      banks: [...config.banks, newBank]
    });
  };

  const handleRemoveBank = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      banks: config.banks.filter(b => b.id !== id)
    });
  };

  const handleBankChange = (id: string, field: keyof BankAccountData, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      banks: config.banks.map(b => b.id === id ? { ...b, [field]: value } : b)
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-xs font-semibold">Memuat data donasi dari Firestore...</span>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            Pengaturan Sistem Donasi
          </div>
          <h2 className="text-xl font-black mt-1">Konfigurasi Pembayaran Donasi</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Kelola QRIS resmi, daftar rekening bank, batas minimal donasi, dan pesan apresiasi yang ditampilkan kepada donatur di halaman <code className="text-emerald-300">#/donate</code>.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
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

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General Settings Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            Status & Pesan Utama
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Aktifkan Halaman Donasi</span>
                <span className="text-[11px] text-slate-400">Jika dinonaktifkan, fitur donasi tidak akan memproses pembayaran.</span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimal Donasi (IDR)</label>
              <input
                type="number"
                value={config.minAmount}
                onChange={e => setConfig({ ...config, minAmount: Number(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi / Pesan Donasi</label>
            <textarea
              rows={3}
              value={config.description}
              onChange={e => setConfig({ ...config, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* QRIS Configuration Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <QrCode className="w-4 h-4 text-emerald-500" />
            Konfigurasi QRIS (Standar QRIS Nasional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Merchant QRIS</label>
              <input
                type="text"
                value={config.qris?.merchantName || ''}
                onChange={e => setConfig({
                  ...config,
                  qris: { ...(config.qris || { merchantName: '', nmid: '', city: '', imageUrl: '' }), merchantName: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">NMID</label>
              <input
                type="text"
                value={config.qris?.nmid || ''}
                onChange={e => setConfig({
                  ...config,
                  qris: { ...(config.qris || { merchantName: '', nmid: '', city: '', imageUrl: '' }), nmid: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kota Merchant</label>
              <input
                type="text"
                value={config.qris?.city || ''}
                onChange={e => setConfig({
                  ...config,
                  qris: { ...(config.qris || { merchantName: '', nmid: '', city: '', imageUrl: '' }), city: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gambar Kode QRIS</label>
            <ImageUploader
              type="banner"
              currentUrl={config.qris?.imageUrl}
              onUpload={url => setConfig({
                ...config,
                qris: { ...(config.qris || { merchantName: '', nmid: '', city: '', imageUrl: '' }), imageUrl: url }
              })}
              label="Unggah QRIS Baru"
            />
          </div>
        </div>

        {/* Bank Accounts Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Daftar Rekening Bank Transfer
            </h3>
            <button
              type="button"
              onClick={handleAddBank}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekening</span>
            </button>
          </div>

          <div className="space-y-3">
            {config.banks.map((bank, index) => (
              <div key={bank.id || index} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Nama Bank (mis. SeaBank)"
                    value={bank.bankName}
                    onChange={e => handleBankChange(bank.id, 'bankName', e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Rekening"
                    value={bank.accountNumber}
                    onChange={e => handleBankChange(bank.id, 'accountNumber', e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Nama Pemilik Rekening"
                    value={bank.accountHolder}
                    onChange={e => handleBankChange(bank.id, 'accountHolder', e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBank(bank.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Hapus Rekening"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {config.banks.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Belum ada rekening bank yang dikonfigurasi. Klik tombol 'Tambah Rekening' untuk membuat rekening baru.
              </p>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
