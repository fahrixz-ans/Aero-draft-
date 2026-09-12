import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'id' | 'en';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<AppLanguage, Record<string, string>> = {
  id: {
    // Nav & Menu
    'nav.home': 'Beranda',
    'nav.today': 'Hari Ini',
    'nav.apps': 'Aplikasi',
    'nav.games': 'Game',
    'nav.categories': 'Kategori',
    'nav.charts': 'Bagan',
    'nav.collections': 'Koleksi',
    'nav.search': 'Cari',
    'nav.saved': 'Disimpan',
    'nav.downloads': 'Riwayat Unduhan',
    'nav.library': 'Perpustakaan',
    'nav.blog': 'Blog',
    'nav.donate': 'Donasi',
    'nav.social': 'Media Sosial',
    'nav.social-media': 'Media Sosial',
    'nav.contact': 'Hubungi Kami',
    'nav.customer-service': 'Hubungi Kami',
    'nav.help': 'Pusat Bantuan',
    'nav.help-center': 'Pusat Bantuan',
    'nav.premium': 'Premium',
    'nav.profile': 'Profil',
    'nav.settings': 'Pengaturan',
    'nav.about': 'Tentang Kami',
    'nav.dmca': 'DMCA',
    'nav.terms': 'Syarat & Ketentuan',
    'nav.privacy': 'Kebijakan Privasi',
    'nav.ownerConsole': 'Owner Console',
    'nav.developerConsole': 'Developer Console',

    // Common UI elements
    'common.back': 'Kembali',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.login': 'Masuk',
    'common.register': 'Daftar',
    'common.logout': 'Keluar',
    'common.edit': 'Ubah',
    'common.delete': 'Hapus',
    'common.continue': 'Lanjut',
    'common.loading': 'Memuat...',
    'common.processing': 'Memproses...',
    'common.success': 'Sukses',
    'common.error': 'Terjadi kesalahan',
    'common.notAvailable': 'Tidak tersedia',
    'common.emptyActivity': 'Belum ada aktivitas.',
    'common.seeMore': 'Selengkapnya',
    'common.viewAll': 'Lihat Semua',
    'common.tryAgain': 'Coba Lagi',
    'common.noData': 'Tidak Ada Data',
    'common.somethingWentWrong': 'Terjadi Kesalahan',
    'common.share': 'Bagikan',
    'common.report': 'Laporkan',
    'common.download': 'Unduh',
    'common.close': 'Tutup',
    'common.openMenu': 'Buka menu',
    'common.requiredField': 'Kolom ini wajib diisi.',
    'common.copied': 'Berhasil disalin!',
    'common.all': 'Semua',
    'common.popular': 'Populer',
    'common.forYou': 'Untuk Anda',
    'common.todayHeader': 'Hari Ini',

    // Home View
    'home.title': 'Beranda',
    'home.todayOverview': 'Sorotan Hari Ini',
    'home.popularApps': 'Aplikasi Populer',
    'home.popularGames': 'Game Terpopuler',
    'home.trending': 'Sedang Tren',
    'home.featured': 'Unggulan',
    'home.recentlyUpdated': 'Baru Diperbarui',
    'home.downloadClientTitle': 'Unduh Aplikasi Mod Station',
    'home.downloadClientDesc': 'Nikmati akses Mod Station yang lebih praktis, aman, dan cepat di perangkat Android Anda.',

    // Apps & Games View
    'apps.title': 'Daftar Aplikasi',
    'apps.subtitle': 'Jelajahi aplikasi Android terbaik yang telah dimodifikasi dan diverifikasi keamanannya.',
    'games.title': 'Daftar Game',
    'games.subtitle': 'Mainkan game Android terpopuler dengan fitur premium yang terbuka sepenuhnya.',

    // Categories
    'categories.title': 'Kategori',
    'categories.subtitle': 'Jelajahi aplikasi dan game berdasarkan minat dan kategori yang Anda inginkan.',
    'categories.all': 'Semua Kategori',
    'categories.directory': 'Direktori Lengkap Kategori',
    'categories.desc': 'Temukan aplikasi produktivitas, game aksi, media sosial, dan utilitas Android terverifikasi aman.',

    // Charts
    'charts.title': 'Tangga Lagu & Bagan',
    'charts.subtitle': 'Peringkat aplikasi dan game teratas yang paling banyak diunduh minggu ini.',
    'charts.topApps': 'Bagan Aplikasi Teratas',
    'charts.topGames': 'Bagan Game Teratas',

    // Collections / For You
    'collections.title': 'Koleksi Pilihan',
    'collections.subtitle': 'Paket aplikasi dan game yang dikurasi khusus untuk memenuhi kebutuhan digital Anda.',
    'collections.empty': 'Koleksi belum tersedia.',

    // Search
    'search.placeholder': 'Cari aplikasi, game, atau developer...',
    'search.filters': 'Filter Pencarian',
    'search.results': 'Hasil Pencarian',
    'search.emptyState': 'Tidak ada hasil yang cocok dengan pencarian Anda.',
    'search.sorting': 'Urutkan berdasarkan',
    'search.sortByPopularity': 'Terpopuler',
    'search.sortByRating': 'Rating Tertinggi',
    'search.sortByUpdate': 'Pembaruan Terbaru',
    'search.inputRequired': 'Masukkan kata kunci pencarian terlebih dahulu.',

    // App Detail
    'app.save': 'Simpan',
    'app.saved': 'Disimpan',
    'app.share': 'Bagikan',
    'app.report': 'Laporkan',
    'app.download': 'Unduh',
    'app.screenshots': 'Tangkapan Layar',
    'app.description': 'Deskripsi Lengkap',
    'app.aboutApp': 'Tentang Aplikasi',
    'app.whatsNew': 'Catatan Rilis',
    'app.information': 'Informasi Teknis',
    'app.developer': 'Developer',
    'app.reviews': 'Ulasan',
    'app.seeAllReviews': 'Lihat Semua Ulasan',
    'app.writeReview': 'Tulis Ulasan',
    'app.aboutTitle': 'Tentang Aplikasi Ini',
    'app.releaseNotes': 'Catatan Rilis Pembaruan',
    'app.techInfo': 'Informasi Teknis Aplikasi',
    'app.signingCert': 'Sertifikat Tanda Tangan & Keamanan',
    'app.permissions': 'Perizinan Aplikasi (Permissions)',
    'app.rating': 'Klasifikasi Konten',
    'app.appInfo': 'Aplikasi',
    'app.packageName': 'Nama Paket',
    'app.minOs': 'OS Minimum',
    'app.updatedAt': 'Terakhir Diperbarui',
    'app.size': 'Ukuran Berkas',
    'app.targetSdk': 'Target SDK',
    'app.modFeatures': 'Fitur Modifikasi (Mod)',
    'app.originalOnPlay': 'Dapatkan app resmi',
    'app.downloadApk': 'Unduh APK Sekarang',

    // Reviews Section
    'reviews.ratingSummary': 'Ringkasan Rating',
    'reviews.writeReviewTitle': 'Tulis Ulasan Anda',
    'reviews.sort': 'Urutkan Ulasan',
    'reviews.helpful': 'Membantu',
    'reviews.reportReview': 'Laporkan ulasan',
    'reviews.emptyState': 'Belum ada ulasan untuk aplikasi ini. Jadilah yang pertama memberikan ulasan!',
    'reviews.pagination': 'Halaman',
    'reviews.error': 'Gagal memuat ulasan.',
    'reviews.successMessage': 'Ulasan berhasil dikirim!',
    'reviews.title': 'Ulasan Pengguna',
    'reviews.helpfulCount': 'orang menganggap ulasan ini membantu',
    'reviews.placeholderReview': 'Tulis ulasan Anda di sini secara jujur dan membangun...',
    'reviews.deleteConfirmTitle': 'Hapus ulasan?',
    'reviews.deleteConfirmText': 'Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus ulasan ini?',
    'reviews.ratingRequired': 'Pilih rating terlebih dahulu.',
    'reviews.textRequired': 'Masukkan ulasan terlebih dahulu.',

    // Help Center
    'help.title': 'Pusat Bantuan',
    'help.faq': 'Pertanyaan Umum (FAQ)',
    'help.category': 'Kategori Bantuan',
    'help.button': 'Cari Solusi',
    'help.search': 'Cari artikel bantuan...',
    'help.searchPlaceholder': 'Ada yang bisa kami bantu?',
    'help.report': 'Laporkan Masalah',
    'help.contactSupport': 'Hubungi Layanan Pelanggan',
    'help.aiAssistant': 'Tanya Asisten AI',
    'help.satisfied': 'Puas',
    'help.notSatisfied': 'Tidak Puas',
    'help.askAI': 'Tanya Asisten AI',
    'help.satisfactionSuccess': 'Terima kasih atas umpan balik Anda!',
    'help.aiGreeting': 'Halo! Saya Asisten AI Mod Station. Ada yang bisa saya bantu hari ini?',
    'help.aiResponseHelpful': 'Semoga informasi ini membantu!',

    // Help Articles
    'help.articles.title': 'Artikel Bantuan',
    'help.articles.search': 'Cari artikel bantuan',

    // Customer Service
    'cs.title': 'Hubungi Kami',
    'cs.subtitle': 'Kirim pesan atau pertanyaan Anda langsung kepada tim dukungan teknis kami.',
    'cs.form.name': 'Nama Lengkap',
    'cs.form.email': 'Alamat Email',
    'cs.form.subject': 'Subjek Pesan',
    'cs.form.message': 'Isi Pesan',
    'cs.form.submit': 'Kirim Pesan',
    'cs.success': 'Pesan Anda telah berhasil dikirim! Tim kami akan menghubungi Anda segera.',

    // Donation
    'donation.title': 'Dukung Mod Station',
    'donation.subtitle': 'Mod Station dijalankan sepenuhnya secara mandiri. Dukungan donasi Anda sangat membantu kelangsungan server kami.',
    'donation.bankName': 'Nama Bank',
    'donation.merchantName': 'Nama Merchant',
    'donation.accNumber': 'Nomor Rekening',
    'donation.accOwner': 'Nama Pemilik',
    'donation.qrisTitle': 'Donasi Melalui QRIS',
    'donation.qrisDesc': 'Pindai kode QR di bawah ini menggunakan aplikasi dompet digital Anda (GOPAY, OVO, Dana, LinkAja, atau Mobile Banking).',
    'donation.bankTitle': 'Transfer Bank Manual',
    'donation.bankDesc': 'Anda juga dapat melakukan transfer langsung melalui nomor rekening bank berikut:',

    // Premium
    'premium.title': 'Premium Mod Station',
    'premium.subtitle': 'Supercharge pengalaman mengunduh Anda dengan paket premium tanpa iklan dan kecepatan tanpa batas.',
    'premium.features': 'Fitur Premium',
    'premium.price': 'Harga Paket',
    'premium.upgrade': 'Upgrade ke Premium',
    'premium.adFree': 'Tanpa Iklan Sama Sekali',
    'premium.unlimitedSpeed': 'Kecepatan Unduh Maksimal tanpa Batas',
    'premium.prioritySupport': 'Dukungan Prioritas CS 24/7',
    'premium.exclusiveMods': 'Akses ke Fitur Modifikasi Eksklusif',

    // Settings
    'settings.title': 'Pengaturan',
    'settings.preferences': 'Preferensi',
    'settings.language': 'Bahasa',
    'settings.devicePreferences': 'Preferensi akun dan perangkat',
    'settings.interests': 'Minat',
    'settings.autoplay': 'Putar otomatis video',
    'settings.theme': 'Tema',
    'settings.accountSecurity': 'Akun & Keamanan',
    'settings.accountSecurityTitle': 'Akun dan keamanan',
    
    // Sub-settings
    'settings.autoplay.always': 'Selalu',
    'settings.autoplay.wifiOnly': 'Wi-Fi saja',
    'settings.autoplay.never': 'Jangan pernah',

    'settings.theme.light': 'Terang',
    'settings.theme.dark': 'Gelap',
    'settings.theme.system': 'Mengikuti Sistem',

    'settings.interests.title': 'Pilih minat Anda',
    'settings.interests.subtitle': 'Mengatur kategori aplikasi dan game yang ingin lebih sering direkomendasikan.',
    'settings.interests.appsTitle': 'Aplikasi',
    'settings.interests.gamesTitle': 'Game',

    'settings.device.title': 'Preferensi Akun dan Perangkat',
    'settings.device.deviceInfo': 'Perangkat Anda',
    'settings.device.deviceName': 'Nama Perangkat',
    'settings.device.os': 'Sistem Operasi',
    'settings.device.version': 'Versi Browser & OS',
    'settings.device.downloadPref': 'Preferensi Unduhan',
    'settings.device.displayPref': 'Preferensi Tampilan',

    // Password & Security
    'security.changePassword': 'Ganti Kata Sandi',
    'security.currentPassword': 'Kata Sandi Saat Ini',
    'security.newPassword': 'Kata Sandi Baru',
    'security.confirmPassword': 'Konfirmasi Kata Sandi Baru',
    'security.passwordChangedSuccess': 'Kata sandi Anda telah diganti.',
    'security.backHome': 'Kembali ke Beranda',
    'security.sessions': 'Sesi & Perangkat',
    'security.currentSession': 'Sesi Saat Ini (Aktif)',
    'security.googleLogin': 'Login dengan Google',
    'security.connected': 'Terhubung',
    'security.notConnected': 'Belum Terhubung',
    'security.logoutConfirmTitle': 'Keluar dari akun?',
    'security.logoutConfirmText': 'Anda harus masuk kembali untuk mengakses fitur akun dan bookmark Anda.',

    // Profile
    'profile.title': 'Profil',
    'profile.guestTitle': 'Masuk ke Mod Station',
    'profile.guestSubtitle': 'Simpan aplikasi, kelola akun, dan dapatkan pengalaman yang lebih personal.',
    'profile.editProfile': 'Edit Profil',
    'profile.changePhoto': 'Ubah Foto',
    'profile.name': 'Nama',
    'profile.email': 'Email',
    'profile.emailNote': 'Email tidak dapat diubah tanpa verifikasi.',
    'profile.username': 'Username',
    'profile.saveChanges': 'Simpan Perubahan',
    'profile.developerBadge': 'Developer',
    'profile.developerVerified': 'Developer Terverifikasi',
    'profile.adminBadge': 'Admin',
    'profile.statsSaved': 'Tersimpan',
    'profile.statsDownloads': 'Unduhan',
    'profile.statsReviews': 'Ulasan',
    'profile.statsReports': 'Laporan',
    'profile.activity': 'Aktivitas',
    'profile.savedApps': 'Aplikasi tersimpan',
    'profile.downloadHistory': 'Riwayat unduhan',
    'profile.reviewHistory': 'Riwayat ulasan',
    'profile.reportHistory': 'Riwayat laporan',

    // Legal
    'about.title': 'Tentang Kami',
    'about.desc': 'Aero Mod Station adalah platform katalog tepercaya untuk mengunduh aplikasi dan game Android modifikasi paling populer dengan aman dan diverifikasi penuh bebas malware.',
    'dmca.title': 'Pemberitahuan DMCA',
    'terms.title': 'Syarat & Ketentuan',
    'privacy.title': 'Kebijakan Privasi',

    // Authentication
    'auth.title': 'Masuk ke Akun Anda',
    'auth.login': 'Masuk',
    'auth.register': 'Daftar Akun Baru',
    'auth.email': 'Alamat Email',
    'auth.password': 'Kata Sandi',
    'auth.username': 'Nama Pengguna',
    'auth.fullName': 'Nama Lengkap',
    'auth.forgotPassword': 'Lupa Kata Sandi?',
    'auth.noAccount': 'Belum punya akun?',
    'auth.haveAccount': 'Sudah punya akun?',
    'auth.registerSuccess': 'Pendaftaran berhasil! Silakan masuk.',
    'auth.validationRequired': 'Bidang ini wajib diisi.',

    // Notifications
    'notifications.title': 'Pusat Notifikasi',
    'notifications.empty': 'Tidak ada notifikasi baru',
    'notifications.markAllRead': 'Tandai semua dibaca',

    // Developer Public Profile
    'developer.title': 'Profil Pengunjung',
    'developer.verified': 'Developer Terverifikasi',
    'developer.verifiedBadge': 'Pengembang Terverifikasi',
    'developer.publicProfile': 'Profil Publik',
    'developer.website': 'Situs Web',
    'developer.totalApps': 'Total Aplikasi',
    'developer.totalDownloads': 'Total Unduhan',
    'developer.avgRating': 'Rata-Rata Rating',
    'developer.officialCatalog': 'Katalog Aplikasi Resmi',
    'developer.catalogDesc': 'Daftar file rilis APK Android yang diterbitkan langsung oleh',
    'developer.noAppsFilter': 'Tidak ada aplikasi pengembang yang sesuai filter.',
    'developer.noAppsFilterDesc': 'Silakan pilih kategori lain atau reset filter untuk menampilkan kembali semua aplikasi.',
    'developer.resetFilter': 'Reset Filter',
    'developer.back': 'Kembali ke Developer',
    'developer.readLess': 'Lihat Sedikit',
    'developer.readMore': 'Lihat Selengkapnya',
    'developer.verifiedShield': 'Mod Station Shield Terverifikasi',
    'developer.apkSize': 'Ukuran APK',
    'developer.update': 'Pembaruan',
    'developer.downloadApk': 'Unduh APK',
    'developer.appsBy': 'Aplikasi oleh pengembang ini',
    'developer.noApps': 'Belum ada aplikasi yang diunggah oleh developer ini.',

    // States & Toasts
    'states.loading': 'Memuat...',
    'states.noAppsYet': 'Belum ada aplikasi',
    'states.noReviewsYet': 'Belum ada ulasan',
    'states.noResults': 'Tidak ada hasil',
    'states.noReportsYet': 'Belum ada laporan',
    'states.savedSuccessfully': 'Berhasil disimpan',
    'states.reviewSubmittedSuccessfully': 'Ulasan berhasil dikirim',
    'states.updatedSuccessfully': 'Berhasil diubah',
    'states.deletedSuccessfully': 'Berhasil dihapus'
  },
  en: {
    // Nav & Menu
    'nav.home': 'Home',
    'nav.today': 'Today',
    'nav.apps': 'Apps',
    'nav.games': 'Games',
    'nav.categories': 'Categories',
    'nav.charts': 'Charts',
    'nav.collections': 'Collections',
    'nav.search': 'Search',
    'nav.saved': 'Saved',
    'nav.downloads': 'Downloads',
    'nav.library': 'Library',
    'nav.blog': 'Blog',
    'nav.donate': 'Donate',
    'nav.social': 'Social Media',
    'nav.social-media': 'Social Media',
    'nav.contact': 'Contact Us',
    'nav.customer-service': 'Contact Us',
    'nav.help': 'Help Center',
    'nav.help-center': 'Help Center',
    'nav.premium': 'Premium',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.about': 'About Us',
    'nav.dmca': 'DMCA',
    'nav.terms': 'Terms & Conditions',
    'nav.privacy': 'Privacy Policy',
    'nav.ownerConsole': 'Owner Console',
    'nav.developerConsole': 'Developer Console',

    // Common UI elements
    'common.back': 'Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.login': 'Sign In',
    'common.register': 'Sign Up',
    'common.logout': 'Sign Out',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.continue': 'Continue',
    'common.loading': 'Loading...',
    'common.processing': 'Processing...',
    'common.success': 'Success',
    'common.error': 'Something went wrong',
    'common.notAvailable': 'Not available',
    'common.emptyActivity': 'No activity yet.',
    'common.seeMore': 'See More',
    'common.viewAll': 'View All',
    'common.tryAgain': 'Try Again',
    'common.noData': 'No Data',
    'common.somethingWentWrong': 'Something Went Wrong',
    'common.share': 'Share',
    'common.report': 'Report',
    'common.download': 'Download',
    'common.close': 'Close',
    'common.openMenu': 'Open menu',
    'common.requiredField': 'This field is required.',
    'common.copied': 'Copied successfully!',
    'common.all': 'All',
    'common.popular': 'Popular',
    'common.forYou': 'For You',
    'common.todayHeader': 'Today',

    // Home View
    'home.title': 'Home',
    'home.todayOverview': 'Today\'s Highlight',
    'home.popularApps': 'Popular Apps',
    'home.popularGames': 'Popular Games',
    'home.trending': 'Trending Now',
    'home.featured': 'Featured',
    'home.recentlyUpdated': 'Recently Updated',
    'home.downloadClientTitle': 'Download Mod Station App',
    'home.downloadClientDesc': 'Enjoy faster, safer, and more convenient access to Mod Station on your Android device.',

    // Apps & Games View
    'apps.title': 'Application Directory',
    'apps.subtitle': 'Explore the best Android apps, fully modified and verified for security.',
    'games.title': 'Game Catalog',
    'games.subtitle': 'Play the most popular Android games with premium features fully unlocked.',

    // Categories
    'categories.title': 'Categories',
    'categories.subtitle': 'Browse apps and games by your favorite interests and categories.',
    'categories.all': 'All Categories',
    'categories.directory': 'Complete Category Directory',
    'categories.desc': 'Find productivity apps, action games, social media, and secure Android utility tools.',

    // Charts
    'charts.title': 'Top Charts',
    'charts.subtitle': 'Rankings of the top-rated and most downloaded apps and games this week.',
    'charts.topApps': 'Top Apps Chart',
    'charts.topGames': 'Top Games Chart',

    // Collections / For You
    'collections.title': 'Featured Collections',
    'collections.subtitle': 'Curated bundles of apps and games crafted specifically for your digital needs.',
    'collections.empty': 'No collections available.',

    // Search
    'search.placeholder': 'Search apps, games, or developers...',
    'search.filters': 'Search Filters',
    'search.results': 'Search Results',
    'search.emptyState': 'No results matching your search criteria.',
    'search.sorting': 'Sort by',
    'search.sortByPopularity': 'Most Popular',
    'search.sortByRating': 'Highest Rating',
    'search.sortByUpdate': 'Last Updated',
    'search.inputRequired': 'Please enter a search query first.',

    // App Detail
    'app.save': 'Save',
    'app.saved': 'Saved',
    'app.share': 'Share',
    'app.report': 'Report',
    'app.download': 'Download',
    'app.screenshots': 'Screenshots',
    'app.description': 'Description',
    'app.aboutApp': 'About App',
    'app.whatsNew': 'What\'s New',
    'app.information': 'Information',
    'app.developer': 'Developer',
    'app.reviews': 'Reviews',
    'app.seeAllReviews': 'See All Reviews',
    'app.writeReview': 'Write a Review',
    'app.aboutTitle': 'About This App',
    'app.releaseNotes': 'Release Notes & Updates',
    'app.techInfo': 'Technical Specifications',
    'app.signingCert': 'Signing Certificate & Security',
    'app.permissions': 'App Permissions',
    'app.rating': 'Content Rating',
    'app.appInfo': 'Application',
    'app.packageName': 'Package Name',
    'app.minOs': 'Minimum OS',
    'app.updatedAt': 'Last Updated',
    'app.size': 'File Size',
    'app.targetSdk': 'Target SDK',
    'app.modFeatures': 'Mod Features',
    'app.originalOnPlay': 'Get official app',
    'app.downloadApk': 'Download APK Now',

    // Reviews Section
    'reviews.ratingSummary': 'Rating Summary',
    'reviews.writeReviewTitle': 'Write Your Review',
    'reviews.sort': 'Sort Reviews',
    'reviews.helpful': 'Helpful',
    'reviews.reportReview': 'Report review',
    'reviews.emptyState': 'No reviews yet for this application. Be the first to write a review!',
    'reviews.pagination': 'Page',
    'reviews.error': 'Failed to load reviews.',
    'reviews.successMessage': 'Review submitted successfully!',
    'reviews.title': 'User Reviews',
    'reviews.helpfulCount': 'people found this review helpful',
    'reviews.placeholderReview': 'Write your honest and constructive review here...',
    'reviews.deleteConfirmTitle': 'Delete review?',
    'reviews.deleteConfirmText': 'This action cannot be undone. Are you sure you want to delete this review?',
    'reviews.ratingRequired': 'Please select a rating.',
    'reviews.textRequired': 'Please enter a review first.',

    // Help Center
    'help.title': 'Help Center',
    'help.faq': 'Frequently Asked Questions (FAQ)',
    'help.category': 'Help Category',
    'help.button': 'Find Solutions',
    'help.search': 'Search help articles...',
    'help.searchPlaceholder': 'How can we help you?',
    'help.report': 'Report an Issue',
    'help.contactSupport': 'Contact Customer Service',
    'help.aiAssistant': 'Ask AI Assistant',
    'help.satisfied': 'Satisfied',
    'help.notSatisfied': 'Not Satisfied',
    'help.askAI': 'Ask AI Assistant',
    'help.satisfactionSuccess': 'Thank you for your feedback!',
    'help.aiGreeting': 'Hello! I am Mod Station AI Assistant. How can I help you today?',
    'help.aiResponseHelpful': 'I hope this information helps!',

    // Help Articles
    'help.articles.title': 'Help Articles',
    'help.articles.search': 'Search help articles',

    // Customer Service
    'cs.title': 'Contact Us',
    'cs.subtitle': 'Send your message or questions directly to our technical support team.',
    'cs.form.name': 'Full Name',
    'cs.form.email': 'Email Address',
    'cs.form.subject': 'Subject',
    'cs.form.message': 'Message',
    'cs.form.submit': 'Send Message',
    'cs.success': 'Your message has been sent successfully! Our team will contact you shortly.',

    // Donation
    'donation.title': 'Support Mod Station',
    'donation.subtitle': 'Mod Station is run entirely independently. Your donation support greatly helps keep our servers running.',
    'donation.bankName': 'Bank Name',
    'donation.merchantName': 'Merchant Name',
    'donation.accNumber': 'Account Number',
    'donation.accOwner': 'Account Owner',
    'donation.qrisTitle': 'Donate via QRIS',
    'donation.qrisDesc': 'Scan the QR code below using your digital wallet app (GOPAY, OVO, Dana, LinkAja, or Mobile Banking).',
    'donation.bankTitle': 'Manual Bank Transfer',
    'donation.bankDesc': 'You can also transfer directly via the following bank account details:',

    // Premium
    'premium.title': 'Mod Station Premium',
    'premium.subtitle': 'Supercharge your download experience with premium ad-free access and unlimited speeds.',
    'premium.features': 'Premium Features',
    'premium.price': 'Subscription Plans',
    'premium.upgrade': 'Upgrade to Premium',
    'premium.adFree': 'Fully Ad-Free Experience',
    'premium.unlimitedSpeed': 'Maximum Unlimited Download Speed',
    'premium.prioritySupport': '24/7 Priority Support',
    'premium.exclusiveMods': 'Access to Exclusive Modified Features',

    // Settings
    'settings.title': 'Settings',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.devicePreferences': 'Account & device preferences',
    'settings.interests': 'Interests',
    'settings.autoplay': 'Autoplay videos',
    'settings.theme': 'Theme',
    'settings.accountSecurity': 'Account & Security',
    'settings.accountSecurityTitle': 'Account and security',
    
    // Sub-settings
    'settings.autoplay.always': 'Always',
    'settings.autoplay.wifiOnly': 'Wi-Fi Only',
    'settings.autoplay.never': 'Never',

    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System Default',

    'settings.interests.title': 'Select your interests',
    'settings.interests.subtitle': 'Manage app and game categories you would like to be recommended more frequently.',
    'settings.interests.appsTitle': 'Apps',
    'settings.interests.gamesTitle': 'Games',

    'settings.device.title': 'Account & Device Preferences',
    'settings.device.deviceInfo': 'Your Device',
    'settings.device.deviceName': 'Device Name',
    'settings.device.os': 'Operating System',
    'settings.device.version': 'Browser & OS Version',
    'settings.device.downloadPref': 'Download Preferences',
    'settings.device.displayPref': 'Display Preferences',

    // Password & Security
    'security.changePassword': 'Change Password',
    'security.currentPassword': 'Current Password',
    'security.newPassword': 'New Password',
    'security.confirmPassword': 'Confirm New Password',
    'security.passwordChangedSuccess': 'Your password has been changed.',
    'security.backHome': 'Back to Home',
    'security.sessions': 'Sessions & Devices',
    'security.currentSession': 'Current Session (Active)',
    'security.googleLogin': 'Sign in with Google',
    'security.connected': 'Connected',
    'security.notConnected': 'Not Connected',
    'security.logoutConfirmTitle': 'Sign out of account?',
    'security.logoutConfirmText': 'You will need to sign in again to access your account features and bookmarks.',

    // Profile
    'profile.title': 'Profile',
    'profile.guestTitle': 'Sign in to Mod Station',
    'profile.guestSubtitle': 'Save apps, manage your account, and enjoy a more personalized experience.',
    'profile.editProfile': 'Edit Profile',
    'profile.changePhoto': 'Change Photo',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.emailNote': 'Email cannot be changed without verification.',
    'profile.username': 'Username',
    'profile.saveChanges': 'Save Changes',
    'profile.developerBadge': 'Developer',
    'profile.developerVerified': 'Verified Developer',
    'profile.adminBadge': 'Admin',
    'profile.statsSaved': 'Saved',
    'profile.statsDownloads': 'Downloads',
    'profile.statsReviews': 'Reviews',
    'profile.statsReports': 'Reports',
    'profile.activity': 'Activity',
    'profile.savedApps': 'Saved apps',
    'profile.downloadHistory': 'Download history',
    'profile.reviewHistory': 'Review history',
    'profile.reportHistory': 'Report history',

    // Legal
    'about.title': 'About Us',
    'about.desc': 'Aero Mod Station is a trusted catalog platform for downloading the most popular modified Android apps and games safely and fully verified to be free of malware.',
    'dmca.title': 'DMCA Policy',
    'terms.title': 'Terms & Conditions',
    'privacy.title': 'Privacy Policy',

    // Authentication
    'auth.title': 'Sign In to Your Account',
    'auth.login': 'Sign In',
    'auth.register': 'Register New Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.fullName': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.haveAccount': 'Already have an account?',
    'auth.registerSuccess': 'Registration successful! Please sign in.',
    'auth.validationRequired': 'This field is required.',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.empty': 'No new notifications',
    'notifications.markAllRead': 'Mark all as read',

    // Developer Public Profile
    'developer.title': 'Developer Profile',
    'developer.verified': 'Verified Developer',
    'developer.verifiedBadge': 'Verified Developer',
    'developer.publicProfile': 'Public Profile',
    'developer.website': 'Website',
    'developer.totalApps': 'Total Apps',
    'developer.totalDownloads': 'Total Downloads',
    'developer.avgRating': 'Average Rating',
    'developer.officialCatalog': 'Official App Catalog',
    'developer.catalogDesc': 'Android APK release file list published directly by',
    'developer.noAppsFilter': 'No developer applications matching the filter.',
    'developer.noAppsFilterDesc': 'Please select another category or reset filters to display all apps.',
    'developer.resetFilter': 'Reset Filter',
    'developer.back': 'Back to Developer',
    'developer.readLess': 'Show Less',
    'developer.readMore': 'Show More',
    'developer.verifiedShield': 'Mod Station Shield Verified',
    'developer.apkSize': 'APK Size',
    'developer.update': 'Update',
    'developer.downloadApk': 'Download APK',
    'developer.appsBy': 'Applications by this developer',
    'developer.noApps': 'No applications uploaded by this developer yet.',

    // States & Toasts
    'states.loading': 'Loading...',
    'states.noAppsYet': 'No apps yet',
    'states.noReviewsYet': 'No reviews yet',
    'states.noResults': 'No results',
    'states.noReportsYet': 'No reports yet',
    'states.savedSuccessfully': 'Saved successfully',
    'states.reviewSubmittedSuccessfully': 'Review submitted successfully',
    'states.updatedSuccessfully': 'Updated successfully',
    'states.deletedSuccessfully': 'Deleted successfully'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('modstation_language');
      if (saved === 'en' || saved === 'id') return saved;
    } catch (e) {}
    return 'id';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('modstation_language', lang);
      document.documentElement.lang = lang;
    } catch (e) {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language] || translations.id;
    if (dict[key]) {
      return dict[key];
    }
    // Fallback to id
    if (translations.id[key]) {
      return translations.id[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
