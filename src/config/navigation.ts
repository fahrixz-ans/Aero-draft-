import { 
  Home, 
  LayoutGrid, 
  Gamepad2, 
  Grid, 
  TrendingUp, 
  Sparkles, 
  Heart, 
  Download, 
  BookOpen, 
  User, 
  Settings, 
  Info,
  Search,
  Bookmark,
  History,
  ShieldCheck,
  Code2,
  Scale,
  Bell,
  Layers,
  HeartHandshake,
  Share2,
  Headphones,
  HelpCircle,
  Crown,
  FileText,
  ShieldAlert
} from 'lucide-react';

// Apple App Store inspired navigation items for Mod Station
export interface NavItemConfig {
  id: string;
  label: string;
  view: string;
  category?: string;
  icon: any;
  badge?: string;
  roleRequired?: 'user' | 'developer' | 'admin' | 'owner';
}

// 1. Group 1: Store / Discovery Primary Section
export const STORE_NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Beranda', view: 'home', icon: Home },
  { id: 'today', label: 'Hari Ini', view: 'articles', icon: Sparkles },
  { id: 'apps', label: 'Aplikasi', view: 'apps', icon: LayoutGrid },
  { id: 'games', label: 'Game', view: 'games', icon: Gamepad2 },
  { id: 'blog', label: 'Blog', view: 'blog', icon: BookOpen },
  { id: 'categories', label: 'Kategori', view: 'categories', icon: Grid },
  { id: 'charts', label: 'Bagan', view: 'top-charts', icon: TrendingUp },
  { id: 'collections', label: 'Koleksi', view: 'for-you', icon: Layers },
  { id: 'search', label: 'Cari', view: 'search', icon: Search }
];

// 2. Group 2: Personal / Library Section
export const LIBRARY_NAV_ITEMS: NavItemConfig[] = [
  { id: 'saved', label: 'Disimpan', view: 'bookmarks', icon: Heart },
  { id: 'downloads', label: 'Riwayat Unduhan', view: 'downloads', icon: History },
  { id: 'library', label: 'Perpustakaan', view: 'discover', icon: BookOpen }
];

// 3. Group 3: Support, Community & Services Section
export const SUPPORT_COMMUNITY_NAV_ITEMS: NavItemConfig[] = [
  { id: 'donate', label: 'Donasi', view: 'donate', icon: HeartHandshake },
  { id: 'social-media', label: 'Social Media', view: 'social-media', icon: Share2 },
  { id: 'customer-service', label: 'Hubungi Kami', view: 'customer-service', icon: Headphones },
  { id: 'help-center', label: 'Pusat Bantuan', view: 'help-center', icon: HelpCircle },
  { id: 'premium', label: 'Premium', view: 'subscription', icon: Crown }
];

// 4. Group 4: Account & Settings Section
export const ACCOUNT_SETTINGS_NAV_ITEMS: NavItemConfig[] = [
  { id: 'profile', label: 'Profil', view: 'profile', icon: User },
  { id: 'settings', label: 'Pengaturan', view: 'settings', icon: Settings }
];

// 5. Group 5: Legal Information Section
export const LEGAL_NAV_ITEMS: NavItemConfig[] = [
  { id: 'about', label: 'Tentang Kami', view: 'about', icon: Info },
  { id: 'dmca', label: 'DMCA', view: 'dmca', icon: FileText },
  { id: 'terms', label: 'Syarat dan Ketentuan', view: 'terms', icon: Scale },
  { id: 'privacy', label: 'Kebijakan Privasi', view: 'privacy', icon: ShieldCheck }
];


// 5. Group 5: Consoles (Role-based)
export const CONSOLE_NAV_ITEMS: NavItemConfig[] = [
  { id: 'owner-console', label: 'Owner Console', view: 'admin', icon: ShieldAlert, roleRequired: 'admin' },
  { id: 'developer-console', label: 'Developer Console', view: 'developer-dashboard', icon: Code2, roleRequired: 'developer' }
];

// 6. Secondary Category Navigation Items (Used on catalog filter bars)
export const SECONDARY_NAV_ITEMS: NavItemConfig[] = [
  { id: 'all', label: 'Semua', view: 'all', icon: LayoutGrid },
  { id: 'apps', label: 'Aplikasi', view: 'apps', icon: LayoutGrid },
  { id: 'games', label: 'Game', view: 'games', icon: Gamepad2 },
  { id: 'popular', label: 'Populer', view: 'popular', icon: TrendingUp },
  { id: 'for-you', label: 'Untuk Anda', view: 'for-you', icon: Sparkles }
];

// 7. System / Account Section
export const SYSTEM_NAV_ITEMS: NavItemConfig[] = [
  { id: 'account', label: 'Account', view: 'profile', icon: User },
  { id: 'settings', label: 'Settings', view: 'settings-security', icon: Settings },
  { id: 'about', label: 'About', view: 'about', icon: Info }
];

// Aliases for compatibility
export const PRIMARY_NAV_ITEMS: NavItemConfig[] = STORE_NAV_ITEMS;
export const DRAWER_STORE_ITEMS: NavItemConfig[] = STORE_NAV_ITEMS;
export const DRAWER_USER_ITEMS: NavItemConfig[] = LIBRARY_NAV_ITEMS;
export const DRAWER_ACCOUNT_ITEMS: NavItemConfig[] = SYSTEM_NAV_ITEMS;
export const DRAWER_MAIN_ITEMS: NavItemConfig[] = STORE_NAV_ITEMS;
export const DRAWER_SECONDARY_ITEMS: NavItemConfig[] = LIBRARY_NAV_ITEMS;
export const DRAWER_INFO_ITEMS: NavItemConfig[] = SYSTEM_NAV_ITEMS;
export const DRAWER_LEGAL_ITEMS: NavItemConfig[] = LEGAL_NAV_ITEMS;
