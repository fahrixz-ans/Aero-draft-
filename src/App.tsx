import React, { useState, useEffect, useRef } from 'react';
import { appsData, CATEGORIES } from './data/appsData';
import { 
  AppData, FilterState, SortOption, AppNotification, 
  DownloadHistoryItem, RecentlyViewedItem, UserPreferences,
  UserRole, SubscriptionPlan, EventBannerItem, BannerItem
} from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SecondaryNav from './components/SecondaryNav';
import { useResponsive } from './hooks/useResponsive';
import BannerCarousel from './components/BannerCarousel';
import { fetchAggregatedBanners, buildCatalogBanners } from './services/bannerService';
import AdBanner from './components/AdBanner';
import DownloadInterstitialModal from './components/DownloadInterstitialModal';
import SearchDiscoveryView from './components/SearchDiscoveryView';
import SubscriptionView from './components/SubscriptionView';
import DeveloperDetailView from './components/views/DeveloperDetailView';
import CategoryDetailView from './components/views/CategoryDetailView';
import AllDevelopersView from './components/views/AllDevelopersView';
import AllCategoriesView from './components/views/AllCategoriesView';
import DeveloperRegisterView from './components/DeveloperRegisterView';
import DeveloperDashboard from './components/developer/DeveloperDashboard';
import SearchBar from './components/SearchBar';
import AppGrid from './components/AppGrid';
import AppCard from './components/AppCard';
import CategoryCard from './components/CategoryCard';
import AppDetail from './components/AppDetail';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import AdminPanel from './components/AdminPanel';
import RecentlyUpdatedPage from './components/RecentlyUpdatedPage';
import DynamicSEO from './components/DynamicSEO';
import DonateView from './components/DonateView';
import SavedAppsView from './components/SavedAppsView';
import AdSenseBanner from './components/common/AdSenseBanner';
import UserProfileView from './components/UserProfileView';
import DownloadHistoryView from './components/DownloadHistoryView';
import NotificationCenterView from './components/NotificationCenterView';
import AppComparisonView from './components/AppComparisonView';
import DiscoverFeedView from './components/DiscoverFeedView';
import ContinueExploringSection from './components/ContinueExploringSection';
import NotificationCenterModal from './components/NotificationCenterModal';
import SuggestedAppsRow from './components/views/SuggestedAppsRow';
import PopularView from './components/views/PopularView';
import LatestView from './components/views/LatestView';
import ModAppsView from './components/views/ModAppsView';
import AppsView from './components/views/AppsView';
import GamesView from './components/views/GamesView';
import CategoriesView from './components/views/CategoriesView';
import ForYouView from './components/views/ForYouView';
import QrisDonationView from './components/views/QrisDonationView';
import BankDonationView from './components/views/BankDonationView';
import BlogMainView from './components/blog/BlogMainView';
import BlogCategoryView from './components/blog/BlogCategoryView';
import BlogSearchView from './components/blog/BlogSearchView';
import BlogDetailView from './components/blog/BlogDetailView';
import ArticlesView from './components/views/ArticlesView';
import ArticleDetailView from './components/views/ArticleDetailView';
import EventDetailView from './components/views/EventDetailView';
import AppDownloadView from './components/views/AppDownloadView';
import AppVersionsView from './components/views/AppVersionsView';
import AppReviewsView from './components/views/AppReviewsView';
import WriteReviewView from './components/views/WriteReviewView';
import AppDetailFullView from './components/views/AppDetailFullView';
import AppCommentsView from './components/views/AppCommentsView';
import AppScreenshotsView from './components/views/AppScreenshotsView';
import AuthViews from './components/views/AuthViews';
import SettingsSecurityView from './components/views/SettingsSecurityView';
import ProfileView from './components/views/ProfileView';
import SettingsView from './components/views/SettingsView';
import SettingsLanguageView from './components/settings/SettingsLanguageView';
import SettingsDeviceView from './components/settings/SettingsDeviceView';
import SettingsInterestsView from './components/settings/SettingsInterestsView';
import SettingsAutoplayView from './components/settings/SettingsAutoplayView';
import SettingsThemeView from './components/settings/SettingsThemeView';
import SettingsAccountSecurityView from './components/settings/SettingsAccountSecurityView';
import SettingsChangePasswordView from './components/settings/SettingsChangePasswordView';
import SettingsSessionsView from './components/settings/SettingsSessionsView';
import AboutView from './components/views/AboutView';
import InformationViews from './components/views/InformationViews';

import CustomerServiceView from './components/views/CustomerServiceView';
import SocialMediaView from './components/views/SocialMediaView';
import HelpCenterView from './components/views/HelpCenterView';
import HelpAIAssistantView from './components/views/HelpAIAssistantView';
import HelpArticlesView from './components/views/HelpArticlesView';
import ChangePasswordView from './components/views/ChangePasswordView';
import ErrorViews from './components/views/ErrorViews';
import BackButton from './components/navigation/BackButton';
import { articlesData } from './data/articlesData';

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
  getForYouRecommendations,
  getYouMightLikeRecommendations,
  getNewAndRisingRecommendations,
  getTrendingRecommendations,
  getEditorPicksRecommendations,
  ScoredApp
} from './services/recommendations';
import RecommendationShelf from './components/recommendations/RecommendationShelf';
import { 
  useSmartCollections, 
  SmartCollectionComponent as SmartCollectionShelfView, 
  CollectionViewAll as SmartCollectionViewAllModal,
  type SmartCollection as SmartCollectionData
} from './features/smartCollections';

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

import { AeroUser as User } from './types';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const { isDesktop } = useResponsive(768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('home');
  const [internalHistory, setInternalHistory] = useState<{ view: string; slug?: string }[]>([]);
  const isBackActionRef = useRef<boolean>(false);
  const lastViewRef = useRef<{ view: string; slug?: string }>({ view: 'home' });

  const [adminInitialTab, setAdminInitialTab] = useState<string>('dashboard');
  const [selectedDeveloperSlug, setSelectedDeveloperSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedAppSlug, setSelectedAppSlug] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedBlogCategory, setSelectedBlogCategory] = useState<string>('all');
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot-password' | 'verify'>('login');
  const [comparisonInitialSlug, setComparisonInitialSlug] = useState<string | null>(null);
  const [helpInitialQuestion, setHelpInitialQuestion] = useState<string | undefined>(undefined);
  const [helpArticleSlug, setHelpArticleSlug] = useState<string | undefined>(undefined);
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
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(() => {
    const saved = localStorage.getItem('aero_subscription_plan');
    return (saved as SubscriptionPlan) || 'free';
  });
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [followedApps, setFollowedApps] = useState<string[]>([]);
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);

  // Interstitial modal state for free users (Section 32)
  const [interstitialDownload, setInterstitialDownload] = useState<{
    isOpen: boolean;
    app: AppData | null;
    downloadType: 'apk' | 'official_link';
  }>({
    isOpen: false,
    app: null,
    downloadType: 'apk'
  });

  // Calculate user role dynamically based on account verification
  const isOwnerOrAdmin = Boolean(
    user && (
      user.email === 'fahriandriansptr@gmail.com' ||
      user.email === 'fantrastore.id@gmail.com' || 
      user.email === 'fahriandriansaputra123@gmail.com' || 
      user.email === 'admin@aeroapk.com'
    )
  );
  const userRole: UserRole = isOwnerOrAdmin ? 'owner' : 'user';
  const effectiveSubscriptionPlan: SubscriptionPlan = isOwnerOrAdmin ? 'premium' : subscriptionPlan;
  
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

  // Universal Homepage Banner Carousel Aggregated State (Real Banners, Active Events, Apps & Articles)
  const [homeBanners, setHomeBanners] = useState<BannerItem[]>(() => buildCatalogBanners(appsData));

  useEffect(() => {
    let isMounted = true;
    fetchAggregatedBanners(apps).then((items) => {
      if (isMounted && items && items.length > 0) {
        setHomeBanners(items);
      }
    }).catch((err) => {
      console.warn("Banner aggregation warning:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [apps]);

  // Stage 9.9: Smart Collections & Intelligent App Shelves
  const [viewAllSmartCollection, setViewAllSmartCollection] = useState<SmartCollectionData | null>(null);
  const { 
    collections: homeSmartCollections, 
    loading: smartCollectionsLoading 
  } = useSmartCollections({
    placement: 'HOME',
    allApps: apps,
    userId: user?.uid,
    userInteractions: {
      downloadedAppIds: downloadHistory.map(d => d.appId),
      viewedAppIds: recentlyViewed.map(r => r.appId),
      searchedQueries: searchHistory
    }
  });

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    rating: '',
    version: '',
    recentlyUpdated: false,
    size: '',
    minAndroid: '',
    updatedDateRange: ''
  });

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

  // Synchronize Auth.js session state and real-time Firestore user preferences
  useEffect(() => {
    let unmounted = false;
    async function loadAuthSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data?.user && !unmounted) {
            const activeUser: User = {
              uid: data.user.id || 'usr_default',
              email: data.user.email,
              displayName: data.user.name,
              photoURL: data.user.image,
              role: data.user.role
            };
            setUser(activeUser);
            refreshUserData(activeUser);
            setAuthLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Auth.js session fetch error:', e);
      }

      if (!unmounted) {
        setUser(null);
        refreshUserData(null);
        setAuthLoading(false);
      }
    }

    loadAuthSession();

    // Listen for cross-origin OAuth messages from the popup
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        await loadAuthSession();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      unmounted = true;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Redirect logged-in users away from auth subviews to profile (#/saya/)
  useEffect(() => {
    if (user && ['auth-login', 'auth-registration', 'auth-forgotpassword', 'auth-verification'].includes(currentView)) {
      navigateTo('profile');
    }
  }, [user, currentView]);

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

  // Google Sign-In trigger with Auth.js (Real Popup OAuth)
  const handleSignIn = async () => {
    try {
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/auth/callback-success`);
      const authUrl = `/api/auth/signin/google?callbackUrl=${callbackUrl}`;
      
      const authWindow = window.open(authUrl, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Silakan aktifkan pop-up untuk melakukan login.');
      }
    } catch (err) {
      console.error("Sign-In failed:", err);
    }
  };

  // Sign-Out trigger
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
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
      if (hash.startsWith('#/apps/type/')) {
        const slug = hash.replace('#/apps/type/', '');
        setSelectedAppSlug(slug);
        setCurrentView('detail');
      } else if (hash.startsWith('#/games/type/')) {
        const slug = hash.replace('#/games/type/', '');
        setSelectedAppSlug(slug);
        setCurrentView('detail');
      } else if (hash.startsWith('#/apps/developer/')) {
        const slug = hash.replace('#/apps/developer/', '');
        setSelectedDeveloperSlug(slug);
        setCurrentView('developer-detail');
      } else if (hash.startsWith('#/developer/') && hash !== '#/developer' && hash !== '#/developer/') {
        const slug = hash.replace('#/developer/', '');
        setSelectedDeveloperSlug(slug);
        setCurrentView('developer-detail');
      } else if (hash.startsWith('#/apps/category/')) {
        const slug = hash.replace('#/apps/category/', '');
        setSelectedCategorySlug(slug);
        setCurrentView('category-detail');
      } else if (hash.startsWith('#/category/') && hash !== '#/category' && hash !== '#/category/') {
        const slug = hash.replace('#/category/', '');
        setSelectedCategorySlug(slug);
        setCurrentView('category-detail');
      } else if (hash.startsWith('#/apps/')) {
        const pathPart = hash.replace('#/apps/', '');
        const segments = pathPart.split('/');
        const slug = segments[0];
        const subview = segments[1];

        const appExists = apps.some(a => a.slug === slug || a.id === slug);
        if (appExists) {
          setSelectedAppSlug(slug);
          if (subview === 'download') {
            setCurrentView('app-download');
          } else if (subview === 'versions') {
            setCurrentView('app-versions');
          } else if (subview === 'rating' || subview === 'reviews') {
            setCurrentView('app-rating-all');
          } else if (subview === 'review') {
            setCurrentView('app-write-review');
          } else if (subview === 'comments') {
            setCurrentView('app-comments');
          } else if (subview === 'screenshots') {
            setCurrentView('app-screenshots');
          } else if (subview === 'detailapps' || subview === 'about') {
            setCurrentView('app-detail-full');
          } else {
            setCurrentView('detail');
          }
        } else {
          setCurrentView('home');
        }
      } else if (hash.startsWith('#/events/')) {
        const evId = hash.replace('#/events/', '');
        setSelectedEventId(evId);
        setCurrentView('event-detail');
      } else if (hash.startsWith('#/blog/category/')) {
        const catSlug = hash.replace('#/blog/category/', '');
        setSelectedBlogCategory(catSlug);
        setCurrentView('blog-category');
      } else if (hash.startsWith('#/blog/search')) {
        setCurrentView('blog-search');
      } else if (hash.startsWith('#/blog/')) {
        const blogSlug = hash.replace('#/blog/', '');
        setSelectedBlogSlug(blogSlug);
        setCurrentView('blog-detail');
      } else if (hash === '#/blog' || hash === '#/blog/') {
        setCurrentView('blog');
      } else if (hash.startsWith('#/articles/')) {
        const artSlug = hash.replace('#/articles/', '');
        setSelectedBlogSlug(artSlug);
        setCurrentView('blog-detail');
      } else if (hash === '#/articles') {
        setCurrentView('blog');
      } else if (hash === '#/for-you') {
        setCurrentView('for-you');
      } else if (hash === '#/popular') {
        setCurrentView('popular');
      } else if (hash === '#/latest') {
        setCurrentView('latest');
      } else if (hash === '#/mod') {
        setCurrentView('mod');
      } else if (hash === '#/login' || hash === '#/login/') {
        window.location.hash = '/auth/login';
      } else if (hash === '#/register' || hash === '#/register/') {
        window.location.hash = '/auth/registration/';
      } else if (hash === '#/forgot-password' || hash === '#/forgot-password/') {
        window.location.hash = '/auth/login/forgotpassword/';
      } else if (hash === '#/verify' || hash === '#/verify/') {
        window.location.hash = '/auth/registration/verification/';
      } else if (hash === '#/auth/login' || hash === '#/auth/login/') {
        setCurrentView('auth-login');
      } else if (hash === '#/auth/login/forgotpassword' || hash === '#/auth/login/forgotpassword/') {
        setCurrentView('auth-forgotpassword');
      } else if (hash === '#/auth/registration' || hash === '#/auth/registration/') {
        setCurrentView('auth-registration');
      } else if (hash === '#/auth/registration/verification' || hash === '#/auth/registration/verification/') {
        setCurrentView('auth-verification');
      } else if (hash === '#/settings/security' || hash === '#/security') {
        setCurrentView('settings-security');
      } else if (hash.startsWith('#/compare/')) {
        const slug = hash.replace('#/compare/', '');
        setComparisonInitialSlug(slug);
        setCurrentView('compare');
      } else if (hash === '#/compare') {
        setComparisonInitialSlug(null);
        setCurrentView('compare');
      } else if (hash === '#/discover' || hash === '#/explore') {
        setCurrentView('discover');
      } else if (hash === '#/search' || hash === '#/search/') {
        setSearchQuery('');
        setCurrentView('search');
      } else if (hash === '#/search/type' || hash === '#/search/type/') {
        setCurrentView('search-type');
      } else if (hash.startsWith('#/search/type/')) {
        const afterType = hash.replace('#/search/type/', '');
        if (afterType.endsWith('/expand/Fully') || afterType.endsWith('/expand/fully')) {
          const query = afterType.replace(/\/expand\/Fully/i, '');
          setSearchQuery(decodeURIComponent(query));
          setCurrentView('search-expand-fully');
        } else if (afterType.endsWith('/expand') || afterType.endsWith('/expand/')) {
          const query = afterType.replace(/\/expand\/?/i, '');
          setSearchQuery(decodeURIComponent(query));
          setCurrentView('search-expand');
        } else {
          setSearchQuery(decodeURIComponent(afterType));
          setCurrentView('search-results');
        }
      } else if (hash === '#/subscription' || hash === '#/premium') {
        setCurrentView('subscription');
      } else if (hash === '#/developer' || hash === '#/developer/' || hash === '#/developers' || hash === '#/developers/') {
        setSelectedDeveloperSlug(null);
        setCurrentView('all-developers');
      } else if (hash === '#/developer-register' || hash === '#/developer/register') {
        setCurrentView('developer-register');
      } else if (hash === '#/category' || hash === '#/category/' || hash === '#/categories' || hash === '#/categories/') {
        setSelectedCategorySlug(null);
        setCurrentView('all-categories');
      } else if (hash === '#/developer-dashboard' || hash === '#/developer/dashboard') {
        setCurrentView('developer-dashboard');
      } else if (hash === '#/apps') {
        setCurrentView('apps');
      } else if (hash === '#/games') {
        setCurrentView('games');
      } else if (hash === '#/top-charts' || hash === '#/trending') {
        setCurrentView('top-charts');
      } else if (hash === '#/downloads' || hash === '#/history') {
        setCurrentView('downloads');
      } else if (hash === '#/notifications') {
        setCurrentView('notifications');
      } else if (hash === '#/saya' || hash === '#/saya/' || hash === '#/profile' || hash === '#/profile/' || hash === '#/account' || hash === '#/account/') {
        setCurrentView('profile');
      } else if (hash === '#/all') {
        setCurrentView('all');
      } else if (hash === '#/bookmarks' || hash === '#/saved') {
        setCurrentView('bookmarks');
      } else if (hash === '#/owner' || hash === '#/admin' || hash === '#/admin/dashboard') {
        setAdminInitialTab('dashboard');
        setCurrentView('admin');
      } else if (hash === '#/admin/apps/new') {
        setAdminInitialTab('new-app');
        setCurrentView('admin');
      } else if (hash === '#/admin/moderation' || hash === '#/admin/reports') {
        setAdminInitialTab('reports');
        setCurrentView('admin');
      } else if (hash === '#/donasi/qris' || hash === '#/donate/qris' || hash === '#/donasi-qris' || hash === '#/donate-qris' || hash === '#/qris') {
        setCurrentView('donate-qris');
      } else if (hash === '#/donasi/bank' || hash === '#/donate/bank' || hash === '#/donasi-bank' || hash === '#/donate-bank' || hash === '#/bank') {
        setCurrentView('donate-bank');
      } else if (hash === '#/social-media' || hash === '#/follow' || hash === '#/social') {
        setCurrentView('social-media');
      } else if (hash === '#/change-password' || hash === '#/ganti-kata-sandi') {
        setCurrentView('change-password');
      } else if (hash === '#/help-ai-assistant' || hash === '#/tanya-ai') {
        setCurrentView('help-ai-assistant');
      } else if (hash.startsWith('#/help-articles/') || hash.startsWith('#/artikel-bantuan/')) {
        const slug = hash.replace('#/help-articles/', '').replace('#/artikel-bantuan/', '');
        setHelpArticleSlug(slug);
        setCurrentView('help-articles');
      } else if (hash === '#/help-articles' || hash === '#/artikel-bantuan') {
        setHelpArticleSlug(undefined);
        setCurrentView('help-articles');
      } else if (hash === '#/help-center' || hash === '#/pusat-bantuan' || hash === '#/help' || hash === '#/faq') {
        setCurrentView('help-center');
      } else if (hash === '#/contact' || hash === '#/customer-service' || hash === '#/hubungi-kami') {
        setCurrentView('customer-service');
      } else if (hash === '#/donate' || hash === '#/donasi') {
        setCurrentView('donate');
      } else if (hash === '#/dmca') {
        setCurrentView('dmca');
      } else if (hash === '#/terms' || hash === '#/syarat-dan-ketentuan') {
        setCurrentView('terms');
      } else if (hash === '#/privacy' || hash === '#/kebijakan-privasi') {
        setCurrentView('privacy');
      } else if (hash.startsWith('#/category/') || hash.startsWith('#/categories/')) {
        const cat = hash.startsWith('#/categories/') ? hash.replace('#/categories/', '') : hash.replace('#/category/', '');
        setSelectedCategorySlug(cat);
        setCurrentView('category-detail');
      } else {
        const staticViews = ['about', 'contact', 'customer-service', 'help-center', 'help', 'faq', 'sitemap', 'donate', 'social-media', 'change-password', 'help-ai-assistant', 'help-articles', 'disclaimer', 'dmca', 'privacy', 'terms'];
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

  // Synchronize internal history stack with any view change (programmatic or native hash change)
  useEffect(() => {
    const prev = lastViewRef.current;
    const current = { view: currentView, slug: selectedAppSlug || undefined };

    // If the view actually changed
    if (prev.view !== current.view || prev.slug !== current.slug) {
      const wasExplicitBack = isBackActionRef.current;
      isBackActionRef.current = false; // reset

      setInternalHistory(stack => {
        const isBackAction = wasExplicitBack || (
          stack.length > 0 &&
          stack[stack.length - 1].view === current.view &&
          stack[stack.length - 1].slug === current.slug
        );

        if (isBackAction) {
          if (stack.length > 0) {
            return stack.slice(0, -1);
          }
          return stack;
        } else {
          // Forward navigation
          if (prev.view && (prev.view !== current.view || prev.slug !== current.slug)) {
            const newStack = [...stack, prev];
            if (newStack.length > 50) {
              newStack.shift();
            }
            return newStack;
          }
          return stack;
        }
      });

      // Update ref
      lastViewRef.current = current;
    }
  }, [currentView, selectedAppSlug]);

  // Update navigation and sync window Hash URL
  const navigateTo = (view: string, slug?: string) => {
    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const updateRoute = () => {
      if (view === 'home') {
        window.location.hash = '';
        setSelectedAppSlug(null);
        setFilters(prev => ({ ...prev, category: '' }));
        setCurrentView('home');
      } else if (view === 'apps') {
        window.location.hash = '/apps';
        setSelectedAppSlug(null);
        setFilters(prev => ({ ...prev, category: '' }));
        setCurrentView('apps');
      } else if (view === 'games') {
        window.location.hash = '/games';
        setSelectedAppSlug(null);
        setFilters(prev => ({ ...prev, category: '' }));
        setCurrentView('games');
      } else if (view === 'search') {
        window.location.hash = '/search';
        setSelectedAppSlug(null);
        setCurrentView('search');
      } else if (view === 'search-type') {
        window.location.hash = '/search/type/';
        setSelectedAppSlug(null);
        setCurrentView('search-type');
      } else if (view === 'search-results' && slug) {
        window.location.hash = `/search/type/${encodeURIComponent(slug)}`;
        setSelectedAppSlug(null);
        setCurrentView('search-results');
      } else if (view === 'search-expand' && slug) {
        window.location.hash = `/search/type/${encodeURIComponent(slug)}/expand/`;
        setSelectedAppSlug(null);
        setCurrentView('search-expand');
      } else if (view === 'search-expand-fully' && slug) {
        window.location.hash = `/search/type/${encodeURIComponent(slug)}/expand/Fully`;
        setSelectedAppSlug(null);
        setCurrentView('search-expand-fully');
      } else if (view === 'app-detail-type' && slug) {
        window.location.hash = `/apps/type/${slug}`;
        setSelectedAppSlug(slug);
        setCurrentView('detail');
      } else if (view === 'game-detail-type' && slug) {
        window.location.hash = `/games/type/${slug}`;
        setSelectedAppSlug(slug);
        setCurrentView('detail');
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
      } else if (view === 'profile' || view === 'saya') {
        window.location.hash = '/saya/';
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
      } else if (view === 'app-download' && slug) {
        window.location.hash = `/apps/${slug}/download`;
        setSelectedAppSlug(slug);
        setCurrentView('app-download');
      } else if (view === 'app-versions' && slug) {
        window.location.hash = `/apps/${slug}/versions`;
        setSelectedAppSlug(slug);
        setCurrentView('app-versions');
      } else if (view === 'app-reviews' && slug) {
        window.location.hash = `/apps/${slug}/reviews`;
        setSelectedAppSlug(slug);
        setCurrentView('app-reviews');
      } else if (view === 'app-comments' && slug) {
        window.location.hash = `/apps/${slug}/comments`;
        setSelectedAppSlug(slug);
        setCurrentView('app-comments');
      } else if (view === 'app-screenshots' && slug) {
        window.location.hash = `/apps/${slug}/screenshots`;
        setSelectedAppSlug(slug);
        setCurrentView('app-screenshots');
      } else if ((view === 'detailapps' || view === 'app-about' || view === 'about') && slug) {
        window.location.hash = `/apps/${slug}/about`;
        setSelectedAppSlug(slug);
        setCurrentView('app-detail-full');
      } else if (view === 'donate' || view === 'donasi') {
        window.location.hash = '/donate';
        setSelectedAppSlug(null);
        setCurrentView('donate');
      } else if (view === 'social-media' || view === 'follow') {
        window.location.hash = '/social-media';
        setSelectedAppSlug(null);
        setCurrentView('social-media');
      } else if (view === 'help-center' || view === 'pusat-bantuan') {
        window.location.hash = '/help-center';
        setSelectedAppSlug(null);
        setCurrentView('help-center');
      } else if (view === 'help-ai-assistant' || view === 'tanya-ai') {
        window.location.hash = '/help-ai-assistant';
        setHelpInitialQuestion(slug);
        setCurrentView('help-ai-assistant');
      } else if (view === 'help-articles' || view === 'artikel-bantuan') {
        if (slug) {
          window.location.hash = `/help-articles/${slug}`;
          setHelpArticleSlug(slug);
        } else {
          window.location.hash = '/help-articles';
          setHelpArticleSlug(undefined);
        }
        setCurrentView('help-articles');
      } else if (view === 'change-password' || view === 'ganti-kata-sandi') {
        window.location.hash = '/change-password';
        setSelectedAppSlug(null);
        setCurrentView('change-password');
      } else if (view === 'customer-service' || view === 'contact' || view === 'hubungi-kami') {
        window.location.hash = '/customer-service';
        setSelectedAppSlug(null);
        setCurrentView('customer-service');
      } else if (view === 'subscription' || view === 'premium') {
        window.location.hash = '/subscription';
        setSelectedAppSlug(null);
        setCurrentView('subscription');
      } else if (view === 'dmca') {
        window.location.hash = '/dmca';
        setSelectedAppSlug(null);
        setCurrentView('dmca');
      } else if (view === 'terms') {
        window.location.hash = '/terms';
        setSelectedAppSlug(null);
        setCurrentView('terms');
      } else if (view === 'privacy') {
        window.location.hash = '/privacy';
        setSelectedAppSlug(null);
        setCurrentView('privacy');
      } else if (view === 'admin' || view === 'owner-console') {
        window.location.hash = '/admin';
        setAdminInitialTab('dashboard');
        setCurrentView('admin');
      } else if (view === 'developer-dashboard' || view === 'developer-console') {
        window.location.hash = '/developer-dashboard';
        setCurrentView('developer-dashboard');
      } else if (view === 'donate-qris' || view === 'qris') {
        window.location.hash = '/donasi/qris';
        setSelectedAppSlug(null);
        setCurrentView('donate-qris');
      } else if (view === 'donate-bank' || view === 'bank') {
        window.location.hash = '/donasi/bank';
        setSelectedAppSlug(null);
        setCurrentView('donate-bank');
      } else if (view === 'blog') {
        window.location.hash = '/blog';
        setCurrentView('blog');
      } else if (view === 'blog-category' && slug) {
        window.location.hash = `/blog/category/${slug}`;
        setSelectedBlogCategory(slug);
        setCurrentView('blog-category');
      } else if (view === 'blog-search') {
        window.location.hash = '/blog/search';
        setCurrentView('blog-search');
      } else if (view === 'blog-detail' && slug) {
        window.location.hash = `/blog/${slug}`;
        setSelectedBlogSlug(slug);
        setCurrentView('blog-detail');
      } else if (view === 'articles') {
        window.location.hash = '/blog';
        setCurrentView('blog');
      } else if (view === 'article-detail' && slug) {
        window.location.hash = `/blog/${slug}`;
        setSelectedBlogSlug(slug);
        setCurrentView('blog-detail');
      } else if (view === 'event-detail' && slug) {
        window.location.hash = `/events/${slug}`;
        setSelectedEventId(slug);
        setCurrentView('event-detail');
      } else if (view === 'auth-login' || view === 'login') {
        window.location.hash = '/auth/login';
        setSelectedAppSlug(null);
        setCurrentView('auth-login');
      } else if (view === 'auth-registration' || view === 'register') {
        window.location.hash = '/auth/registration/';
        setSelectedAppSlug(null);
        setCurrentView('auth-registration');
      } else if (view === 'auth-forgotpassword' || view === 'forgot-password') {
        window.location.hash = '/auth/login/forgotpassword/';
        setSelectedAppSlug(null);
        setCurrentView('auth-forgotpassword');
      } else if (view === 'auth-verification' || view === 'verify') {
        window.location.hash = '/auth/registration/verification/';
        setSelectedAppSlug(null);
        setCurrentView('auth-verification');
      } else if (view === 'developer-detail' && slug) {
        window.location.hash = `/apps/developer/${slug}`;
        setSelectedDeveloperSlug(slug);
        setCurrentView('developer-detail');
      } else if (view === 'category-detail' && slug) {
        window.location.hash = `/apps/category/${slug}`;
        setSelectedCategorySlug(slug);
        setCurrentView('category-detail');
      } else if (view === 'all-developers' || view === 'developer' || view === 'developers') {
        window.location.hash = '/developer';
        setSelectedDeveloperSlug(null);
        setCurrentView('all-developers');
      } else if (view === 'all-categories' || view === 'category' || view === 'categories') {
        window.location.hash = '/category';
        setSelectedCategorySlug(null);
        setCurrentView('all-categories');
      } else {
        window.location.hash = `/${view}`;
        if (slug) setSelectedAppSlug(slug);
        setCurrentView(view);
      }
    };

    if (isReduced) {
      updateRoute();
      setLoading(false);
      window.scrollTo({ top: 0 });
    } else {
      setLoading(true);
      setTimeout(() => {
        updateRoute();
        setLoading(false);
        window.scrollTo({ top: 0 });
      }, 100); // Snappy non-blocking skeleton display (100ms)
    }
  };

  // Browser History Back Navigation with Fallback
  const handleBack = (fallbackView: string = 'home', fallbackSlug?: string) => {
    isBackActionRef.current = true;

    if (internalHistory.length > 0) {
      const target = internalHistory[internalHistory.length - 1];
      navigateTo(target.view, target.slug);
    } else {
      navigateTo(fallbackView, fallbackSlug);
    }
  };

  // Active app for details view
  const selectedAppObj = apps.find(a => a.slug === selectedAppSlug || a.id === selectedAppSlug) || null;
  const activeApp = selectedAppObj || apps[0];

  // Handle Final Proceed Download (after interstitial or directly for premium)
  const proceedFinalDownload = async (app: AppData, downloadType: 'apk' | 'official_link' = 'apk') => {
    // Record download history
    await recordDownloadHistory(user, app, downloadType);
    setDownloadHistory(prev => [{
      appId: app.id,
      appName: app.name,
      appSlug: app.slug,
      iconUrl: app.iconUrl,
      version: app.version,
      fileSize: app.size,
      downloadType,
      downloadedAt: new Date().toISOString()
    }, ...prev]);

    navigateTo('detail', app.slug);
    setTimeout(() => {
      const el = document.getElementById('download-workflow-module');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  };

  // Handle Direct Download from cards (checks subscription plan for interstitial ad)
  const handleDirectDownload = async (e: React.MouseEvent, app: AppData) => {
    e.stopPropagation();

    // Section 32: If FREE tier, show interstitial ad first
    if (effectiveSubscriptionPlan === 'free') {
      setInterstitialDownload({
        isOpen: true,
        app,
        downloadType: 'apk'
      });
      return;
    }

    // If PREMIUM or ADMIN/OWNER: instant direct download without ad delay
    await proceedFinalDownload(app, 'apk');
  };

  const handleUpgradePlan = (planId: 'monthly' | 'yearly') => {
    setSubscriptionPlan('premium');
    localStorage.setItem('aero_subscription_plan', 'premium');
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    recordSearchHistory(tag);
    navigateTo('search');
  };

  const handleSearchFocus = () => {
    navigateTo('search');
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

  // Stage 9.3: Real Recommendation Engine Shelves State
  const [forYouRecs, setForYouRecs] = useState<ScoredApp[]>([]);
  const [youMightLikeRecs, setYouMightLikeRecs] = useState<ScoredApp[]>([]);
  const [newAndRisingRecs, setNewAndRisingRecs] = useState<ScoredApp[]>([]);
  const [trendingRecs, setTrendingRecs] = useState<ScoredApp[]>([]);
  const [editorPicksRecs, setEditorPicksRecs] = useState<ScoredApp[]>([]);

  const loadRecommendationShelves = async () => {
    if (!apps || apps.length === 0) return;
    try {
      const [forYou, youMightLike, newRising, trending, editor] = await Promise.all([
        getForYouRecommendations(apps, user?.uid, 8),
        getYouMightLikeRecommendations(apps, user?.uid, 8),
        getNewAndRisingRecommendations(apps, 8),
        getTrendingRecommendations(apps, 8),
        getEditorPicksRecommendations(apps, 8)
      ]);
      setForYouRecs(forYou);
      setYouMightLikeRecs(youMightLike);
      setNewAndRisingRecs(newRising);
      setTrendingRecs(trending);
      setEditorPicksRecs(editor);
    } catch (err) {
      console.error('Failed to load recommendation shelves:', err);
    }
  };

  useEffect(() => {
    loadRecommendationShelves();
  }, [apps, user?.uid]);

  // Intelligence calculations
  const homeTrending = getTrendingRankings(apps, trendingWindow).slice(0, 4);
  const homePersonalized = getPersonalizedRecommendations(apps, 4);
  const homeNewAndRising = getNewAndRisingApps(apps, 4);
  const smartCollections = getSmartCollections(apps);
  const activeSmartCollection = smartCollections.find(c => c.id === activeCollectionId) || smartCollections[0];

  const getRelatedApps = (currentApp: AppData) => {
    return apps.filter(a => a.category === currentApp.category && a.id !== currentApp.id);
  };

  const isNoNavbarView = [
    'detail',
    'app-detail-full',
    'app-download',
    'app-versions',
    'app-rating-all',
    'app-write-review',
    'app-comments',
    'app-screenshots',
    'sitemap',
    'subscription',
    'notifications',
    'about',
    'dmca',
    'donate',
    'donate-qris',
    'qris',
    'donate-bank',
    'bank',
    'privacy',
    'terms',
    'downloads',
    'settings',
    'settings-security',
    'help-center',
    'help',
    'customer-service',
    'faq',
    'contact',
    'disclaimer',
    'auth-login',
    'auth-forgotpassword',
    'auth-registration',
    'auth-verification',
    'search-type',
    'blog',
    'blog-category',
    'blog-search',
    'blog-detail'
  ].includes(currentView);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'dark bg-[#0F1115] text-slate-100' : 'bg-slate-50/30 text-slate-900'}`}>
      
      {/* Dynamic SEO Meta & JSON-LD Manager */}
      <DynamicSEO 
        currentView={currentView} 
        selectedApp={selectedAppObj} 
        categoryFilter={filters.category} 
      />

      {/* Navigation Header bar - Hidden on dedicated internal views */}
      {!isNoNavbarView && (
        <Navbar
          currentView={currentView}
          categoryFilter={filters.category}
          onNavigate={navigateTo}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onSearchFocus={handleSearchFocus}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
          user={user}
          userRole={userRole}
          subscriptionPlan={effectiveSubscriptionPlan}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          unreadNotificationCount={notifications.filter(n => !n.read).length}
          onOpenNotifications={() => setShowNotificationModal(true)}
        />
      )}

      {/* Main Container Layout with Desktop App Store Sidebar */}
      <div className="flex-1 flex flex-row w-full min-w-0">
        {!isNoNavbarView && currentView !== 'admin' && (
          <Sidebar
            currentView={currentView}
            onNavigate={navigateTo}
            userRole={userRole}
            user={user}
            unreadNotificationCount={notifications.filter(n => !n.read).length}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Secondary Category & Tab Navigation (Hanya pada halaman katalog APK yang memang membutuhkan filter kategori) */}
          {currentView === 'all' && (
            <SecondaryNav
              activeTab={currentView}
              onTabChange={(tabId, view, cat) => {
                if (view) {
                  navigateTo(view);
                } else if (cat) {
                  setFilters(prev => ({ ...prev, category: cat }));
                  navigateTo('all');
                } else {
                  navigateTo(tabId);
                }
              }}
            />
          )}

          {/* Main Container */}
          <main className="flex-1 w-full pb-10 md:pb-12">
        
        {/* Loading overlay for routing feel */}
        {loading ? (
          <div className="py-6">
            <LoadingSkeleton type={currentView} count={8} />
          </div>
        ) : (
          <>
            {/* View mapping */}
            {currentView === 'home' && (
              <div className="space-y-8 animate-fade-in">
                {/* Universal Auto-Sliding Dynamic Banner Carousel */}
                <BannerCarousel
                  banners={homeBanners}
                  apps={apps}
                  onNavigate={navigateTo}
                  onDownloadApp={handleDirectDownload}
                  onSelectCategory={(cat) => {
                    setFilters(prev => ({ ...prev, category: cat }));
                    navigateTo('all');
                  }}
                />

                {/* Reference-design Horizontal App Suggestions Row */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <SuggestedAppsRow
                    apps={apps}
                    onSelectApp={(slug) => navigateTo('detail', slug)}
                    onDownloadApp={handleDirectDownload}
                    onViewAll={() => navigateTo('popular')}
                  />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                  
                  {/* Top Ad Banner for Free Users */}
                  <AdBanner 
                    slot="top-banner"
                    subscriptionPlan={effectiveSubscriptionPlan}
                    userRole={userRole}
                    onUpgradeClick={() => navigateTo('subscription')}
                  />

                  {/* Continue Exploring Section (Tahap 8) */}
                  <ContinueExploringSection
                    allApps={apps}
                    recentlyViewed={recentlyViewed}
                    savedAppIds={bookmarks}
                    recentSearches={searchHistory}
                    onSelectApp={(slug) => navigateTo('detail', slug)}
                    onSelectSearch={(query) => {
                      setSearchQuery(query);
                      navigateTo('search');
                    }}
                    onClearHistory={async () => {
                      await clearRecentlyViewed(user);
                      setRecentlyViewed([]);
                    }}
                  />

                  {/* Google AdSense Banner Placeholder */}
                  <AdSenseBanner slotId="homepage-middle-slot" />

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
                            downloadHistory={downloadHistory}
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

                  {/* Stage 9.3: Personalized "Untuk Anda" Recommendation Shelf */}
                  {forYouRecs.length > 0 && (
                    <RecommendationShelf
                      shelfId="forYou"
                      title="Direkomendasikan Untuk Anda"
                      subtitle="Rekomendasi terpersonalisasi berdasarkan interaksi, riwayat pencarian, dan preferensi aplikasi Anda"
                      icon={Sparkles}
                      items={forYouRecs}
                      onSelectApp={(app) => navigateTo('detail', app.slug || app.id)}
                      onDownloadApp={(app) => handleDirectDownload({} as any, app)}
                      downloadHistory={downloadHistory}
                      currentUser={user}
                      showExplanationBadges={true}
                      allowDismiss={true}
                      onRefresh={loadRecommendationShelves}
                    />
                  )}

                  {/* Stage 9.3: Discovery "Mungkin Anda Suka" Recommendation Shelf */}
                  {youMightLikeRecs.length > 0 && (
                    <RecommendationShelf
                      shelfId="youMightLike"
                      title="Mungkin Anda Suka"
                      subtitle="Temukan utilitas dan aplikasi baru dengan ragam kategori yang relevan"
                      icon={Compass}
                      items={youMightLikeRecs}
                      onSelectApp={(app) => navigateTo('detail', app.slug || app.id)}
                      onDownloadApp={(app) => handleDirectDownload({} as any, app)}
                      downloadHistory={downloadHistory}
                      currentUser={user}
                      showExplanationBadges={true}
                      allowDismiss={true}
                      onRefresh={loadRecommendationShelves}
                    />
                  )}

                  {/* Stage 9.3: New & Rising Apps Section */}
                  {newAndRisingRecs.length > 0 ? (
                    <RecommendationShelf
                      shelfId="newAndRising"
                      title="Aplikasi Naik Daun"
                      subtitle="Rilisan segar dan pembaruan terkini dengan laju pertumbuhan interaksi tertinggi"
                      icon={TrendingUp}
                      items={newAndRisingRecs}
                      onSelectApp={(app) => navigateTo('detail', app.slug || app.id)}
                      onDownloadApp={(app) => handleDirectDownload({} as any, app)}
                      downloadHistory={downloadHistory}
                      currentUser={user}
                      showExplanationBadges={true}
                      allowDismiss={true}
                    />
                  ) : (
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
                              downloadHistory={downloadHistory}
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
                  )}

                  {/* Stage 9.9: Intelligent Smart Collections Shelves */}
                  {homeSmartCollections.length > 0 && (
                    <div className="space-y-8" id="home-smart-collections">
                      {homeSmartCollections.map((col) => (
                        <SmartCollectionShelfView
                          key={col.id}
                          collection={col}
                          onSelectApp={(item) => navigateTo('detail', item.slug || item.appId)}
                          onViewAll={(c) => setViewAllSmartCollection(c)}
                        />
                      ))}
                    </div>
                  )}

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
                          downloadHistory={downloadHistory}
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
                          downloadHistory={downloadHistory}
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
                downloadHistory={downloadHistory}
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
                onBack={handleBack}
                onBackHome={handleBack}
              />
            )}

            {/* Stage 8: Notification Center View */}
            {currentView === 'notifications' && (
              <NotificationCenterView
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onBack={handleBack}
                onBackHome={handleBack}
              />
            )}

            {/* Search Discovery Page (Dedicated /search) */}
            {['search', 'search-type', 'search-results', 'search-expand', 'search-expand-fully'].includes(currentView) && (
              <SearchDiscoveryView
                apps={apps}
                view={currentView}
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onSelectApp={(slug) => {
                  const matchedApp = apps.find(a => a.slug === slug || a.id === slug);
                  if (matchedApp) {
                    const isGame = matchedApp.category === 'Games';
                    navigateTo(isGame ? 'game-detail-type' : 'app-detail-type', matchedApp.slug);
                  } else {
                    navigateTo('detail', slug);
                  }
                }}
                onDownloadApp={handleDirectDownload}
                downloadHistory={downloadHistory}
                onBookmarkToggle={(appId) => handleToggleBookmark(appId)}
                bookmarkedAppIds={bookmarks}
                userId={user?.uid || null}
                onNavigate={navigateTo}
                onBack={() => handleBack()}
              />
            )}

            {currentView === 'developer-detail' && selectedDeveloperSlug && (
              <DeveloperDetailView
                developerSlug={selectedDeveloperSlug}
                apps={apps}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onDownloadApp={handleDirectDownload}
                onNavigate={navigateTo}
                onBack={() => handleBack('all-developers')}
              />
            )}
            {currentView === 'all-developers' && (
              <AllDevelopersView
                apps={apps}
                onSelectDeveloper={(devSlug) => navigateTo('developer-detail', devSlug)}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onDownloadApp={handleDirectDownload}
                onNavigate={navigateTo}
              />
            )}
            {currentView === 'category-detail' && (
              <CategoryDetailView
                categorySlug={selectedCategorySlug || undefined}
                categoryName={filters.category}
                apps={apps}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onDownloadApp={handleDirectDownload}
                onNavigate={navigateTo}
                onBack={() => handleBack('all-categories')}
              />
            )}
            {currentView === 'all-categories' && (
              <AllCategoriesView
                apps={apps}
                onSelectCategory={(catSlug) => navigateTo('category-detail', catSlug)}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                onNavigate={navigateTo}
              />
            )}

            {/* Developer Registration View */}
            {currentView === 'developer-register' && (
              <DeveloperRegisterView
                user={user}
                onSignIn={handleSignIn}
                onBackToHome={() => navigateTo('home')}
              />
            )}

            {/* Developer Dashboard Portal */}
            {currentView === 'developer-dashboard' && (
              <DeveloperDashboard
                user={user}
                onBackToHome={() => navigateTo('home')}
              />
            )}

            {/* Apps Only View */}
            {currentView === 'apps' && (
              <AppsView
                apps={apps}
                onNavigate={navigateTo}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                downloadHistory={downloadHistory}
              />
            )}

            {/* Top Charts / Trending View */}
            {currentView === 'top-charts' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Tangga Teratas & Aplikasi Populer
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Peringkat aplikasi dan game dengan volume interaksi dan unduhan tertinggi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {getTrendingRankings(apps, '7d').map((item) => (
                    <div key={item.app.id} className="relative group flex flex-col space-y-1.5">
                      <AppCard
                        app={item.app}
                        onSelect={(s) => navigateTo('detail', s)}
                        onDownload={handleDirectDownload}
                        downloadHistory={downloadHistory}
                      />
                      <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
              </div>
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
                  downloadHistory={downloadHistory}
                />
              </div>
            )}

            {currentView === 'for-you' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <ForYouView
                  apps={apps}
                  user={user}
                  onSelectApp={(s) => navigateTo('detail', s)}
                  onDownloadApp={handleDirectDownload}
                  downloadHistory={downloadHistory}
                  onSignIn={handleSignIn}
                />
              </div>
            )}

            {currentView === 'popular' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <PopularView
                  apps={apps}
                  onSelectApp={(s) => navigateTo('detail', s)}
                  onDownloadApp={handleDirectDownload}
                />
              </div>
            )}

            {currentView === 'latest' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <LatestView
                  apps={apps}
                  onSelectApp={(s) => navigateTo('detail', s)}
                  onDownloadApp={handleDirectDownload}
                />
              </div>
            )}

            {currentView === 'mod' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <ModAppsView
                  apps={apps}
                  onSelectApp={(s) => navigateTo('detail', s)}
                  onDownloadApp={handleDirectDownload}
                />
              </div>
            )}

            {currentView === 'games' && (
              <GamesView
                apps={apps}
                onNavigate={navigateTo}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                downloadHistory={downloadHistory}
                currentUser={user}
                subscriptionPlan={effectiveSubscriptionPlan}
                userRole={userRole}
                banners={homeBanners}
              />
            )}

            {currentView === 'categories' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <CategoriesView
                  apps={apps}
                  onSelectCategory={(cat) => {
                    setFilters(prev => ({ ...prev, category: cat }));
                    navigateTo('all');
                  }}
                />
              </div>
            )}

            {currentView === 'blog' && (
              <div className="w-full animate-fade-in">
                <BlogMainView
                  onNavigate={navigateTo}
                  onOpenAuthModal={(mode) => {
                    setAuthInitialMode(mode);
                    navigateTo('auth-login');
                  }}
                />
              </div>
            )}

            {currentView === 'blog-category' && (
              <div className="w-full animate-fade-in">
                <BlogCategoryView
                  categorySlug={selectedBlogCategory}
                  onNavigate={navigateTo}
                  onOpenAuthModal={(mode) => {
                    setAuthInitialMode(mode);
                    navigateTo('auth-login');
                  }}
                />
              </div>
            )}

            {currentView === 'blog-search' && (
              <div className="w-full animate-fade-in">
                <BlogSearchView
                  onNavigate={navigateTo}
                  onOpenAuthModal={(mode) => {
                    setAuthInitialMode(mode);
                    navigateTo('auth-login');
                  }}
                />
              </div>
            )}

            {currentView === 'blog-detail' && (
              <div className="w-full animate-fade-in">
                <BlogDetailView
                  slug={selectedBlogSlug || 'cara-menggunakan-2-whatsapp-dalam-1-hp'}
                  onNavigate={navigateTo}
                  onOpenAuthModal={(mode) => {
                    setAuthInitialMode(mode);
                    navigateTo('auth-login');
                  }}
                />
              </div>
            )}

            {currentView === 'event-detail' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <EventDetailView
                  eventId={selectedEventId || ''}
                  apps={apps}
                  onNavigate={navigateTo}
                  onSelectApp={(app) => navigateTo('detail', app.slug || app.id)}
                  onBack={() => handleBack('home')}
                />
              </div>
            )}

            {currentView === 'app-download' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppDownloadView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                />
              </div>
            )}

            {currentView === 'app-versions' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppVersionsView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                  onSelectVersion={() => navigateTo('app-download', activeApp.slug)}
                />
              </div>
            )}

            {currentView === 'app-rating-all' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppReviewsView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                  currentUser={user}
                  onSignIn={handleSignIn}
                />
              </div>
            )}

            {currentView === 'app-write-review' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <WriteReviewView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                  currentUser={user}
                  onSignIn={handleSignIn}
                />
              </div>
            )}

            {currentView === 'app-detail-full' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppDetailFullView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                />
              </div>
            )}

            {currentView === 'app-comments' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppCommentsView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                  currentUser={user}
                />
              </div>
            )}

            {currentView === 'app-screenshots' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppScreenshotsView
                  app={activeApp}
                  onBack={() => handleBack('detail', activeApp.slug)}
                />
              </div>
            )}

            {['auth-login', 'auth-registration', 'auth-forgotpassword', 'auth-verification'].includes(currentView) && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
                <AuthViews
                  mode={
                    currentView === 'auth-login' ? 'login' :
                    currentView === 'auth-registration' ? 'register' :
                    currentView === 'auth-forgotpassword' ? 'forgot-password' :
                    'verify'
                  }
                  onNavigate={navigateTo}
                  onBack={() => {
                    if (currentView === 'auth-login') {
                      handleBack('profile');
                    } else if (currentView === 'auth-registration') {
                      handleBack('auth-login');
                    } else if (currentView === 'auth-forgotpassword') {
                      handleBack('auth-login');
                    } else if (currentView === 'auth-verification') {
                      handleBack('auth-registration');
                    } else {
                      handleBack();
                    }
                  }}
                  onSuccess={() => {
                    handleSignIn();
                    navigateTo('profile');
                  }}
                />
              </div>
            )}

            {currentView === 'settings-security' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
                <SettingsSecurityView
                  onBack={() => handleBack('profile')}
                />
              </div>
            )}

            {currentView === 'social-media' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <SocialMediaView
                  onNavigate={navigateTo}
                  onBack={() => handleBack('home')}
                />
              </div>
            )}

            {currentView === 'help-center' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <HelpCenterView
                  currentUser={user}
                  onNavigate={navigateTo}
                  onBack={() => handleBack('home')}
                />
              </div>
            )}

            {currentView === 'help-ai-assistant' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <HelpAIAssistantView
                  initialQuestion={helpInitialQuestion}
                  onNavigate={navigateTo}
                  onBack={() => handleBack('help-center')}
                />
              </div>
            )}

            {currentView === 'help-articles' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <HelpArticlesView
                  initialSlug={helpArticleSlug}
                  onNavigate={navigateTo}
                  onBack={() => handleBack('help-center')}
                />
              </div>
            )}

            {currentView === 'change-password' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <ChangePasswordView
                  onNavigate={navigateTo}
                  onBack={() => handleBack('help-center')}
                />
              </div>
            )}

            {(currentView === 'customer-service' || currentView === 'contact') && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <CustomerServiceView
                  currentUser={user}
                  onNavigate={navigateTo}
                  onSignIn={handleSignIn}
                  onBack={() => handleBack('help-center')}
                />
              </div>
            )}

            {(currentView === 'subscription' || currentView === 'premium') && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                <SubscriptionView
                  subscriptionPlan={effectiveSubscriptionPlan}
                  userRole={userRole}
                  user={user}
                  onUpgradePlan={handleUpgradePlan}
                  onSignIn={handleSignIn}
                  onBack={() => handleBack('home')}
                  onNavigate={navigateTo}
                />
              </div>
            )}

            {currentView === 'about' && (
              <AboutView
                onNavigate={navigateTo}
                onBack={() => handleBack('home')}
              />
            )}

            {['faq', 'privacy', 'terms', 'dmca', 'disclaimer'].includes(currentView) && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
                <InformationViews
                  type={currentView as any}
                  onNavigate={navigateTo}
                  onBack={() => handleBack('home')}
                />
              </div>
            )}


            {['error-404', 'error-403', 'error-500', 'error-offline', '404', '403', '500', 'offline'].includes(currentView) && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
                <ErrorViews
                  type={(currentView.replace('error-', '') as any) || '404'}
                  onNavigateHome={() => navigateTo('home')}
                />
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fade-in">
                <AppDetail
                  app={activeApp}
                  relatedApps={getRelatedApps(activeApp)}
                  allApps={apps}
                  onNavigate={navigateTo}
                  onBack={() => handleBack('apps')}
                  onSelectRelated={(s) => navigateTo('detail', s)}
                  onDownloadRelated={handleDirectDownload}
                  isBookmarked={bookmarks.includes(activeApp.id)}
                  onToggleBookmark={() => handleToggleBookmark(activeApp.id)}
                  isFollowed={followedApps.includes(activeApp.id)}
                  onToggleFollow={() => handleToggleFollow(activeApp.id)}
                  currentUser={user}
                  onSignIn={handleSignIn}
                  downloadHistory={downloadHistory}
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
                downloadHistory={downloadHistory}
              />
            )}

            {(currentView === 'profile' || currentView === 'account') && (
              <ProfileView
                user={user}
                savedApps={apps.filter(app => bookmarks.includes(app.id))}
                downloadHistory={downloadHistory}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                onRemoveBookmark={(appId) => handleToggleBookmark(appId)}
                onClearDownloadHistory={async () => {
                  await clearDownloadHistory(user);
                  setDownloadHistory([]);
                }}
                onNavigate={navigateTo}
                onBack={() => handleBack('home')}
                onUpdateUser={(updatedUser) => {
                  setUser(prev => prev ? ({ ...prev, ...updatedUser }) : null);
                }}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                user={user}
                onNavigate={navigateTo}
                onBack={() => handleBack('home')}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                onThemeChange={(th) => setDarkMode(th === 'dark')}
              />
            )}

            {currentView === 'settings-language' && (
              <SettingsLanguageView
                onBack={() => handleBack('settings')}
              />
            )}

            {currentView === 'settings-device' && (
              <SettingsDeviceView
                onBack={() => handleBack('settings')}
              />
            )}

            {currentView === 'settings-interests' && (
              <SettingsInterestsView
                user={user}
                onBack={() => handleBack('settings')}
              />
            )}

            {currentView === 'settings-autoplay' && (
              <SettingsAutoplayView
                onBack={() => handleBack('settings')}
              />
            )}

            {currentView === 'settings-theme' && (
              <SettingsThemeView
                onBack={() => handleBack('settings')}
                onThemeChange={(th) => setDarkMode(th === 'dark')}
              />
            )}

            {currentView === 'settings-account-security' && (
              <SettingsAccountSecurityView
                user={user}
                onNavigate={navigateTo}
                onBack={() => handleBack('settings')}
                onSignOut={handleSignOut}
              />
            )}

            {currentView === 'settings-change-password' && (
              <SettingsChangePasswordView
                onNavigate={navigateTo}
                onBack={() => handleBack('settings-account-security')}
              />
            )}

            {currentView === 'settings-sessions' && (
              <SettingsSessionsView
                onBack={() => handleBack('settings-account-security')}
              />
            )}


            {currentView === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
                {isOwnerOrAdmin ? (
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

            {(currentView === 'donate-qris' || currentView === 'qris') && (
              <QrisDonationView
                onBack={() => handleBack('home')}
              />
            )}

            {(currentView === 'donate-bank' || currentView === 'bank') && (
              <BankDonationView
                onBack={() => handleBack('home')}
              />
            )}

            {currentView === 'donate' && (
              <DonateView
                onBackHome={() => handleBack('home')}
                onBack={() => handleBack('home')}
                user={user}
                onSignIn={handleSignIn}
              />
            )}

            {currentView === 'sitemap' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
                <div>
                  <BackButton onBack={() => handleBack('home')} label="Kembali" showText={true} className="mb-4" />
                  <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                    Peta Situs (Sitemap)
                  </h1>
                </div>
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
                      <li><button onClick={() => navigateTo('about')} className="hover:underline text-left">Tentang Kami</button></li>
                      <li><button onClick={() => navigateTo('contact')} className="hover:underline text-left">Hubungi Kami</button></li>
                      <li><button onClick={() => navigateTo('donate')} className="hover:underline text-left">Dukung Mod Station</button></li>
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
      </div>
      </div>

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

      {/* Free-tier Download Interstitial Modal (Section 32) */}
      <DownloadInterstitialModal
        isOpen={interstitialDownload.isOpen}
        app={interstitialDownload.app}
        downloadType={interstitialDownload.downloadType}
        onClose={() => setInterstitialDownload(prev => ({ ...prev, isOpen: false }))}
        onProceedDownload={() => {
          if (interstitialDownload.app) {
            const app = interstitialDownload.app;
            const type = interstitialDownload.downloadType;
            setInterstitialDownload(prev => ({ ...prev, isOpen: false }));
            proceedFinalDownload(app, type);
          }
        }}
        onGoToSubscription={() => {
          setInterstitialDownload(prev => ({ ...prev, isOpen: false }));
          navigateTo('subscription');
        }}
      />

      {/* Stage 9.9: Full Grid View-All Modal for Smart Collections */}
      {viewAllSmartCollection && (
        <SmartCollectionViewAllModal
          collection={viewAllSmartCollection}
          onClose={() => setViewAllSmartCollection(null)}
          onSelectApp={(item) => {
            setViewAllSmartCollection(null);
            navigateTo('detail', item.slug || item.appId);
          }}
        />
      )}
    </div>
  );
}
