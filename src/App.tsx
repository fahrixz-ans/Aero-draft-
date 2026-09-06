import React, { useState, useEffect, useRef } from 'react';
import { appsData, CATEGORIES } from './data/appsData';
import { AppData, FilterState, SortOption, AppNotification, DownloadHistoryItem, RecentlyViewedItem, UserPreferences } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import AppGrid from './components/AppGrid';
import AppCard from './components/AppCard';
import CategoryCard from './components/CategoryCard';
import AppDetail from './components/AppDetail';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import AdminPanel from './components/AdminPanel';
import RecentlyUpdatedPage from './components/RecentlyUpdatedPage';
import DynamicSEO from './components/DynamicSEO';
import DonateView from './components/DonateView';
import SavedAppsView from './components/SavedAppsView';
import UserProfileView from './components/UserProfileView';
import DownloadHistoryView from './components/DownloadHistoryView';
import NotificationCenterView from './components/NotificationCenterView';
import AppComparisonView from './components/AppComparisonView';
import DiscoverFeedView from './components/DiscoverFeedView';
import ContinueExploringSection from './components/ContinueExploringSection';
import NotificationCenterModal from './components/NotificationCenterModal';

import { 
  Users, Gamepad2, Film, CheckSquare, GraduationCap, 
  Camera, Music, Video, Wrench, MessageSquare, Wallet, 
  ShieldCheck, Info, CheckCircle, Mail, AlertTriangle, Bookmark,
  Flame, TrendingUp, Sparkles, Layers, Compass, Clock, ArrowUpRight,
  Shield, Check, Search, Bell, History
} from 'lucide-react';

import { 
  getTrendingRankings, 
  getNewAndRisingApps, 
  getPersonalizedRecommendations, 
  getSmartCollections,
  TrendingWindow 
} from './services';

import {
  saveBookmark,
  removeBookmark,
  getSavedApps,
  followApp,
  unfollowApp,
  getFollowedApps,
  followCategory,
  unfollowCategory,
  getFollowedCategories,
  recordDownloadHistory,
  getDownloadHistory,
  clearDownloadHistory,
  getRecentlyViewed,
  clearRecentlyViewed,
  getSearchHistory,
  recordSearchHistory,
  clearSearchHistory,
  mergeGuestDataToAccount,
  getUserPreferences,
  saveUserPreferences,
  requestPushPermission
} from './services/userService';

// Firebase Authentication & Firestore imports
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [adminInitialTab, setAdminInitialTab] = useState<string>('dashboard');
  const [selectedAppSlug, setSelectedAppSlug] = useState<string | null>(null);
  const [comparisonInitialSlug, setComparisonInitialSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Dark mode initialized from localStorage (defaults to true for premium bento mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  // User state, bookmarks state, followed apps/categories, download history
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [followedApps, setFollowedApps] = useState<string[]>([]);
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  
  // Intelligence Layer states
  const [trendingWindow, setTrendingWindow] = useState<TrendingWindow>('7d');
  const [activeCollectionId, setActiveCollectionId] = useState<string>('trending-week');

  // Dynamic applications list (Firestore reactive, fallback to static)
  const [apps, setApps] = useState<AppData[]>(appsData);

  useEffect(() => {
    const unsubscribeApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      if (!snapshot.empty) {
        const loadedApps: AppData[] = [];
        snapshot.forEach((doc) => {
          loadedApps.push({ id: doc.id, ...doc.data() } as AppData);
        });
        setApps(loadedApps);
      } else {
        setApps(appsData);
      }
    }, (err) => {
      console.error("Firestore applications subscription error:", err);
      setApps(appsData);
    });
    return () => unsubscribeApps();
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    rating: '',
    version: '',
    recentlyUpdated: false,
    size: '',
    minAndroid: '',
    updatedDateRange: ''
  });

  // Contact form submission state
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // DMCA form state
  const [dmcaForm, setDmcaForm] = useState({ appName: '', url: '', email: '', description: '' });
  const [dmcaSubmitted, setDmcaSubmitted] = useState(false);

  // Synchronize Dark Mode state with HTML classes and Local Storage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load user data or guest data
  const refreshUserData = async (currentUser: User | null) => {
    try {
      const [savedIds, followedAppIds, followedCats, dlHistory, recentViews, sHistory, prefs] = await Promise.all([
        getSavedApps(currentUser),
        getFollowedApps(currentUser),
        getFollowedCategories(currentUser),
        getDownloadHistory(currentUser),
        getRecentlyViewed(currentUser),
        getSearchHistory(),
        getUserPreferences(currentUser)
      ]);
      setBookmarks(savedIds);
      setFollowedApps(followedAppIds);
      setFollowedCategories(followedCats);
      setDownloadHistory(dlHistory);
      setRecentlyViewed(recentViews);
      setSearchHistory(sHistory);
      setUserPreferences(prefs);
    } catch (e) {
      console.error("Error refreshing user data:", e);
    }
  };

  // Synchronize Firebase Auth state and real-time Firestore bookmarks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Record login profile to Firestore securely
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          lastActive: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.error("Firestore save user error:", err);
        });

        // Merge guest bookmarks, followed apps, and download history to account
        await mergeGuestDataToAccount(currentUser);

        // Real-time Firestore subscription for bookmarks
        const bookmarksRef = collection(db, 'users', currentUser.uid, 'bookmarks');
        const unsubBookmarks = onSnapshot(bookmarksRef, (snapshot) => {
          const ids = snapshot.docs.map(d => d.id);
          setBookmarks(ids);
        }, (err) => {
          console.error("Firestore read bookmarks error:", err);
        });

        // Real-time Firestore subscription for followed apps
        const followedRef = collection(db, 'users', currentUser.uid, 'followed_apps');
        const unsubFollowed = onSnapshot(followedRef, (snapshot) => {
          const ids = snapshot.docs.map(d => d.id);
          setFollowedApps(ids);
        }, (err) => {
          console.error("Firestore read followed apps error:", err);
        });

        // Refresh other collections
        refreshUserData(currentUser);

        return () => {
          unsubBookmarks();
          unsubFollowed();
        };
      } else {
        refreshUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for user notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notifsRef = collection(db, 'users', user.uid, 'notifications');
    const unsubNotifs = onSnapshot(notifsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loaded: AppNotification[] = [];
        snapshot.forEach((d) => {
          loaded.push({ id: d.id, ...d.data() } as AppNotification);
        });
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(loaded);
      } else {
        // Welcome notification for first-time login
        const defaultNotif: AppNotification = {
          id: 'welcome-aero',
          userId: user.uid,
          type: 'system',
          title: 'Selamat datang di Aero!',
          message: 'Jelajahi ratusan arsip APK terverifikasi dan simpan aplikasi favoritmu dengan mudah.',
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications([defaultNotif]);
        setDoc(doc(db, 'users', user.uid, 'notifications', 'welcome-aero'), defaultNotif).catch(() => {});
      }
    }, (err) => {
      console.error("Firestore read notifications error:", err);
    });

    return () => unsubNotifs();
  }, [user]);

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true }, { merge: true });
      } catch (e) {
        console.error("Error marking notification read:", e);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) {
      try {
        const promises = notifications.filter(n => !n.read).map(n =>
          setDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true }, { merge: true })
        );
        await Promise.all(promises);
      } catch (e) {
        console.error("Error marking all notifications read:", e);
      }
    }
  };

  // Google Sign-In trigger with Popup
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google Sign-In failed:", err);
    }
  };

  // Sign-Out trigger
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      refreshUserData(null);
    } catch (err) {
      console.error("Sign-Out failed:", err);
    }
  };

  // Toggle app bookmark directly (supports guest & authenticated)
  const handleToggleBookmark = async (appId: string) => {
    const isBookmarked = bookmarks.includes(appId);
    if (isBookmarked) {
      await removeBookmark(user, appId);
      setBookmarks(prev => prev.filter(id => id !== appId));
    } else {
      const app = apps.find(a => a.id === appId);
      if (app) {
        await saveBookmark(user, app);
        setBookmarks(prev => [...prev, appId]);
      }
    }
  };

  // Toggle app follow directly
  const handleToggleFollow = async (appId: string) => {
    const isFollowed = followedApps.includes(appId);
    if (isFollowed) {
      await unfollowApp(user, appId);
      setFollowedApps(prev => prev.filter(id => id !== appId));
    } else {
      const app = apps.find(a => a.id === appId);
      if (app) {
        await followApp(user, app);
        setFollowedApps(prev => [...prev, appId]);
      }
    }
  };

  // Toggle category follow
  const handleToggleFollowCategory = async (categoryName: string) => {
    const isFollowed = followedCategories.includes(categoryName);
    if (isFollowed) {
      await unfollowCategory(user, categoryName);
      setFollowedCategories(prev => prev.filter(c => c !== categoryName));
    } else {
      await followCategory(user, categoryName);
      setFollowedCategories(prev => [...prev, categoryName]);
    }
  };

  // Sync hash routing for shareable URL links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/apps/')) {
        const slug = hash.replace('#/apps/', '');
        const appExists = apps.some(a => a.slug === slug || a.id === slug);
        if (appExists) {
          setSelectedAppSlug(slug);
          setCurrentView('detail');
        } else {
          setCurrentView('home');
        }
      } else if (hash.startsWith('#/compare/')) {
        const slug = hash.replace('#/compare/', '');
        setComparisonInitialSlug(slug);
        setCurrentView('compare');
      } else if (hash === '#/compare') {
        setComparisonInitialSlug(null);
        setCurrentView('compare');
      } else if (hash === '#/discover' || hash === '#/explore') {
        setCurrentView('discover');
      } else if (hash === '#/downloads' || hash === '#/history') {
        setCurrentView('downloads');
      } else if (hash === '#/notifications') {
        setCurrentView('notifications');
      } else if (hash === '#/profile' || hash === '#/account') {
        setCurrentView('profile');
      } else if (hash === '#/all') {
        setCurrentView('all');
      } else if (hash === '#/bookmarks' || hash === '#/saved') {
        setCurrentView('bookmarks');
      } else if (hash === '#/categories') {
        setCurrentView('categories');
      } else if (hash === '#/admin' || hash === '#/admin/dashboard') {
        setAdminInitialTab('dashboard');
        setCurrentView('admin');
      } else if (hash === '#/admin/apps/new') {
        setAdminInitialTab('new-app');
        setCurrentView('admin');
      } else if (hash === '#/admin/moderation' || hash === '#/admin/reports') {
        setAdminInitialTab('reports');
        setCurrentView('admin');
      } else if (hash.startsWith('#/category/')) {
        const cat = hash.replace('#/category/', '');
        const matchedCat = CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
        if (matchedCat) {
          setFilters(prev => ({ ...prev, category: matchedCat }));
          setCurrentView('all');
        } else {
          setCurrentView('home');
        }
      } else {
        const staticViews = ['about', 'contact', 'sitemap', 'donate', 'disclaimer', 'dmca', 'privacy', 'terms'];
        const potentialStatic = hash.replace('#/', '');
        if (staticViews.includes(potentialStatic)) {
          setCurrentView(potentialStatic);
        } else {
          setCurrentView('home');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [apps]);

  // Update navigation and sync window Hash URL
  const navigateTo = (view: string, slug?: string) => {
    setLoading(true);
    setTimeout(() => {
      if (view === 'home') {
        window.location.hash = '';
        setSelectedAppSlug(null);
        setCurrentView('home');
      } else if (view === 'all') {
        window.location.hash = '/all';
        setSelectedAppSlug(null);
        setCurrentView('all');
      } else if (view === 'discover') {
        window.location.hash = '/discover';
        setSelectedAppSlug(null);
        setCurrentView('discover');
      } else if (view === 'compare') {
        if (slug) {
          window.location.hash = `/compare/${slug}`;
          setComparisonInitialSlug(slug);
        } else {
          window.location.hash = '/compare';
          setComparisonInitialSlug(null);
        }
        setSelectedAppSlug(null);
        setCurrentView('compare');
      } else if (view === 'downloads') {
        window.location.hash = '/downloads';
        setSelectedAppSlug(null);
        setCurrentView('downloads');
      } else if (view === 'notifications') {
        window.location.hash = '/notifications';
        setSelectedAppSlug(null);
        setCurrentView('notifications');
      } else if (view === 'profile') {
        window.location.hash = '/profile';
        setSelectedAppSlug(null);
        setCurrentView('profile');
      } else if (view === 'bookmarks') {
        window.location.hash = '/bookmarks';
        setSelectedAppSlug(null);
        setCurrentView('bookmarks');
      } else if (view === 'categories') {
        window.location.hash = '/categories';
        setSelectedAppSlug(null);
        setCurrentView('categories');
      } else if (view === 'detail' && slug) {
        window.location.hash = `/apps/${slug}`;
        setSelectedAppSlug(slug);
        setCurrentView('detail');
      } else {
        window.location.hash = `/${view}`;
        setSelectedAppSlug(null);
        setCurrentView(view);
      }
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  // Active app for details view
  const selectedAppObj = apps.find(a => a.slug === selectedAppSlug || a.id === selectedAppSlug) || null;
  const activeApp = selectedAppObj || apps[0];

  // Handle Direct Download from cards
  const handleDirectDownload = async (e: React.MouseEvent, app: AppData) => {
    e.stopPropagation();
    // Record download history
    await recordDownloadHistory(user, app, 'apk');
    setDownloadHistory(prev => [{
      appId: app.id,
      appName: app.name,
      appSlug: app.slug,
      iconUrl: app.iconUrl,
      version: app.version,
      fileSize: app.size,
      downloadType: 'apk',
      downloadedAt: new Date().toISOString()
    }, ...prev]);

    navigateTo('detail', app.slug);
    setTimeout(() => {
      const el = document.getElementById('download-workflow-module');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    recordSearchHistory(tag);
    navigateTo('all');
  };

  const handleSearchFocus = () => {
    navigateTo('all');
    setTimeout(() => {
      const input = document.getElementById('search-input-field');
      if (input) input.focus();
    }, 300);
  };

  const parseSizeToMB = (sizeStr: string): number => {
    const clean = sizeStr.toLowerCase().trim();
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    if (clean.includes('gb')) return num * 1024;
    return num;
  };

  const parseAndroidVersion = (verStr: string): number => {
    const match = verStr.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Filter and Sort dataset calculations
  const filteredApps = apps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filters.category === '' || app.category === filters.category;
    const matchesRating = filters.rating === '' || app.rating >= parseFloat(filters.rating);
    const matchesVersion = filters.version === '' || app.androidVersion.includes(filters.version) || app.androidVersion >= filters.version;
    const matchesRecent = !filters.recentlyUpdated || new Date(app.updatedAt) >= new Date('2026-08-15');

    let matchesSize = true;
    if (filters.size) {
      const mbSize = parseSizeToMB(app.size);
      if (filters.size === 'small') matchesSize = mbSize <= 25;
      else if (filters.size === 'medium') matchesSize = mbSize > 25 && mbSize <= 75;
      else if (filters.size === 'large') matchesSize = mbSize > 75;
    }

    let matchesMinAndroid = true;
    if (filters.minAndroid) {
      const appMinVer = parseAndroidVersion(app.androidVersion);
      const reqMinVer = parseFloat(filters.minAndroid);
      matchesMinAndroid = appMinVer <= reqMinVer;
    }

    let matchesDate = true;
    if (filters.updatedDateRange) {
      const appDate = new Date(app.updatedAt);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
      if (filters.updatedDateRange === 'today') matchesDate = diffDays <= 1;
      else if (filters.updatedDateRange === 'week') matchesDate = diffDays <= 7;
      else if (filters.updatedDateRange === 'month') matchesDate = diffDays <= 30;
      else if (filters.updatedDateRange === 'year') matchesDate = diffDays <= 365;
    }

    return matchesSearch && matchesCategory && matchesRating && matchesVersion && matchesRecent && matchesSize && matchesMinAndroid && matchesDate;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'latest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'downloads') {
      const numA = parseInt(a.downloads.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.downloads.replace(/[^0-9]/g, '')) || 0;
      return numB - numA;
    }
    if (sortBy === 'trending') {
      const trendList = getTrendingRankings(apps, trendingWindow);
      const scoreA = trendList.find(t => t.app.id === a.id)?.score || 0;
      const scoreB = trendList.find(t => t.app.id === b.id)?.score || 0;
      return scoreB - scoreA;
    }
    return 0;
  });

  // Intelligence calculations
  const homeTrending = getTrendingRankings(apps, trendingWindow).slice(0, 4);
  const homePersonalized = getPersonalizedRecommendations(apps, 4);
  const homeNewAndRising = getNewAndRisingApps(apps, 4);
  const smartCollections = getSmartCollections(apps);
  const activeSmartCollection = smartCollections.find(c => c.id === activeCollectionId) || smartCollections[0];

  const getRelatedApps = (currentApp: AppData) => {
    return apps.filter(a => a.category === currentApp.category && a.id !== currentApp.id);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'dark bg-[#0F1115] text-slate-100' : 'bg-slate-50/30 text-slate-900'}`}>
      
      {/* Dynamic SEO Meta & JSON-LD Manager */}
      <DynamicSEO 
        currentView={currentView} 
        selectedApp={selectedAppObj} 
        categoryFilter={filters.category} 
      />

      {/* Navigation Header bar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSearchFocus={handleSearchFocus}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        unreadNotificationCount={notifications.filter(n => !n.read).length}
        onOpenNotifications={() => setShowNotificationModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full pb-16">
        
        {/* Loading overlay for routing feel */}
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <LoadingSkeleton type={currentView === 'detail' ? 'detail' : 'grid'} count={8} />
          </div>
        ) : (
          <>
            {/* View mapping */}
            {currentView === 'home' && (
              <div className="space-y-16 animate-fade-in">
                {/* Brand Hero */}
                <Hero
                  searchQuery={searchQuery}
                  onSearchChange={(q) => setSearchQuery(q)}
                  onSearchSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) recordSearchHistory(searchQuery.trim());
                    navigateTo('all');
                  }}
                  onTagClick={handleTagClick}
                  onExploreClick={() => navigateTo('discover')}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                  
                  {/* Continue Exploring Section (Tahap 8) */}
                  <ContinueExploringSection
                    allApps={apps}
                    recentlyViewed={recentlyViewed}
                    savedAppIds={bookmarks}
                    recentSearches={searchHistory}
                    onSelectApp={(slug) => navigateTo('detail', slug)}
                    onSelectSearch={(query) => {
                      setSearchQuery(query);
                      navigateTo('all');
                    }}
                    onClearHistory={async () => {
                      await clearRecentlyViewed(user);
                      setRecentlyViewed([]);
                    }}
                  />

                  {/* Trending Intelligence section */}
                  <section className="space-y-6" id="home-trending-intelligence">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                            <Flame className="h-5 w-5 fill-orange-500" />
                          </div>
                          <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                            Sedang Tren
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Peringkat dinamis dihitung otomatis menggunakan formula time-decay interaksi pengguna nyata.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                          {(['24h', '7d', '30d'] as TrendingWindow[]).map((w) => (
                            <button
                              key={w}
                              onClick={() => setTrendingWindow(w)}
                              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                trendingWindow === w
                                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {w === '24h' ? '24 Jam' : w === '7d' ? '7 Hari' : '30 Hari'}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setSortBy('trending');
                            navigateTo('all');
                          }}
                          className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer ml-1"
                        >
                          Lihat Semua Tren
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {homeTrending.map((item) => (
                        <div key={item.app.id} className="relative group flex flex-col space-y-1.5">
                          <AppCard
                            app={item.app}
                            onSelect={(s) => navigateTo('detail', s)}
                            onDownload={handleDirectDownload}
                          />
                          <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] font-bold">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono ${
                              item.movementLabel.startsWith('↑')
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : item.movementLabel === 'NEW'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                            }`}>
                              #{item.rank} {item.movementLabel}
                            </span>
                            {item.reasons[0] && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.reasons[0]}>
                                {item.reasons[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Personalized Recommendations Section */}
                  <section className="space-y-6" id="home-personalized-recommendations">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                            Direkomendasikan Untuk Anda
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                          <span>
                            {homePersonalized.isPersonalized
                              ? 'Rekomendasi terpersonalisasi berdasarkan interaksi, unduhan, dan aplikasi tersimpan Anda.'
                              : 'Rekomendasi kurasi populer dan tren untuk memulai eksplorasi aplikasi Android Anda.'}
                          </span>
                          {homePersonalized.topInterestCategory && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md font-bold text-[10px]">
                              Minat: {homePersonalized.topInterestCategory}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {homePersonalized.items.slice(0, 4).map((rec) => (
                        <div key={rec.app.id} className="flex flex-col space-y-1.5">
                          <AppCard
                            app={rec.app}
                            onSelect={(s) => navigateTo('detail', s)}
                            onDownload={handleDirectDownload}
                          />
                          <div className="px-2">
                            <span className="inline-block text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md truncate max-w-full">
                              {rec.reason}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* New & Rising Apps Section */}
                  <section className="space-y-6" id="home-new-and-rising">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                            Aplikasi Naik Daun
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Aplikasi rilisan segar dengan laju pertumbuhan interaksi dan unduhan tercepat.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {homeNewAndRising.map((nr) => (
                        <div key={nr.app.id} className="flex flex-col space-y-1.5">
                          <AppCard
                            app={nr.app}
                            onSelect={(s) => navigateTo('detail', s)}
                            onDownload={handleDirectDownload}
                          />
                          <div className="flex items-center justify-between px-2 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                            <span className="bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                              Laju: +{Math.round(nr.growthScore)} pts
                            </span>
                            <span className="text-slate-400">
                              {nr.newnessDays <= 7 ? 'Rilis Baru Minggu Ini' : `${nr.newnessDays} hari lalu`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Smart Collections Section */}
                  <section className="space-y-6" id="home-smart-collections">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                          <Layers className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                          Koleksi Cerdas
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                        Daftar kurasi otomatis yang dikelompokkan berdasarkan data metrik dan karakteristik aplikasi.
                      </p>
                    </div>

                    {/* Collection Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {smartCollections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => setActiveCollectionId(col.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            activeCollectionId === col.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md font-extrabold'
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                          }`}
                        >
                          {col.title}
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-md ${
                            activeCollectionId === col.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                          }`}>
                            {col.badge}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Collection Apps Grid */}
                    {activeSmartCollection && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {activeSmartCollection.apps.slice(0, 4).map((app) => (
                          <AppCard
                            key={app.id}
                            app={app}
                            onSelect={(s) => navigateTo('detail', s)}
                            onDownload={handleDirectDownload}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Featured apps section */}
                  <section className="space-y-6" id="home-featured-apps">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                          Aplikasi Pilihan Redaksi
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Aplikasi premium yang direkomendasikan karena stabilitas dan kegunaannya.
                        </p>
                      </div>
                      <button
                        onClick={() => navigateTo('all')}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Lihat Semua
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {apps.filter(a => a.featured).slice(0, 4).map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(s) => navigateTo('detail', s)}
                          onDownload={handleDirectDownload}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Popular apps section */}
                  <section className="space-y-6" id="home-popular-apps">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                          Aplikasi Terpopuler
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Paling banyak dicari dan diunduh oleh jutaan pengguna minggu ini.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSortBy('popular');
                          navigateTo('all');
                        }}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Tampilkan Peringkat
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {apps.filter(a => a.popular).slice(0, 8).map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(s) => navigateTo('detail', s)}
                          onDownload={handleDirectDownload}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Popular Categories */}
                  <section className="space-y-6" id="home-categories">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                        Jelajahi Berdasarkan Kategori
                      </h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                        Pilih jenis kategori untuk mengerucutkan pencarian utilitas penunjang harian Anda.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {CATEGORIES.map((cat) => {
                        const count = apps.filter(a => a.category === cat).length;
                        return (
                          <CategoryCard
                            key={cat}
                            category={cat}
                            appCount={count}
                            isSelected={filters.category === cat}
                            onSelect={(c) => {
                              setFilters(prev => ({ ...prev, category: c }));
                              navigateTo('all');
                            }}
                          />
                        );
                      })}
                    </div>
                  </section>

                  {/* Newsletter subscription module */}
                  <Newsletter />
                </div>
              </div>
            )}

            {/* Stage 8: Discover Feed View */}
            {currentView === 'discover' && (
              <DiscoverFeedView
                allApps={apps}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onDownloadApp={handleDirectDownload}
                onNavigate={navigateTo}
              />
            )}

            {/* Stage 8: App Comparison Tool */}
            {currentView === 'compare' && (
              <AppComparisonView
                allApps={apps}
                initialAppSlug={comparisonInitialSlug || undefined}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onDownloadApp={handleDirectDownload}
                onBack={() => navigateTo('home')}
              />
            )}

            {/* Stage 8: Download History View */}
            {currentView === 'downloads' && (
              <DownloadHistoryView
                downloadHistory={downloadHistory}
                allApps={apps}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onDownloadAgain={handleDirectDownload}
                onClearHistory={async () => {
                  await clearDownloadHistory(user);
                  setDownloadHistory([]);
                }}
                onBackHome={() => navigateTo('home')}
              />
            )}

            {/* Stage 8: Notification Center View */}
            {currentView === 'notifications' && (
              <NotificationCenterView
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onBackHome={() => navigateTo('home')}
              />
            )}

            {currentView === 'all' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Jelajahi File APK Android
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Gunakan panel filter lanjutan untuk menemukan rilis aplikasi yang paling sesuai bagi perangkat Anda.
                  </p>
                </div>

                {/* Search Bar filtering module */}
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={(q) => {
                    setSearchQuery(q);
                    if (q.trim()) recordSearchHistory(q.trim());
                  }}
                  filters={filters}
                  onFiltersChange={setFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  totalResults={sortedApps.length}
                  apps={apps}
                />

                {/* Main listings Grid container */}
                <AppGrid
                  apps={sortedApps}
                  onSelect={(s) => navigateTo('detail', s)}
                  onDownload={handleDirectDownload}
                  onResetSearch={() => {
                    setSearchQuery('');
                    setFilters({ category: '', rating: '', version: '', recentlyUpdated: false });
                  }}
                  pageSize={8}
                />
              </div>
            )}

            {currentView === 'categories' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Kategori Aplikasi Android
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Klasifikasi cerdas aplikasi untuk mempermudah pencarian kebutuhan ponsel cerdas Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {CATEGORIES.map((cat) => {
                    const count = apps.filter(a => a.category === cat).length;
                    return (
                      <CategoryCard
                        key={cat}
                        category={cat}
                        appCount={count}
                        isSelected={false}
                        onSelect={(c) => {
                          setFilters(prev => ({ ...prev, category: c }));
                          navigateTo('all');
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {(currentView === 'recently-updated' || currentView === 'updated') && (
              <RecentlyUpdatedPage
                apps={apps}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                onNavigate={navigateTo}
              />
            )}

            {currentView === 'detail' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppDetail
                  app={activeApp}
                  relatedApps={getRelatedApps(activeApp)}
                  allApps={apps}
                  onNavigate={navigateTo}
                  onSelectRelated={(s) => navigateTo('detail', s)}
                  onDownloadRelated={handleDirectDownload}
                  isBookmarked={bookmarks.includes(activeApp.id)}
                  onToggleBookmark={() => handleToggleBookmark(activeApp.id)}
                  isFollowed={followedApps.includes(activeApp.id)}
                  onToggleFollow={() => handleToggleFollow(activeApp.id)}
                  currentUser={user}
                  onSignIn={handleSignIn}
                />
              </div>
            )}

            {currentView === 'bookmarks' && (
              <SavedAppsView
                savedApps={apps.filter(app => bookmarks.includes(app.id))}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                onRemoveBookmark={(appId) => handleToggleBookmark(appId)}
                onBackHome={() => navigateTo('home')}
              />
            )}

            {currentView === 'profile' && (
              <UserProfileView
                user={user}
                allApps={apps}
                savedApps={apps.filter(app => bookmarks.includes(app.id))}
                followedApps={apps.filter(app => followedApps.includes(app.id))}
                followedCategories={followedCategories}
                downloadHistory={downloadHistory}
                notifications={notifications}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                onRemoveBookmark={(appId) => handleToggleBookmark(appId)}
                onToggleFollowApp={(appOrId) => handleToggleFollow(typeof appOrId === 'string' ? appOrId : appOrId.id)}
                onToggleFollowCategory={(cat) => handleToggleFollowCategory(cat)}
                onClearDownloadHistory={async () => {
                  await clearDownloadHistory(user);
                  setDownloadHistory([]);
                }}
                onClearRecentlyViewed={async () => {
                  await clearRecentlyViewed(user);
                  setRecentlyViewed([]);
                }}
                onSignOut={handleSignOut}
                onSignIn={handleSignIn}
                onMarkNotificationRead={handleMarkNotificationRead}
                onBackHome={() => navigateTo('home')}
              />
            )}

            {currentView === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
                {user && (user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com') ? (
                  <AdminPanel onNavigate={navigateTo} user={user} initialTab={adminInitialTab} />
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">Akses Ditolak</h2>
                    <p className="text-xs text-slate-500">Halaman ini hanya dapat diakses oleh operator administrator berwenang.</p>
                  </div>
                )}
              </div>
            )}

            {/* Static Content Views */}
            {currentView === 'about' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Tentang AeroAPK Downloader
                </h1>
                <p className="text-sm sm:text-base text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  AeroAPK lahir dari komitmen kuat untuk menyediakan ekosistem unduhan aplikasi Android yang jujur, transparan, dan berkelas dunia untuk masyarakat Indonesia. 
                </p>
                <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                  Kami menyadari banyak sekali situs APK Downloader yang memaksakan unduhan tersembunyi, tombol unduh palsu yang mengarahkan ke virus/iklan pop-up agresif, serta melakukan modifikasi kode yang membahayakan privasi perangkat pengguna. Di AeroAPK, kami memutus rantai buruk tersebut. 
                </p>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">Jaminan AeroAPK:</h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 mt-2 font-medium">
                    <li>✓ 100% Berkas APK Asli Google Play Store tanpa modifikasi kode berbahaya.</li>
                    <li>✓ Integrasi deteksi malware instan dengan engine Antivirus SHA-256 cloud.</li>
                    <li>✓ Server berkecepatan tinggi tanpa throttling atau batasan limit download bulanan.</li>
                  </ul>
                </div>
              </div>
            )}

            {currentView === 'contact' && (
              <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Hubungi AeroAPK
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Punya saran kemitraan, permohonan penambahan rilis aplikasi APK baru, ataupun keluhan lainnya? Kirimkan pesan Anda melalui form di bawah ini secara instan:
                </p>

                {contactSubmitted ? (
                  <div className="p-6 bg-blue-50/10 dark:bg-blue-950/20 border border-blue-500/20 dark:border-blue-800 rounded-3xl text-center space-y-3 animate-fade-in">
                    <CheckCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Pesan Anda Berhasil Terkirim!</h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400">Terima kasih atas partisipasi Anda menghubungi kami. Tim teknis AeroAPK akan merespon email Anda dalam waktu 1x24 jam kerja.</p>
                    <button
                      onClick={() => {
                        setContactForm({ name: '', email: '', message: '' });
                        setContactSubmitted(false);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Kirim Pesan Baru
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSubmitted(true);
                    }}
                    className="space-y-4 bg-white dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xs"
                  >
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="Masukkan nama Anda..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="nama@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Pesan / Masukan</label>
                      <textarea
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Tuliskan pesan atau keluhan secara lengkap di sini..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      Kirim Pesan Sekarang
                    </button>
                  </form>
                )}
              </div>
            )}

            {currentView === 'donate' && (
              <DonateView onBackHome={() => navigateTo('home')} />
            )}

            {currentView === 'disclaimer' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Sangkalan Hukum (Disclaimer)
                </h1>
                <div className="space-y-4 text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  <p>AeroAPK adalah layanan repositori arsip berkas APK Android independen dan TIDAK berafiliasi, didukung, disponsori, atau disetujui secara resmi oleh Google LLC, Alphabet Inc., atau pengembang aplikasi pihak ketiga mana pun.</p>
                  <p>Android, Google Play, dan logo Google Play adalah merek dagang dari Google LLC. Semua merek dagang, logo, dan nama produk yang ditampilkan dalam situs ini adalah milik dari pemiliknya masing-masing.</p>
                  <p>Semua aplikasi dan permainan di AeroAPK bersumber dari domain publik atau kontribusi pengembang, dan ditujukan hanya untuk penggunaan pribadi dan edukasional.</p>
                </div>
              </div>
            )}

            {currentView === 'privacy' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Kebijakan Privasi (Privacy Policy)
                </h1>
                <div className="space-y-4 text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  <p>Di AeroAPK, privasi pengunjung kami adalah prioritas utama. Dokumen Kebijakan Privasi ini menjelaskan jenis data pribadi apa saja yang dikumpulkan dan dicatat oleh sistem kami serta bagaimana kami menggunakannya.</p>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white pt-2">Data yang Kami Kumpulkan</h3>
                  <p>Kami tidak mengumpulkan informasi pribadi tanpa persetujuan eksplisit Anda. Data login Google Auth hanya digunakan untuk mengidentifikasi akun Anda saat mengunggah ulasan atau menyimpan daftar aplikasi favorit.</p>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white pt-2">Kontrol Privasi Pengguna</h3>
                  <p>Pengguna memiliki hak penuh untuk mengekspor riwayat data atau menghapus seluruh riwayat aktivitas dari tab Pengaturan Privasi di profil akun.</p>
                </div>
              </div>
            )}

            {currentView === 'terms' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Syarat & Ketentuan Layanan (Terms of Service)
                </h1>
                <div className="space-y-4 text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  <p>Dengan mengakses atau menggunakan situs AeroAPK, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini serta semua hukum dan peraturan yang berlaku.</p>
                  <p>Anda dilarang keras menggunakan situs ini untuk mendistribusikan malware, virus, atau perangkat lunak berbahaya lainnya, melakukan rekayasa balik (reverse engineering) yang merugikan pengembang asli, atau melakukan scraping otomatis yang membebani infrastruktur kami.</p>
                </div>
              </div>
            )}

            {currentView === 'dmca' && (
              <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Pemberitahuan DMCA & Hak Cipta
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  AeroAPK mematuhi ketentuan 17 U.S.C. § 512 dan Digital Millennium Copyright Act (DMCA). Adalah kebijakan kami untuk menanggapi setiap pemberitahuan pelanggaran dan mengambil tindakan yang sesuai. Jika materi berhak cipta Anda telah diposting di AeroAPK tanpa izin, hubungi kami melalui formulir ini:
                </p>

                {dmcaSubmitted ? (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-3 animate-fade-in">
                    <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Laporan DMCA Diterima</h3>
                    <p className="text-xs text-slate-400">Pemberitahuan pelanggaran hak cipta Anda telah kami terima dan akan segera ditinjau oleh tim legal AeroAPK dalam 1x24 jam.</p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDmcaSubmitted(true);
                    }}
                    className="space-y-4 bg-white dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xs"
                  >
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Nama Aplikasi yang Dilaporkan</label>
                      <input
                        type="text"
                        required
                        value={dmcaForm.appName}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, appName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="Contoh: WhatsApp Messenger APK"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">URL Halaman Aero</label>
                      <input
                        type="text"
                        required
                        value={dmcaForm.url}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, url: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://aeroapk.com/#/apps/whatsapp-messenger"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Email Pemegang Hak Cipta</label>
                      <input
                        type="email"
                        required
                        value={dmcaForm.email}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="legal@perusahaan.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Uraian Bukti Kepemilikan</label>
                      <textarea
                        required
                        rows={4}
                        value={dmcaForm.description}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Jelaskan bukti hak cipta atau lampirkan nomor pendaftaran merek dagang..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-500/20 transition-all cursor-pointer"
                    >
                      Kirimkan Laporan DMCA
                    </button>
                  </form>
                )}
              </div>
            )}

            {currentView === 'sitemap' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Peta Situs (Sitemap)
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">Halaman Utama</h3>
                    <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400 font-semibold">
                      <li><button onClick={() => navigateTo('home')} className="hover:underline text-left">Beranda</button></li>
                      <li><button onClick={() => navigateTo('discover')} className="hover:underline text-left">Eksplorasi & Feed Penemuan</button></li>
                      <li><button onClick={() => navigateTo('all')} className="hover:underline text-left">Katalog Semua Aplikasi</button></li>
                      <li><button onClick={() => navigateTo('categories')} className="hover:underline text-left">Daftar Kategori Lengkap</button></li>
                      <li><button onClick={() => navigateTo('compare')} className="hover:underline text-left">Alat Bandingkan Spesifikasi</button></li>
                      <li><button onClick={() => navigateTo('downloads')} className="hover:underline text-left">Riwayat Unduhan</button></li>
                      <li><button onClick={() => navigateTo('bookmarks')} className="hover:underline text-left">Aplikasi Tersimpan</button></li>
                      <li><button onClick={() => navigateTo('notifications')} className="hover:underline text-left">Pusat Notifikasi</button></li>
                    </ul>
                  </div>
                  <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">Informasi & Bantuan</h3>
                    <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400 font-semibold">
                      <li><button onClick={() => navigateTo('about')} className="hover:underline text-left">Tentang Aero</button></li>
                      <li><button onClick={() => navigateTo('contact')} className="hover:underline text-left">Hubungi Kami</button></li>
                      <li><button onClick={() => navigateTo('donate')} className="hover:underline text-left">Dukung Proyek Aero</button></li>
                      <li><button onClick={() => navigateTo('dmca')} className="hover:underline text-left">Pemberitahuan DMCA</button></li>
                      <li><button onClick={() => navigateTo('privacy')} className="hover:underline text-left">Kebijakan Privasi</button></li>
                      <li><button onClick={() => navigateTo('terms')} className="hover:underline text-left">Syarat & Ketentuan</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Real-time Notification Center Modal */}
      {showNotificationModal && (
        <NotificationCenterModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onSelectApp={(slug) => {
            setShowNotificationModal(false);
            navigateTo('detail', slug);
          }}
        />
      )}
    </div>
  );
}
