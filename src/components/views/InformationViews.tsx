import React, { useState } from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  MessageSquare
} from 'lucide-react';
import AboutView from './AboutView';
import ContactView from './ContactView';
import BackButton from '../navigation/BackButton';

interface InfoViewProps {
  type: 'about' | 'faq' | 'contact' | 'privacy' | 'terms' | 'dmca' | 'disclaimer';
  onNavigate: (view: string) => void;
  onBack?: () => void;
}

export default function InformationViews({ type, onNavigate, onBack }: InfoViewProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('home');
    }
  };

  // Dedicated full redesign for About page
  if (type === 'about') {
    return <AboutView onNavigate={onNavigate} onBack={handleBackClick} />;
  }

  // Dedicated modern Contact page
  if (type === 'contact') {
    return <ContactView onNavigate={onNavigate} onBack={handleBackClick} />;
  }

  const faqs = [
    {
      q: 'Apakah semua file APK di Mod Station aman untuk diunduh?',
      a: 'Ya, seluruh file APK di Mod Station telah melalui pemindaian otomatis sistem keamanan Mod Station Shield, verifikasi tanda tangan digital resmi (SHA-256), dan pengujian integritas sebelum dipublikasikan.'
    },
    {
      q: 'Bagaimana cara memasang (install) file APK di smartphone Android?',
      a: 'Setelah proses unduh selesai, buka berkas APK di File Manager perangkat Anda. Jika muncul peringatan sistem, izinkan "Instal dari sumber tidak dikenal" (Unknown Sources) pada menu Pengaturan Keamanan perangkat Anda.'
    },
    {
      q: 'Apakah Mod Station menyediakan aplikasi versi modifikasi (MOD)?',
      a: 'Kami menyediakan kategori MOD APK terverifikasi untuk fitur ekstra seperti Bebas Iklan atau Fitur Premium Terbuka dengan tetap menjaga keamanan privasi pengguna.'
    },
    {
      q: 'Bagaimana cara memperbarui aplikasi yang diunduh dari Mod Station?',
      a: 'Anda dapat mengunjungi halaman aplikasi bersangkutan di Mod Station dan memilih versi terbaru yang tersedia. Riwayat pembaruan dan changelog dapat dilihat pada tab Versi.'
    }
  ];

  const getHeaderTitle = () => {
    switch (type) {
      case 'faq': return 'Pusat Bantuan & FAQ';
      case 'privacy': return 'Kebijakan Privasi';
      case 'terms': return 'Syarat dan Ketentuan';
      case 'dmca': return 'DMCA & Hak Cipta';
      case 'disclaimer': return 'Disclaimer Hukum';
      default: return 'Informasi';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="information-legal-views">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label={getHeaderTitle()} showText={true} />
      </div>

      {/* FAQ */}
      {type === 'faq' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Pertanyaan yang Sering Diajukan
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
              Jawaban seputar pengunduhan, keamanan data, dan pembaruan aplikasi.
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed border-t border-[#D2D2D7]/40 dark:border-[#38383A]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRIVACY POLICY */}
      {type === 'privacy' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Kebijakan Privasi
            </h1>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Terakhir diperbarui: 15 Maret 2026
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] space-y-4 leading-relaxed">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                1. Pengumpulan Informasi
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Kami hanya mengumpulkan data yang diperlukan untuk menyediakan fungsionalitas aplikasi, seperti email akun pendaftaran, preferensi tema, dan daftar aplikasi tersimpan untuk keperluan sinkronisasi antar perangkat.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                2. Keamanan Data
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Data kredensial dan sesi Anda dilindungi dengan enkripsi standar industri. Kami berkomitmen untuk tidak pernah menjual, menyewakan, atau menyalahgunakan data pribadi pengguna kepada pihak ketiga.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                3. Cookie dan Penyimpanan Lokal
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Kami menggunakan penyimpanan lokal browser untuk menyimpan status autentikasi dan preferensi antarmuka guna memberikan pengalaman pengguna yang cepat dan mulus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE */}
      {type === 'terms' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Syarat dan Ketentuan
            </h1>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Ketentuan penggunaan platform Mod Station
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] space-y-4 leading-relaxed">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                1. Penggunaan Layanan
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Pengguna menyetujui untuk menggunakan layanan Mod Station secara bertanggung jawab, untuk tujuan sah dan edukasi, serta tidak melanggar ketentuan hukum yang berlaku.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                2. Batasan Tanggung Jawab
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Seluruh berkas disediakan sebagaimana adanya ("as is"). Mod Station melakukan pemindaian keamanan berkala, namun pengguna disarankan tetap berhati-hati saat memasang berkas dari pihak ketiga pada perangkat masing-masing.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                3. Pembaruan Ketentuan
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Mod Station berhak memperbarui syarat dan ketentuan ini sewaktu-waktu. Perubahan akan berlaku efektif setelah dipublikasikan pada halaman ini.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DMCA */}
      {type === 'dmca' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Pemberitahuan Hak Cipta (DMCA)
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
              Mod Station menghormati hak kekayaan intelektual pihak lain dan mematuhi Digital Millennium Copyright Act.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] space-y-4 leading-relaxed">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                Prosedur Pengajuan Klaim Hak Cipta
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Jika Anda adalah pemilik hak cipta yang sah atas suatu karya atau aplikasi dan meyakini bahwa berkas yang tercantum di Mod Station melanggar hak cipta Anda, silakan hubungi tim Customer Service kami.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                Informasi yang Diperlukan
              </h2>
              <ul className="list-disc list-inside space-y-1 text-[#6E6E73] dark:text-[#A1A1A6]">
                <li>Nama lengkap dan informasi kontak resmi pemegang hak cipta</li>
                <li>Tautan URL spesifik konten di Mod Station yang dilaporkan</li>
                <li>Bukti kepemilikan hak cipta yang sah</li>
                <li>Pernyataan itikad baik bahwa penggunaan materi tersebut tidak diizinkan</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('customer-service')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hubungi Customer Service untuk Laporan DMCA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCLAIMER */}
      {type === 'disclaimer' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Disclaimer Hukum
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
              Ketentuan penafian hukum dan kepemilikan merek dagang.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] space-y-4 leading-relaxed">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                1. Non-Afiliasi Resmi
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Mod Station adalah platform independen katalog berkas Android Package (APK). Mod Station tidak berafiliasi, tidak disponsori, dan tidak memiliki hubungan kemitraan dengan Google LLC atau Google Play Store.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                2. Hak Cipta & Merek Dagang
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Seluruh logo, merek dagang, dan nama pengembang adalah milik masing-masing pemilik sah. Konten ditampilkan semata-mata untuk tujuan referensi dan identifikasi.
              </p>
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-sm sm:text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                3. Tanggung Jawab Pengguna
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                Penggunaan aplikasi yang diunduh merupakan tanggung jawab penuh pengguna masing-masing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

