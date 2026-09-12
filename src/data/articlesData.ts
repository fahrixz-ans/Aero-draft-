export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTimeMinutes: number;
  tags: string[];
}

export const ARTICLES_DATA: ArticleItem[] = [
  {
    id: 'art-1',
    slug: 'cara-menggunakan-2-whatsapp-dalam-1-hp',
    title: 'Cara Menggunakan 2 WhatsApp dalam 1 HP Tanpa Root',
    excerpt: 'Panduan lengkap dan aman mengaktifkan dua akun WhatsApp sekaligus pada satu perangkat Android menggunakan fitur bawaan Dual Messenger maupun profil terpisah.',
    coverImage: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&h=450&fit=crop&q=80',
    category: 'Tips & Trik',
    author: {
      name: 'Fahri Andrian',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80',
      role: 'Android Security Specialist'
    },
    publishedAt: '10 Mei 2026',
    readTimeMinutes: 4,
    tags: ['WhatsApp', 'Android', 'Produktivitas', 'Dual Messenger'],
    content: `## Pengantar
Banyak pengguna Android yang memiliki dua nomor telepon berbeda — satu untuk urusan bisnis atau pekerjaan, dan satu lagi untuk keperluan pribadi. Menggunakan dua nomor ini dalam satu perangkat telepon genggam kini sangat mudah tanpa perlu memodifikasi sistem atau melakukan root.

## 1. Fitur Bawaan Dual Apps / Kloning Aplikasi
Sebagian besar produsen smartphone Android modern telah menyediakan fitur kloning aplikasi resmi di dalam sistem operasinya:
- **Samsung**: Buka *Pengaturan > Fitur Lanjutan > Dual Messenger*, lalu aktifkan WhatsApp.
- **Xiaomi / POCO**: Buka *Setelan > Aplikasi > Aplikasi Ganda (Dual Apps)*.
- **OPPO / Realme**: Buka *Pengaturan > Manajemen Aplikasi > Kloning Aplikasi (App Cloner)*.
- **Vivo**: Masuk ke *Pengaturan > Pengganda Aplikasi (App Clone)*.

## 2. Menggunakan WhatsApp Business
Jika smartphone Anda tidak memiliki fitur aplikasi ganda bawaan, Anda dapat mengunduh **WhatsApp Business** resmi secara langsung dari AERO APK. Aplikasi ini kompatibel berjalan berdampingan dengan WhatsApp Messenger standar tanpa menimbulkan konflik data.

## 3. Fitur Multi-Akun Resmi WhatsApp
WhatsApp kini juga telah merilis fitur *Multiple Accounts* langsung di dalam aplikasi resminya:
1. Buka aplikasi WhatsApp terbaru (versi 2.24+).
2. Tekan ikon titik tiga di kanan atas atau buka menu **Setelan**.
3. Ketuk tanda panah kecil di sebelah nama profil Anda.
4. Pilih opsi **Tambah Akun** dan ikuti proses verifikasi nomor kedua Anda.

## Kesimpulan
Dengan memanfaatkan solusi resmi di atas, privasi dan keamanan pesan Anda tetap terenkripsi end-to-end secara maksimal tanpa risiko pemblokiran akun.`
  },
  {
    id: 'art-2',
    slug: '10-fitur-whatsapp-yang-harus-kamu-ketahui',
    title: '10 Fitur Tersembunyi WhatsApp yang Wajib Diketahui',
    excerpt: 'Kumpulan fitur rahasia WhatsApp terbaru mulai dari proteksi chat dengan sidik jari, edit pesan terkirim, hingga berbagi layar kualitas HD.',
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop&q=80',
    category: 'Eksplorasi Fitur',
    author: {
      name: 'Dwi Pratama',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&q=80',
      role: 'Tech Reviewer'
    },
    publishedAt: '8 Mei 2026',
    readTimeMinutes: 5,
    tags: ['WhatsApp', 'Fitur', 'Tutorial', 'Komunikasi'],
    content: `## Fitur Canggih WhatsApp di Tahun 2026
WhatsApp terus berinovasi memberikan kenyamanan dan privasi lebih tinggi bagi penggunanya. Berikut 10 fitur penting yang wajib Anda manfaatkan:

1. **Edit Pesan Terkirim**: Anda memiliki batas waktu hingga 15 menit untuk mengedit pesan yang sudah terkirim tanpa perlu menghapusnya.
2. **Kunci Pesan Rahasia (Chat Lock)**: Sembunyikan obrolan pribadi ke dalam folder terkunci yang hanya dapat dibuka dengan sidik jari atau kode sandi rahasia.
3. **Kirim Foto & Video Kualitas HD**: Tidak ada lagi kompresi buram. Anda dapat memilih kualitas foto 'HD' saat melampirkan media.
4. **Berbagi Layar (Screen Sharing)**: Bagikan layar smartphone Anda saat melakukan panggilan video untuk keperluan meeting atau membantu rekan kerja.
5. **Pesan Suara Sekali Dengar (View Once Voice Note)**: Kirim rekaman suara rahasia yang akan langsung terhapus otomatis setelah diputar oleh penerima.
6. **Filter Obrolan Belum Terbaca & Grup**: Akses cepat tab Belum Dibaca, Favorit, dan Grup langsung di atas daftar chat.
7. **Pindai Dokumen Langsung**: Fitur scanner terintegrasi untuk mengirimkan dokumen fisik dalam format PDF berkualitas tinggi.
8. **Reaksi Pesan dengan Emoji Apapun**: Tekan lama pesan dan tekan ikon plus (+) untuk memilih seluruh koleksi emoji.
9. **Jadwalkan Panggilan Grup**: Buat kalender pengingat panggilan suara atau video langsung di dalam grup.
10. **Matikan Notifikasi Panggilan Nomor Tidak Dikenal**: Lindungi diri Anda dari panggilan spam otomatis melalui menu Privasi.`
  },
  {
    id: 'art-3',
    slug: 'cara-mengatasi-whatsapp-tidak-bisa-dibuka',
    title: 'Cara Cepat Mengatasi WhatsApp Error atau Tidak Bisa Dibuka',
    excerpt: 'Langkah mudah memperbaiki aplikasi WhatsApp yang sering keluar sendiri (force close), lambat, atau gagal memuat media di perangkat Android.',
    coverImage: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&h=450&fit=crop&q=80',
    category: 'Troubleshooting',
    author: {
      name: 'Rian Saputra',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&q=80',
      role: 'Mobile System Engineer'
    },
    publishedAt: '5 Mei 2026',
    readTimeMinutes: 3,
    tags: ['Troubleshoot', 'Error', 'WhatsApp', 'Android'],
    content: `## Gejala Masalah
Aplikasi WhatsApp yang tiba-tiba tertutup sendiri (*force close*), macet pada layar pembuka, atau menampilkan pesan 'Aplikasi tidak merespons' biasanya disebabkan oleh cache yang menumpuk atau versi aplikasi yang kedaluwarsa.

## Solusi Langkah Demi Langkah:
1. **Bersihkan Cache Aplikasi**:
   - Buka *Pengaturan > Aplikasi > WhatsApp > Penyimpanan*.
   - Tekan tombol **Hapus Cache** (*Clear Cache*). Catatan: Jangan tekan 'Hapus Data' jika belum membuat cadangan chat.
2. **Perbarui Versi Aplikasi**:
   - Unduh versi APK terbaru dari AERO APK untuk memastikan semua perbaikan bug sistem telah terpasang.
3. **Periksa Izin Akses (App Permissions)**:
   - Pastikan izin Memori, Kamera, dan Mikrofon telah diberikan dengan benar.
4. **Cek Koneksi Jaringan & Tanggal Sistem**:
   - Waktu dan tanggal perangkat yang tidak sinkron dapat memicu kegagalan otentikasi server enkripsi WhatsApp.`
  },
  {
    id: 'art-4',
    slug: 'perbedaan-whatsapp-vs-whatsapp-business',
    title: 'Perbedaan WhatsApp Messenger vs WhatsApp Business: Mana yang Tepat?',
    excerpt: 'Perbandingan komprehensif fitur, katalog produk, pesan otomatis, hingga label obrolan untuk menentukan versi yang sesuai kebutuhan Anda.',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop&q=80',
    category: 'Bisnis & Produktivitas',
    author: {
      name: 'Fahri Andrian',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80',
      role: 'Android Security Specialist'
    },
    publishedAt: '2 Mei 2026',
    readTimeMinutes: 4,
    tags: ['WhatsApp', 'Business', 'Komparasi', 'Produktivitas'],
    content: `## Ringkasan Perbedaan Utama
Meskipun keduanya menggunakan protokol pengiriman pesan yang serupa, WhatsApp Business dilengkapi dengan modul pengelolaan komunikasi profesional yang dirancang khusus untuk UMKM maupun brand besar.

### Keunggulan WhatsApp Business:
- **Profil Bisnis Terverifikasi**: Menampilkan jam operasional, alamat fisik terhubung Google Maps, website, dan katalog produk.
- **Pesan Otomatis (Auto-Reply)**: Kirim Pesan Sambutan (*Greeting Message*) dan Pesan Di Luar Jam Kerja (*Away Message*).
- **Balas Cepat (Quick Replies)**: Simpan template jawaban yang sering ditanyakan pelanggan dengan shortcut tombol garis miring (/).
- **Label Obrolan**: Kelompokkan kontak dengan label seperti 'Prospek Baru', 'Menunggu Pembayaran', atau 'Pesanan Selesai'.`
  }
];

export const articlesData = ARTICLES_DATA;
