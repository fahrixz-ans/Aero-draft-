export interface HelpCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId: string;
  excerpt: string;
  content: string;
  media?: {
    type: 'image' | 'gif';
    url: string;
    caption: string;
  }[];
  relatedQuestions?: string[];
  updatedAt: string;
}

export interface HelpQuestion {
  id: string;
  categoryId: string;
  categoryName: string;
  question: string;
  shortAnswer: string;
  articleSlug: string;
  suggestedFollowUps?: string[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'rekomendasi', name: 'Rekomendasi', iconName: 'Sparkles', description: 'Panduan menemukan aplikasi dan game pilihan terbaik' },
  { id: 'bug', name: 'Bug', iconName: 'AlertCircle', description: 'Pelaporan kendala teknis dan kesalahan sistem' },
  { id: 'developer', name: 'Developer', iconName: 'Code2', description: 'Portal publikasi, update APK, dan analitik developer' },
  { id: 'langganan', name: 'Langganan', iconName: 'Crown', description: 'Manajemen Mod Station Premium dan penghapusan iklan' },
  { id: 'umum', name: 'Informasi Umum', iconName: 'HelpCircle', description: 'Seputar platform Mod Station, unduhan, dan fitur' },
  { id: 'iklan', name: 'Iklan', iconName: 'Layers', description: 'Kebijakan periklanan dan mode bebas iklan' },
  { id: 'kebijakan', name: 'Kebijakan', iconName: 'ShieldCheck', description: 'Privasi, DMCA, kepatuhan keamanan, dan hak cipta' },
  { id: 'akun', name: 'Akun', iconName: 'User', description: 'Pengelolaan profil, ganti kata sandi, dan keamanan sesi' }
];

export const HELP_QUESTIONS: HelpQuestion[] = [
  {
    id: 'q-1',
    categoryId: 'akun',
    categoryName: 'Akun',
    question: 'Bagaimana cara mengganti kata sandi?',
    shortAnswer: 'Untuk mengganti kata sandi, buka menu Akun atau Pusat Bantuan > Bantuan Akun > Ganti Kata Sandi. Masukkan kata sandi lama, lalu ketik kata sandi baru Anda minimal 8 karakter dan konfirmasi. Tekan tombol Lanjut untuk menyimpan perubahan.',
    articleSlug: 'cara-mengganti-kata-sandi',
    suggestedFollowUps: [
      'Bagaimana jika saya lupa kata sandi lama?',
      'Apakah saya harus login ulang di perangkat lain setelah ganti sandi?'
    ]
  },
  {
    id: 'q-2',
    categoryId: 'developer',
    categoryName: 'Developer',
    question: 'Bagaimana cara mendaftar dan mempublikasikan aplikasi sebagai Developer?',
    shortAnswer: 'Buka menu Developer Console melalui Hamburger Menu. Lengkapi formulir pendaftaran developer atau klik Tambah Aplikasi untuk mengunggah berkas APK, screenshot resolusi tinggi, deskripsi, dan metadata aplikasi Anda. Tim kami akan melakukan pemindaian keamanan sebelum aplikasi aktif.',
    articleSlug: 'panduan-developer-dan-publikasi-apk',
    suggestedFollowUps: [
      'Berapa lama proses peninjauan APK oleh Mod Station Shield?',
      'Format dan ukuran maksimal berkas APK apa yang didukung?'
    ]
  },
  {
    id: 'q-3',
    categoryId: 'kebijakan',
    categoryName: 'Kebijakan',
    question: 'Apa itu sistem verifikasi keamanan Mod Station Shield?',
    shortAnswer: 'Mod Station Shield adalah sistem inspeksi keamanan otomatis dan manual yang memverifikasi tanda tangan kriptografi SHA-256 berkas APK, memindai tanda malware, dan memastikan integritas biner sebelum file dapat diunduh oleh publik.',
    articleSlug: 'sistem-keamanan-mod-station-shield',
    suggestedFollowUps: [
      'Bagaimana cara memverifikasi hash SHA-256 secara manual?',
      'Apakah semua aplikasi dijamin bebas malware?'
    ]
  },
  {
    id: 'q-4',
    categoryId: 'langganan',
    categoryName: 'Langganan',
    question: 'Bagaimana cara berlangganan Mod Station Premium?',
    shortAnswer: 'Buka menu Premium dari Hamburger Menu, pilih paket langganan yang tersedia, dan selesaikan konfirmasi. Status langganan Anda akan langsung aktif dengan centang ✓ Premium Aktif dan seluruh banner iklan di platform akan disembunyikan.',
    articleSlug: 'keuntungan-mod-station-premium',
    suggestedFollowUps: [
      'Apakah akun Premium berlaku di semua perangkat?',
      'Bagaimana cara membatalkan langganan?'
    ]
  },
  {
    id: 'q-5',
    categoryId: 'umum',
    categoryName: 'Informasi Umum',
    question: 'Apakah mengunduh berkas APK di Mod Station sepenuhnya aman?',
    shortAnswer: 'Ya, seluruh berkas APK yang tersedia di Mod Station disaring melalui protokol keamanan multi-layer Mod Station Shield. Setiap paket diverifikasi tanda tangannya dan disimpan pada server penyimpanan terenkripsi.',
    articleSlug: 'keamanan-unduhan-apk-mod-station',
    suggestedFollowUps: [
      'Mengapa Android menampilkan peringatan Sumber Tidak Dikenal?',
      'Bagaimana jika berkas unduhan rusak atau gagal dibuka?'
    ]
  },
  {
    id: 'q-6',
    categoryId: 'bug',
    categoryName: 'Bug',
    question: 'Bagaimana cara melaporkan bug atau kendala pada aplikasi?',
    shortAnswer: 'Anda dapat melaporkan kendala melalui menu Hubungi Kami (Customer Service). Pilih Buat Laporan Baru, tentukan kategori kendala, tuliskan rincian yang dialami, dan sertakan tangkapan layar jika ada.',
    articleSlug: 'cara-melaporkan-bug-dan-kendala-teknis',
    suggestedFollowUps: [
      'Berapa lama tiket laporan direspon oleh tim Customer Service?',
      'Di mana saya bisa memantau status tiket laporan saya?'
    ]
  },
  {
    id: 'q-7',
    categoryId: 'umum',
    categoryName: 'Informasi Umum',
    question: 'Bagaimana cara memberikan donasi untuk mendukung Mod Station?',
    shortAnswer: 'Buka menu Donasi dari Hamburger Menu. Anda dapat memilih metode donasi instan melalui QRIS atau transfer rekening Bank (SeaBank dan Bank Jago) dengan nomor rekening yang dapat langsung disalin.',
    articleSlug: 'cara-donasi-dan-dukungan-mod-station',
    suggestedFollowUps: [
      'Apakah ada batas minimum nominal donasi?',
      'Ke mana dana donasi dialokasikan?'
    ]
  },
  {
    id: 'q-8',
    categoryId: 'iklan',
    categoryName: 'Iklan',
    question: 'Mengapa terdapat iklan dan bagaimana cara menghilangkannya?',
    shortAnswer: 'Iklan digunakan untuk menutupi biaya operasional server dan bandwidth unduhan kecepatan tinggi. Untuk menikmati pengalaman bersih tanpa iklan apa pun, Anda dapat mengaktifkan Mod Station Premium.',
    articleSlug: 'kebijakan-iklan-dan-mode-bebas-iklan',
    suggestedFollowUps: [
      'Apakah iklan mengumpulkan data pribadi saya?',
      'Bagaimana cara beralih ke Premium?'
    ]
  },
  {
    id: 'q-9',
    categoryId: 'kebijakan',
    categoryName: 'Kebijakan',
    question: 'Bagaimana prosedur pelaporan pelanggaran hak cipta (DMCA)?',
    shortAnswer: 'Jika Anda adalah pemegang hak cipta dan menemukan konten yang melanggar, silakan kunjungi halaman DMCA melalui Hamburger Menu dan kirimkan pemberitahuan resmi yang mencakup bukti kepemilikan dan tautan konten.',
    articleSlug: 'prosedur-klaim-hak-cipta-dmca',
    suggestedFollowUps: [
      'Berapa lama proses take-down materi DMCA?',
      'Apa saja dokumen identitas yang wajib dilampirkan?'
    ]
  },
  {
    id: 'q-10',
    categoryId: 'rekomendasi',
    categoryName: 'Rekomendasi',
    question: 'Bagaimana cara memperbarui aplikasi yang telah diunduh?',
    shortAnswer: 'Kunjungi halaman aplikasi terkait di Mod Station dan periksa tab Versi. Jika terdapat versi yang lebih baru dari yang terpasang di perangkat Anda, unduh berkas APK baru dan pasang secara langsung tanpa perlu mencopot versi lama.',
    articleSlug: 'panduan-memperbarui-aplikasi-android',
    suggestedFollowUps: [
      'Apakah data aplikasi akan hilang saat update APK?',
      'Bagaimana cara mengetahui changelog versi terbaru?'
    ]
  }
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'art-help-1',
    slug: 'cara-mengganti-kata-sandi',
    title: 'Cara Mengganti Kata Sandi Akun Mod Station',
    category: 'Akun',
    categoryId: 'akun',
    excerpt: 'Langkah mudah memperbarui kata sandi akun Anda demi keamanan optimal dan perlindungan data profil.',
    updatedAt: '11 September 2026',
    content: `Keamanan akun adalah prioritas utama di Mod Station. Kami menyarankan pengguna untuk memperbarui kata sandi secara berkala guna mencegah akses yang tidak sah.

### Langkah-langkah Mengganti Kata Sandi:
1. Buka menu **Pusat Bantuan** atau langsung pilih **Ganti Kata Sandi** pada navigasi akun.
2. Masukkan **Kata Sandi Lama** yang saat ini aktif pada akun Anda.
3. Masukkan **Kata Sandi Baru** dengan standar keamanan: minimal 8 karakter, mengombinasikan huruf besar, huruf kecil, serta angka.
4. Tuliskan kembali pada kolom **Konfirmasi Kata Sandi Baru Anda** untuk memastikan tidak ada kesalahan ketik.
5. Tekan tombol **Lanjut**. Sistem akan memvalidasi dan menampilkan notifikasi sukses setelah pembaruan tersimpan.

### Tips Keamanan Tambahan:
- Jangan gunakan kata sandi yang sama dengan akun media sosial atau email Anda.
- Aktifkan sesi proteksi peramban dan hindari menyimpan sandi pada komputer publik.`,
    relatedQuestions: [
      'Bagaimana jika saya lupa kata sandi lama?',
      'Bagaimana cara memeriksa sesi login aktif?'
    ]
  },
  {
    id: 'art-help-2',
    slug: 'panduan-developer-dan-publikasi-apk',
    title: 'Panduan Lengkap Publikasi Aplikasi di Developer Console',
    category: 'Developer',
    categoryId: 'developer',
    excerpt: 'Petunjuk langkah demi langkah bagi developer untuk mengunggah berkas APK, mengelola versi, dan memantau ulasan.',
    updatedAt: '10 September 2026',
    content: `Developer Console Mod Station dirancang khusus agar pengembang aplikasi Android dapat mendistribusikan karya mereka kepada jutaan pengguna secara transparan, aman, dan tanpa biaya perantara.

### Persyaratan Berkas APK:
- Berkas harus berformat \`.apk\` valid dengan arsitektur yang didukung (armeabi-v7a, arm64-v8a, atau universal).
- Menandatangani berkas dengan sertifikat rilis (Release Keystore) resmi.
- Melampirkan ikon aplikasi resolusi 512x512 PNG dan minimal 3 tangkapan layar (screenshot).

### Tahapan Publikasi:
1. Buka **Developer Console** dari Hamburger Menu.
2. Pilih menu **Add Application** / **Tambah Aplikasi**.
3. Isi informasi detail: Nama Aplikasi, Package Name, Kategori, Versi, Ukuran Berkas, dan Catatan Rilis (Changelog).
4. Unggah berkas APK Anda. Sistem **Mod Station Shield** akan memverifikasi checksum SHA-256 dan sertifikat digital secara otomatis.
5. Klik **Publikasikan**. Aplikasi Anda akan segera tampil di katalog setelah verifikasi selesai.`,
    relatedQuestions: [
      'Berapa lama proses peninjauan APK oleh Mod Station Shield?',
      'Bagaimana cara memperbarui versi aplikasi yang sudah ada?'
    ]
  },
  {
    id: 'art-help-3',
    slug: 'sistem-keamanan-mod-station-shield',
    title: 'Mengenal Sistem Keamanan Mod Station Shield',
    category: 'Kebijakan',
    categoryId: 'kebijakan',
    excerpt: 'Penjelasan tentang bagaimana Mod Station Shield memeriksa tanda tangan biner dan memastikan setiap APK bebas ancaman.',
    updatedAt: '09 September 2026',
    content: `Mod Station Shield adalah fondasi perlindungan ekosistem kami. Setiap berkas yang diunggah ke repositori Mod Station harus melewati serangkaian pengujian integritas sebelum dibuka untuk publik.

### Komponen Pengujian Mod Station Shield:
1. **Verifikasi Hash Kriptografi SHA-256**: Memastikan berkas biner tidak mengalami korupsi atau penyisipan kode asing selama transfer data.
2. **Pemeriksaan Tanda Tangan Sertifikat Digital**: Memastikan sertifikat pengembang cocok dengan riwayat versi sebelumnya untuk mencegah pembajakan pembaruan.
3. **Analisis Izin Akses Android (Permissions Analysis)**: Memindai deklarasi \`AndroidManifest.xml\` untuk mengidentifikasi izin yang tidak wajar atau berisiko tinggi.

Seluruh data pengujian ini dicantumkan secara transparan pada setiap halaman detail aplikasi di bawah segmen **Keamanan Terverifikasi**.`,
    relatedQuestions: [
      'Bagaimana cara melihat hash SHA-256 pada halaman aplikasi?',
      'Apakah ada jaminan uang kembali jika unduhan bermasalah?'
    ]
  },
  {
    id: 'art-help-4',
    slug: 'keuntungan-mod-station-premium',
    title: 'Manfaat dan Cara Berlangganan Mod Station Premium',
    category: 'Langganan',
    categoryId: 'langganan',
    excerpt: 'Jelajahi fitur eksklusif bebas iklan, kecepatan server prioritas, dan dukungan premium dengan berlangganan.',
    updatedAt: '08 September 2026',
    content: `Mod Station Premium diciptakan untuk pengguna yang menginginkan pengalaman eksplorasi aplikasi yang paling murni, cepat, dan sepenuhnya bebas dari distraksi iklan.

### Keuntungan Utama Pengguna Premium:
- **Bebas Iklan Total**: Tidak ada spanduk banner atau iklan dalam bentuk apa pun di seluruh platform.
- **Pengalaman Lebih Bersih & Ringan**: Tampilan visual yang luas dengan waktu muat halaman yang lebih singkat.
- **Dukungan Prioritas**: Akses cepat ke tim customer service untuk pertanyaan teknis dan bantuan aplikasi.

### Mengaktifkan Langganan:
1. Akses menu **Premium** pada Hamburger Menu.
2. Pilih paket langganan yang tersedia dan klik **Berlangganan**.
3. Status akun Anda akan langsung diperbarui menjadi **✓ Premium Aktif**.`,
    relatedQuestions: [
      'Apakah saya bisa membatalkan langganan kapan saja?',
      'Apakah status Premium bisa dibagikan ke anggota keluarga?'
    ]
  },
  {
    id: 'art-help-5',
    slug: 'cara-melaporkan-bug-dan-kendala-teknis',
    title: 'Cara Melaporkan Bug dan Menghubungi Customer Service',
    category: 'Bug',
    categoryId: 'bug',
    excerpt: 'Panduan membuat tiket keluhan, melampirkan log masalah, dan berkomunikasi dengan tim representatif secara real-time.',
    updatedAt: '07 September 2026',
    content: `Kami berdedikasi untuk menyelesaikan setiap kendala teknis yang Anda jumpai secepat mungkin.

### Langkah Membuat Laporan:
1. Buka menu **Hubungi Kami** (Customer Service) melalui Hamburger Menu atau Pusat Bantuan.
2. Tekan tombol **Buat Tiket Laporan**.
3. Tentukan kategori kendala (Unduhan Gagal, Aplikasi Rusak, Masalah Akun, atau Saran).
4. Tuliskan deskripsi lengkap beserta tipe perangkat Android dan versi sistem operasi Anda.
5. Anda dapat memantau status laporan Anda (Open, In Progress, Waiting for User, Resolved) secara real-time pada tab **Laporan Saya**.`,
    relatedQuestions: [
      'Berapa lama rata-rata waktu respon customer service?',
      'Dapatkah saya membalas tiket laporan yang sedang diproses?'
    ]
  },
  {
    id: 'art-help-6',
    slug: 'cara-donasi-dan-dukungan-mod-station',
    title: 'Panduan Berdonasi Mendukung Komunitas Mod Station',
    category: 'Informasi Umum',
    categoryId: 'umum',
    excerpt: 'Bantu kami menjaga server tetap cepat, aman, dan dapat diakses bebas oleh semua orang melalui donasi QRIS dan Bank.',
    updatedAt: '06 September 2026',
    content: `Mod Station adalah platform independen yang dikembangkan dengan dedikasi untuk menyediakan repositori aplikasi Android yang aman, cepat, dan bersih.

### Metode Donasi yang Tersedia:
- **QRIS Instan**: Kompatibel dengan semua aplikasi perbankan digital dan dompet elektronik (GoPay, OVO, DANA, BCA Mobile, Livin, dll).
- **Transfer Bank**:
  - **SeaBank**: Atas Nama Mod Station Administrator.
  - **Bank Jago**: Atas Nama Mod Station Administrator.

Anda dapat menyalin nomor rekening dengan satu sentuhan pada halaman **Donasi**. Terima kasih atas setiap dukungan tulus Anda!`,
    relatedQuestions: [
      'Apakah donasi dikenakan biaya admin?',
      'Di mana saya bisa melihat daftar kanal media sosial resmi Mod Station?'
    ]
  }
];
