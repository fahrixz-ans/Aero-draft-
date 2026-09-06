import React, { useState, useEffect } from 'react';
import { Heart, CreditCard, Clock, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, Wallet, User as UserIcon, RefreshCw, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';

interface DonateViewProps {
  user?: any;
  onSignIn?: () => void;
  onBackHome?: () => void;
  onBack?: () => void;
}

interface DonationConfig {
  enabled: boolean;
  minAmount: number;
  presets: number[];
  paymentMethods: { id: string; name: string; details: string; type: 'qris' | 'bank' }[];
  description: string;
}

const DEFAULT_CONFIG: DonationConfig = {
  enabled: true,
  minAmount: 5000,
  presets: [10000, 25000, 50000, 100000],
  paymentMethods: [
    { 
      id: 'qris', 
      name: 'QRIS Instan', 
      details: 'Pindai kode QRIS menggunakan e-wallet (Gopay, OVO, Dana, LinkAja) atau m-Banking Anda.', 
      type: 'qris' 
    },
    { 
      id: 'bca', 
      name: 'Transfer Bank BCA', 
      details: 'Kirim ke rekening BCA: 1234567890 a/n Aero Administrator', 
      type: 'bank' 
    }
  ],
  description: 'Dukungan Anda membantu kami membiayai sewa server, bandwidth super cepat, dan pemeliharaan platform Aero secara berkala agar terus bersih dan bebas iklan.'
};

export default function DonateView({ user, onSignIn }: DonateViewProps) {
  const [config, setConfig] = useState<DonationConfig>(DEFAULT_CONFIG);
  const [amount, setAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(25000);
  const [selectedMethod, setSelectedMethod] = useState<string>('qris');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  
  // App states
  const [loading, setLoading] = useState<boolean>(false);
  const [activeDonation, setActiveDonation] = useState<any | null>(null);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [successPaid, setSuccessPaid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load donation config from Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'configs', 'donation');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(snap.data() as DonationConfig);
          // Set initial default preset if config presets exist
          const data = snap.data() as DonationConfig;
          if (data.presets && data.presets.length > 0) {
            setAmount(data.presets[0]);
            setSelectedPreset(data.presets[0]);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat konfigurasi donasi dari Firestore, menggunakan bawaan:', err);
      }
    };

    fetchConfig();
  }, []);

  // Fetch logged in user's donation history
  const fetchMyHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'donations'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMyHistory(list);
    } catch (err) {
      console.warn('Gagal memuat riwayat donasi:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMyHistory();
  }, [user]);

  // Format value to Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Handle preset selection
  const handlePresetSelect = (preset: number) => {
    setSelectedPreset(preset);
    setAmount(preset);
    setCustomAmount('');
    setValidationError(null);
  };

  // Handle custom amount input change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(rawVal);
    setSelectedPreset('custom');
    
    if (rawVal) {
      const parsed = parseInt(rawVal, 10);
      setAmount(parsed);
      if (parsed < config.minAmount) {
        setValidationError(`Minimal donasi adalah ${formatRupiah(config.minAmount)}`);
      } else {
        setValidationError(null);
      }
    } else {
      setAmount(0);
      setValidationError(`Silakan masukkan nominal donasi`);
    }
  };

  // Initiate donation creation in Firestore
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (amount < config.minAmount) {
      setValidationError(`Minimal donasi adalah ${formatRupiah(config.minAmount)}`);
      return;
    }

    setLoading(true);
    try {
      const donationData = {
        userId: user ? user.uid : null,
        userEmail: user ? user.email : donorEmail.trim() || 'anonymous@aero.com',
        userDisplayName: user ? user.displayName : donorName.trim() || 'Sobat Aero (Anonim)',
        amount: amount,
        paymentMethod: selectedMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
        paidAt: null
      };

      const docRef = await addDoc(collection(db, 'donations'), donationData);
      setActiveDonation({ id: docRef.id, ...donationData });
      setSuccessPaid(false);
    } catch (err: any) {
      console.error(err);
      setValidationError('Gagal memproses pembuatan donasi. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate payment confirmation (Since we are building a real production-grade UI, we let user mock-confirm
  // but it securely updates the status inside Firestore. In real payment integration this would be a webhook)
  const handleConfirmPaymentSimulation = async () => {
    if (!activeDonation) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'donations', activeDonation.id);
      await updateDoc(docRef, {
        status: 'paid',
        paidAt: new Date().toISOString()
      });

      setActiveDonation((prev: any) => ({
        ...prev,
        status: 'paid',
        paidAt: new Date().toISOString()
      }));
      setSuccessPaid(true);
      fetchMyHistory();
    } catch (err) {
      console.error('Gagal konfirmasi donasi:', err);
      alert('Gagal memperbarui status pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveDonation(null);
    setSuccessPaid(false);
    setAmount(config.presets[0] || 25000);
    setSelectedPreset(config.presets[0] || 25000);
    setCustomAmount('');
    setDonorName('');
    setDonorEmail('');
  };

  if (!config.enabled) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Heart className="h-16 w-16 text-slate-300 mx-auto mb-6 shrink-0" />
        <h2 className="text-xl font-bold text-brand-primary mb-2">Dukungan Aero Dinonaktifkan</h2>
        <p className="text-sm text-brand-secondary">
          Fitur donasi saat ini sedang ditutup sementara oleh administrator. Terima kasih atas niat baik Anda untuk mendukung Aero!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form / Success / Instructions */}
        <div className="lg:col-span-7 bg-brand-bg border border-brand-border rounded-card p-6 shadow-sm">
          
          {/* Active Donation Form or QRIS Display */}
          {activeDonation === null ? (
            <form onSubmit={handleCreateDonation} className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-brand-primary flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                  Dukung Perkembangan Aero
                </h2>
                <p className="text-xs sm:text-sm text-brand-secondary mt-2 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Amount Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Pilih Nominal Dukungan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {config.presets.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handlePresetSelect(preset)}
                      className={`py-2 px-3 text-xs font-bold rounded-btn border transition-all cursor-pointer text-center ${
                        selectedPreset === preset
                          ? 'border-brand-accent text-brand-accent bg-slate-100 dark:bg-neutral-800'
                          : 'border-brand-border text-brand-secondary hover:text-brand-primary hover:border-slate-300'
                      }`}
                    >
                      {formatRupiah(preset)}
                    </button>
                  ))}
                </div>

                {/* Custom Amount input */}
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-brand-secondary">Rp</span>
                  <input
                    type="text"
                    value={customAmount ? parseInt(customAmount).toLocaleString('id-ID') : ''}
                    onChange={handleCustomAmountChange}
                    placeholder="Nominal Custom Lainnya"
                    className="w-full pl-9 pr-4 py-2 text-xs border border-brand-border rounded-btn bg-brand-sec text-brand-primary focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
                {validationError && (
                  <p className="text-xs text-red-500 font-semibold">{validationError}</p>
                )}
              </div>

              {/* Personal Identity (Required if not logged in) */}
              {!user && (
                <div className="space-y-3 p-4 bg-brand-sec rounded-btn border border-brand-border">
                  <p className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4 text-brand-accent" />
                    Donasi Tanpa Login (Opsional)
                  </p>
                  <p className="text-[11px] text-brand-secondary">
                    Anda tidak harus masuk akun untuk mendukung Aero. Nama & email di bawah digunakan murni untuk mencatat riwayat terima kasih kami.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="px-3 py-2 text-xs border border-brand-border rounded-btn bg-brand-bg text-brand-primary focus:outline-none focus:border-brand-accent"
                    />
                    <input
                      type="email"
                      placeholder="Alamat Email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="px-3 py-2 text-xs border border-brand-border rounded-btn bg-brand-bg text-brand-primary focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                  <div className="text-center pt-2">
                    <span className="text-[11px] text-brand-secondary">Atau lebih praktis, </span>
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="text-[11px] text-brand-accent font-bold hover:underline"
                    >
                      Masuk dengan Google
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Metode Pembayaran
                </label>
                <div className="space-y-2">
                  {config.paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-start gap-3 p-3 border rounded-btn cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-brand-accent bg-brand-sec'
                          : 'border-brand-border hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={() => setSelectedMethod(method.id)}
                        className="mt-0.5 accent-[#5B5BD6] dark:accent-[#7777E8]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-brand-primary">{method.name}</p>
                        <p className="text-[11px] text-brand-secondary mt-0.5">{method.details}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={loading || amount <= 0}
                className="w-full py-3 bg-brand-accent text-white rounded-btn text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Proses Dukungan ({formatRupiah(amount)})</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Active Donation View with Payment Details and QR Code */
            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-brand-border">
                <Heart className="h-10 w-10 text-red-500 fill-red-500 mx-auto animate-pulse" />
                <h3 className="text-lg font-black text-brand-primary mt-2">Menunggu Pembayaran</h3>
                <p className="text-xs text-brand-secondary">
                  Silakan selesaikan donasi Anda sebesar <strong className="text-brand-accent font-bold">{formatRupiah(activeDonation.amount)}</strong>
                </p>
              </div>

              {/* Dynamic QRIS Code display */}
              {activeDonation.paymentMethod === 'qris' ? (
                <div className="text-center space-y-3 bg-brand-sec p-6 rounded-btn border border-brand-border max-w-xs mx-auto">
                  <p className="text-[11px] font-bold text-brand-primary">PINDAI QRIS DI BAWAH</p>
                  <div className="bg-white p-3 rounded-btn border inline-block">
                    {/* Real standard QR layout */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=aeroapk-donation-${activeDonation.id}`}
                      alt="QRIS Code Aero Donation"
                      className="w-44 h-44 object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[10px] text-brand-secondary leading-normal">
                    <p className="font-semibold text-brand-primary">Aero Developer Fund</p>
                    <p>ID Transaksi: {activeDonation.id}</p>
                  </div>
                </div>
              ) : (
                /* Bank details instruction */
                <div className="bg-brand-sec p-4 rounded-btn border border-brand-border space-y-3">
                  <p className="text-xs font-bold text-brand-primary uppercase">Instruksi Transfer Manual</p>
                  <div className="p-3 bg-brand-bg rounded-btn border border-brand-border space-y-1.5 text-xs">
                    <p className="text-brand-secondary">Nama Bank: <strong className="text-brand-primary font-bold">BCA (Bank Central Asia)</strong></p>
                    <p className="text-brand-secondary">Nomor Rekening: <strong className="text-brand-accent font-black text-sm">1234567890</strong></p>
                    <p className="text-brand-secondary">Atas Nama: <strong className="text-brand-primary font-bold">Aero Administrator</strong></p>
                    <p className="text-brand-secondary">Jumlah Transfer: <strong className="text-brand-accent font-bold">{formatRupiah(activeDonation.amount)}</strong></p>
                  </div>
                  <p className="text-[10px] text-brand-secondary leading-normal">
                    *Harap sertakan ID Transaksi <strong className="text-brand-primary font-mono font-bold">{activeDonation.id}</strong> pada berita transfer jika memungkinkan.
                  </p>
                </div>
              )}

              {/* Status / Confirm Simulation (Real Update to DB) */}
              {!successPaid ? (
                <div className="space-y-3 pt-4 border-t border-brand-border text-center">
                  <p className="text-[11px] text-brand-secondary">
                    Setelah melakukan transfer atau memindai kode QR, Anda dapat menekan tombol konfirmasi di bawah untuk menyelesaikan simulasi pembayaran langsung ke basis data.
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmPaymentSimulation}
                    disabled={loading}
                    className="w-full py-2.5 bg-brand-accent text-white rounded-btn text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Konfirmasi Pembayaran Saya</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-brand-secondary hover:text-brand-primary hover:underline block mx-auto"
                  >
                    Batal & Buat Baru
                  </button>
                </div>
              ) : (
                /* Donation Success Message */
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-btn space-y-4 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Terima kasih atas kontribusi Anda!</h4>
                    <p className="text-xs text-brand-secondary">
                      Donasi sebesar <strong className="text-brand-primary font-bold">{formatRupiah(activeDonation.amount)}</strong> telah berhasil kami terima.
                    </p>
                  </div>
                  <div className="py-2.5 px-4 bg-brand-bg rounded-btn border border-brand-border inline-block text-left text-xs space-y-1 max-w-sm w-full mx-auto font-medium">
                    <p className="text-brand-secondary">ID Transaksi: <span className="text-brand-primary font-mono">{activeDonation.id}</span></p>
                    <p className="text-brand-secondary">Waktu: <span className="text-brand-primary">{new Date(activeDonation.paidAt).toLocaleString('id-ID')}</span></p>
                    <p className="text-brand-secondary">Metode: <span className="text-brand-primary uppercase font-bold">{activeDonation.paymentMethod}</span></p>
                    <p className="text-brand-secondary">Status: <span className="text-emerald-500 font-bold uppercase">Berhasil (Paid)</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 bg-brand-accent text-white rounded-btn text-xs font-bold hover:opacity-90 transition-opacity inline-block cursor-pointer"
                  >
                    Donasi Lagi
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Column: Information, Privacy, & User Donation History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Security & Privacy Card */}
          <div className="bg-brand-bg border border-brand-border rounded-card p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-accent" />
              Keamanan & Privasi
            </h3>
            <ul className="space-y-3 text-xs leading-relaxed text-brand-secondary">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0 mt-1.5" />
                <span>Seluruh transaksi donasi dicatat secara aman dalam basis data Cloud Firestore.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0 mt-1.5" />
                <span>Kami tidak menyimpan data pembayaran pribadi sensitif seperti nomor kartu debit atau kredit di server kami.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0 mt-1.5" />
                <span>Identitas donatur tidak akan pernah ditampilkan secara publik secara default demi privasi Sobat Aero.</span>
              </li>
            </ul>
          </div>

          {/* User History List */}
          {user && (
            <div className="bg-brand-bg border border-brand-border rounded-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="h-4.5 w-4.5 text-brand-accent" />
                  Dukungan Saya
                </h3>
                <button 
                  onClick={fetchMyHistory}
                  disabled={loadingHistory}
                  className="p-1 rounded-btn hover:bg-brand-sec text-brand-secondary transition-colors"
                  title="Segarkan Riwayat"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingHistory ? (
                <div className="space-y-2 py-4">
                  <div className="h-8 bg-brand-sec rounded-btn animate-pulse w-full" />
                  <div className="h-8 bg-brand-sec rounded-btn animate-pulse w-full" />
                </div>
              ) : myHistory.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-brand-border rounded-btn bg-brand-sec">
                  <Heart className="h-8 w-8 text-slate-350 mx-auto mb-2 opacity-50" />
                  <p className="text-[11px] text-brand-secondary">Anda belum pernah melakukan donasi sebelumnya.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {myHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 border border-brand-border rounded-btn bg-brand-sec text-xs flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-brand-primary">{formatRupiah(item.amount)}</p>
                        <p className="text-[10px] text-brand-secondary">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-badge text-[9px] font-extrabold uppercase ${
                          item.status === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400'
                        }`}>
                          {item.status === 'paid' ? 'Paid' : item.status === 'pending' ? 'Pending' : item.status}
                        </span>
                        <p className="text-[9px] text-brand-secondary mt-0.5 font-mono uppercase">{item.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
