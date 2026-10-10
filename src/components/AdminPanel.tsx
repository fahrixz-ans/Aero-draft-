import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Edit3, Trash2, ShieldAlert, CheckCircle, 
  Clock, HelpCircle, FileText, Smartphone, Mail, Settings, 
  Grid, RefreshCw, Upload, Eye, EyeOff, Save, Check, Copy, AlertCircle, TrendingUp, Info,
  FileJson, History, Flame, Layers, Calendar, Sparkles, ExternalLink, Filter,
  FolderPlus, FolderMinus, Tag, Folder, Hash, ArrowRight, CheckCircle2, Heart, X, ShieldCheck, Activity
} from 'lucide-react';
import { AppData, AppStatus, PublishMode } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, 
  query, orderBy, writeBatch, getDoc 
} from 'firebase/firestore';
import { appsData as staticApps } from '../data/appsData';
import { calculateAppBadges } from '../utils/badges';
import { AppBadge, AppBadgeType } from './common/AppBadge';
import { 
  addDeletedAppId, 
  addDeletedAppIds, 
  getDeletedAppIds,
  getStoredFeedback,
  deleteStoredFeedback,
  getStoredSubscribers,
  deleteStoredSubscriber
} from '../utils/appStorage';
import { 
  loadAllCategories, 
  addCategoryToDb, 
  deleteCategoryFromDb, 
  renameCategoryInDb 
} from '../services/categoryService';
import ConfirmDialogModal from './admin/ConfirmDialogModal';
import BulkImportView from './admin/BulkImportView';
import BulkEditModal from './admin/BulkEditModal';
import TrendingDashboard from './admin/TrendingDashboard';
import ImportHistoryView from './admin/ImportHistoryView';
import { ImageUploader } from './admin/ImageUploader';
import { APKUploader } from './admin/APKUploader';
import VersionManagerModal from './admin/VersionManagerModal';
import AdminReportDashboard from './admin/AdminReportDashboard';
import ProductionHealthDashboard from './admin/ProductionHealthDashboard';
import AppEditorModal from './admin/AppEditorModal';
import AdminCollectionsView from './admin/AdminCollectionsView';
import AdminHomepageCMS from './admin/AdminHomepageCMS';
import AdminRecommendationManagement from './admin/AdminRecommendationManagement';
import AdminRankingManagement from './admin/AdminRankingManagement';
import AdminSearchManagement from './admin/AdminSearchManagement';
import AdminUsersRolesView from './admin/AdminUsersRolesView';
import AdminSettingsView from './admin/AdminSettingsView';
import AdminJobsView from './admin/AdminJobsView';
import AdminAnalyticsDashboard from './admin/AdminAnalyticsDashboard';
import AdminExportModal from './admin/AdminExportModal';
import AdminDashboardOverview from './admin/AdminDashboardOverview';
import AdminApplicationsView from './admin/AdminApplicationsView';
import AdminNewAppForm from './admin/AdminNewAppForm';
import AdminModerationHub from './admin/AdminModerationHub';
import AdminSeoIntelligenceView from './admin/AdminSeoIntelligenceView';
import AdminAiDiscoveryIntelligenceView from './admin/AdminAiDiscoveryIntelligenceView';
import AdminNotificationsManagement from './admin/AdminNotificationsManagement';
import AdminBannersManagement from './admin/AdminBannersManagement';
import AdminDonationsManagement from './admin/AdminDonationsManagement';
import AdminNewsletterManagement from './admin/AdminNewsletterManagement';
import AdminReviewsManagement from './admin/AdminReviewsManagement';
import AdminReviewWorkspace from './admin/AdminReviewWorkspace';
import AdminLayout from './admin/common/AdminLayout';
import { BreadcrumbItem } from './admin/common/Breadcrumb';
import { logAdminAction } from '../services/admin/auditLogService';

interface AdminPanelProps {
  onNavigate: (view: string, slug?: string) => void;
  user: any;
  initialTab?: string;
}

type AdminTab = string;

export default function AdminPanel({ onNavigate, user, initialTab }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>((initialTab as AdminTab) || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as AdminTab);
    }
  }, [initialTab]);

  const [apps, setApps] = useState<AppData[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tahap 7 Modal States
  const [appEditorOpen, setAppEditorOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<AppData | null>(null);
  const [isCreatingNewApp, setIsCreatingNewApp] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Bulk operations state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');

  // App Editor Form State
  const [editingApp, setEditingApp] = useState<AppData | null>(null);
  const [isNewApp, setIsNewApp] = useState(false);
  const [versionManagerApp, setVersionManagerApp] = useState<AppData | null>(null);
  
  // Custom temporary fields for arrays
  const [tempPermissions, setTempPermissions] = useState('');
  const [tempScreenshots, setTempScreenshots] = useState('');

  // APK file analysis state
  const [analyzingApk, setAnalyzingApk] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Feedback filter state
  const [feedbackFilterStatus, setFeedbackFilterStatus] = useState<string>('all');
  const [feedbackFilterType, setFeedbackFilterType] = useState<string>('all');

  // Categories management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Reusable In-App Confirmation Dialog State (eliminates window.confirm in iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Load all data from Firestore + LocalStorage fallback
  const loadAllData = async () => {
    setLoading(true);
    try {
      const deletedIds = getDeletedAppIds();

      // 1. Load Applications from Firestore
      let loadedApps: AppData[] = [];
      try {
        const appsSnapshot = await getDocs(collection(db, 'applications'));
        appsSnapshot.forEach((doc) => {
          if (!deletedIds.includes(doc.id)) {
            loadedApps.push({ id: doc.id, ...doc.data() } as AppData);
          }
        });
      } catch (firestoreErr) {
        console.warn('Firestore apps fetch error, using static apps fallback:', firestoreErr);
      }

      // If Firestore is empty, fallback to static data filtered by deleted IDs
      if (loadedApps.length === 0) {
        loadedApps = staticApps.filter(a => !deletedIds.includes(a.id));
      }
      setApps(loadedApps);

      // 2. Load Feedback from Firestore
      let loadedFeedback: any[] = [];
      try {
        const feedbackSnapshot = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
        feedbackSnapshot.forEach((doc) => {
          loadedFeedback.push({ id: doc.id, ...doc.data() });
        });
      } catch (fbErr) {
        console.warn('Firestore feedback fetch error:', fbErr);
        loadedFeedback = getStoredFeedback();
      }
      setFeedback(loadedFeedback);

      // 3. Load Subscribers from Firestore
      let loadedSubs: any[] = [];
      try {
        const subSnapshot = await getDocs(collection(db, 'subscribers'));
        subSnapshot.forEach((doc) => {
          loadedSubs.push({ id: doc.id, ...doc.data() });
        });
      } catch (subErr) {
        console.warn('Firestore subscribers fetch error:', subErr);
        loadedSubs = getStoredSubscribers();
      }
      setSubscribers(loadedSubs);

      // 4. Load Categories dynamically from Firestore
      const activeAppCats = loadedApps.map(a => a.category);
      const allLoadedCats = await loadAllCategories(activeAppCats);
      setCategories(allLoadedCats);

      // 5. Load Donations from Firestore
      let loadedDonations: any[] = [];
      try {
        const donationsSnapshot = await getDocs(collection(db, 'donations'));
        donationsSnapshot.forEach((doc) => {
          loadedDonations.push({ id: doc.id, ...doc.data() });
        });
      } catch (donationsErr) {
        console.warn('Firestore donations fetch error:', donationsErr);
      }
      setDonations(loadedDonations);

    } catch (err: any) {
      console.error('Error loading Admin Panel data:', err);
      setMessage({ text: 'Gagal memuat beberapa data dari Firestore: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync static apps to Firestore (Database Seeder)
  const handleSeedDatabasePrompt = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sinkronisasi Database Firestore',
      message: 'Apakah Anda yakin ingin memindahkan dan menyinkronkan seluruh data aplikasi bawaan ke Cloud Firestore database dengan format model baru?',
      confirmLabel: 'Ya, Sinkron Firestore',
      cancelLabel: 'Batal',
      variant: 'info',
      onConfirm: async () => {
        setActionLoading(true);
        setMessage(null);
        try {
          for (const app of staticApps) {
            const docRef = doc(db, 'applications', app.id);
            const isApk = !!app.downloadUrl && !app.officialDownloadUrl;
            const dataToSave = {
              ...app,
              status: 'published',
              sourceType: isApk ? 'apk' : 'official_link',
              developerName: app.developer || '',
              iconUrl: app.icon || '',
              officialUrl: isApk ? '' : (app.officialDownloadUrl || app.downloadUrl || ''),
              apkFileUrl: isApk ? (app.downloadUrl || '') : '',
              versionName: app.version || '1.0.0',
              officialDownloadUrl: app.officialDownloadUrl || app.downloadUrl,
              permissions: app.permissions || ['INTERNET', 'CAMERA', 'POST_NOTIFICATIONS'],
              minSdk: app.minSdk || 21,
              targetSdk: app.targetSdk || 34,
              signingCertificate: app.signingCertificate || {
                sha256: 'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA',
                sha1: '11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22',
                issuer: 'C=US, O=Google Play, CN=Android Release',
                subject: 'C=US, O=Google Play, CN=Android Release'
              }
            };
            await setDoc(docRef, dataToSave);
          }
          setMessage({ text: 'Berhasil melakukan sinkronisasi database aplikasi statis ke Cloud Firestore dengan skema model baru!', type: 'success' });
          await loadAllData();
        } catch (err: any) {
          console.error('Seeding error:', err);
          setMessage({ text: 'Gagal seeding database: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  // Delete an Application
  const promptDeleteApp = (app: AppData) => {
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Aplikasi: ${app.name}`,
      message: `Apakah Anda yakin ingin menghapus aplikasi "${app.name}" secara permanen dari Cloud Firestore?`,
      detail: `ID: ${app.id} | Kategori: ${app.category} | Versi: ${app.version}`,
      confirmLabel: 'Ya, Hapus Aplikasi',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          try {
            await deleteDoc(doc(db, 'applications', app.id));
          } catch (fireErr) {
            console.warn('Firestore delete doc notice:', fireErr);
          }
          addDeletedAppId(app.id);
          setApps(prev => prev.filter(a => a.id !== app.id));
          setSelectedAppIds(prev => prev.filter(id => id !== app.id));
          setMessage({ text: `Aplikasi "${app.name}" berhasil dihapus dari database.`, type: 'success' });
        } catch (err: any) {
          console.error('Delete error:', err);
          setMessage({ text: 'Gagal menghapus aplikasi: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  // Open Edit App Form
  const startEditApp = (app: AppData) => {
    setEditingApp({
      ...app,
      sourceType: app.sourceType || (app.apkFileUrl || app.downloadUrl ? 'apk' : 'official_link'),
      developerName: app.developerName || app.developer || '',
      iconUrl: app.iconUrl || app.icon || '',
      officialUrl: app.officialUrl || app.officialDownloadUrl || '',
      apkFileUrl: app.apkFileUrl || app.downloadUrl || '',
    });
    setIsNewApp(false);
    setTempPermissions(app.permissions ? app.permissions.join(', ') : '');
    setTempScreenshots(app.screenshots ? app.screenshots.join('\n') : '');
    setAnalysisError('');
  };

  // Open Create App Form
  const startCreateApp = () => {
    const newId = 'app-' + Math.random().toString(36).substr(2, 9);
    setEditingApp({
      id: newId,
      name: '',
      slug: '',
      developerName: '',
      developer: '',
      iconUrl: '',
      icon: '',
      screenshots: [],
      description: '',
      category: categories[0] || 'Communication',
      versionName: '1.0.0',
      version: '1.0.0',
      size: '0 MB',
      androidVersion: 'Android 6.0+',
      rating: 4.5,
      downloads: 10000,
      releaseDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      sourceType: 'official_link',
      officialUrl: '',
      apkFileUrl: '',
      downloadUrl: '',
      officialDownloadUrl: '',
      alternativeDownloadUrl: '',
      featured: false,
      popular: false,
      status: 'published',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      minSdk: 21,
      targetSdk: 35,
      signingCertificate: {
        sha256: '',
        sha1: '',
        issuer: '',
        subject: ''
      }
    });
    setIsNewApp(true);
    setTempPermissions('INTERNET, ACCESS_NETWORK_STATE');
    setTempScreenshots('');
    setAnalysisError('');
  };

  const startCreateAppWithMetadata = (meta: any, apkUrl: string) => {
    const newId = 'app-' + Math.random().toString(36).substr(2, 9);
    const parts = (meta.packageName || '').split('.');
    const rawName = parts.length > 1 ? parts[parts.length - 1] : 'Aplikasi Baru';
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    setEditingApp({
      id: newId,
      name: formattedName,
      slug: formattedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      packageName: meta.packageName || '',
      developerName: 'Android Developer',
      developer: 'Android Developer',
      iconUrl: '',
      icon: '',
      screenshots: [],
      description: `Aplikasi ${formattedName} resmi untuk platform Android. Terverifikasi aman melalui Static APK Analyzer.`,
      category: categories[0] || 'Tools',
      versionName: meta.versionName || '1.0.0',
      version: meta.versionName || '1.0.0',
      versionCode: meta.versionCode || 1,
      size: (meta.fileSize / (1024 * 1024)).toFixed(1) + ' MB',
      apkSize: meta.fileSize,
      sha256: meta.sha256,
      androidVersion: `Android ${meta.minSdk ? (meta.minSdk >= 24 ? '7.0+' : '6.0+') : '7.0+'}`,
      rating: 4.8,
      downloads: 0,
      releaseDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      sourceType: 'apk',
      officialUrl: '',
      apkFileUrl: apkUrl,
      downloadUrl: apkUrl,
      officialDownloadUrl: '',
      alternativeDownloadUrl: '',
      featured: false,
      popular: false,
      status: 'published',
      permissions: meta.permissions || ['INTERNET', 'ACCESS_NETWORK_STATE'],
      minSdk: meta.minSdk || 24,
      targetSdk: meta.targetSdk || 35,
      architectures: meta.architectures || ['arm64-v8a', 'armeabi-v7a'],
      signingCertificate: meta.signingCertificate || {
        sha256: '',
        sha1: '',
        issuer: '',
        subject: ''
      }
    });
    setIsNewApp(true);
    setTempPermissions(meta.permissions ? meta.permissions.join(', ') : 'INTERNET, ACCESS_NETWORK_STATE');
    setTempScreenshots('');
    setAnalysisError('');
    setActiveTab('applications');
  };

  // Server-side Static APK Analyzer Invocation
  const handleApkFileAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingApk(true);
    setAnalysisError('');

    const formData = new FormData();
    formData.append('apk', file);

    try {
      const response = await fetch('/api/analyze-apk', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server-side static analysis failed.');
      }

      const results = await response.json();
      
      // Update form state with successfully parsed values!
      if (editingApp) {
        setEditingApp(prev => {
          if (!prev) return null;
          return {
            ...prev,
            permissions: results.permissions,
            minSdk: results.minSdk,
            targetSdk: results.targetSdk,
            signingCertificate: results.signingCertificate
          };
        });
        setTempPermissions(results.permissions.join(', '));
      }
      setMessage({ text: `Analisis APK ${file.name} selesai! Field keamanan otomatis terisi.`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Gagal menganalisis APK. Silakan periksa koneksi server.');
    } finally {
      setAnalyzingApk(false);
    }
  };

  // Save/Update Application Form
  const handleSaveAppForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setActionLoading(true);
    setMessage(null);

    // Prepare arrays
    const finalPermissions = tempPermissions
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(p => p.length > 0);

    const finalScreenshots = tempScreenshots
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Validation
    if (!editingApp.name.trim()) {
      setMessage({ text: 'Nama aplikasi wajib diisi!', type: 'error' });
      setActionLoading(false);
      return;
    }

    if (!editingApp.developerName?.trim()) {
      setMessage({ text: 'Nama developer wajib diisi!', type: 'error' });
      setActionLoading(false);
      return;
    }

    const isValidUploadUrl = (url: string) => url.startsWith('/uploads/');

    if (!editingApp.iconUrl || !isValidUploadUrl(editingApp.iconUrl)) {
      setMessage({ text: 'Ikon aplikasi harus diunggah melalui tombol upload (URL eksternal tidak diizinkan)!', type: 'error' });
      setActionLoading(false);
      return;
    }

    for (const scr of finalScreenshots) {
      if (!isValidUploadUrl(scr)) {
        setMessage({ text: 'Semua tangkapan layar (screenshots) harus diunggah melalui sistem upload!', type: 'error' });
        setActionLoading(false);
        return;
      }
    }

    if (editingApp.sourceType === 'official_link') {
      if (!editingApp.officialUrl?.trim() || !/^https?:\/\//i.test(editingApp.officialUrl)) {
        setMessage({ text: 'URL Resmi wajib diisi dengan format URL yang valid (http:// atau https://)!', type: 'error' });
        setActionLoading(false);
        return;
      }
    } else if (editingApp.sourceType === 'apk') {
      if (!editingApp.apkFileUrl || !isValidUploadUrl(editingApp.apkFileUrl)) {
        setMessage({ text: 'File APK wajib diunggah!', type: 'error' });
        setActionLoading(false);
        return;
      }
    }

    // Sync old and new fields for seamless backward-compatibility
    const appToSave: AppData = {
      ...editingApp,
      slug: editingApp.slug.trim().toLowerCase() || editingApp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      permissions: finalPermissions,
      screenshots: finalScreenshots,
      downloads: Number(editingApp.downloads) || 0,
      rating: Number(editingApp.rating) || 0,
      minSdk: editingApp.minSdk ? Number(editingApp.minSdk) : null,
      targetSdk: editingApp.targetSdk ? Number(editingApp.targetSdk) : null,

      // Synced Legacy fields
      developer: editingApp.developerName,
      icon: editingApp.iconUrl,
      version: editingApp.versionName || editingApp.version || '1.0.0',
      downloadUrl: editingApp.sourceType === 'apk' ? editingApp.apkFileUrl || '' : '',
      officialDownloadUrl: editingApp.sourceType === 'official_link' ? editingApp.officialUrl || '' : '',
      alternativeDownloadUrl: '', // remove alternative mirrors as per Section 1: Aero is NOT a mirror directory
    };

    // Clean unneeded properties based on type
    if (appToSave.sourceType === 'official_link') {
      appToSave.apkFileUrl = '';
      appToSave.downloadUrl = '';
    } else {
      appToSave.officialUrl = '';
      appToSave.officialDownloadUrl = '';
    }

    try {
      const docRef = doc(db, 'applications', appToSave.id);
      await setDoc(docRef, appToSave);
      
      // Audit trail logging
      await logAdminAction({
        action: isNewApp ? 'app_created' : 'app_updated',
        entityType: 'application',
        entityId: appToSave.id,
        entityName: appToSave.name,
        metadata: { version: appToSave.version, status: appToSave.status }
      });

      setMessage({ text: `Aplikasi "${appToSave.name}" berhasil disimpan di Firestore.`, type: 'success' });
      setEditingApp(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Save App error:', err);
      setMessage({ text: 'Gagal menyimpan aplikasi: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish / Schedule / Draft Actions
  const handlePublishNow = async (app: AppData) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, 'applications', app.id);
      await updateDoc(docRef, {
        status: 'published',
        publishMode: 'immediate',
        publishAt: null,
        updatedAt: new Date().toISOString().split('T')[0]
      });

      // Audit trail logging
      await logAdminAction({
        action: 'app_published',
        entityType: 'application',
        entityId: app.id,
        entityName: app.name,
        metadata: { previousStatus: app.status }
      });

      setMessage({ text: `Aplikasi "${app.name}" sekarang telah TERBIT publik di Firestore.`, type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error('Publish now error:', err);
      setMessage({ text: 'Gagal menerbitkan aplikasi: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSchedule = async (app: AppData) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, 'applications', app.id);
      await updateDoc(docRef, {
        status: 'draft',
        publishMode: 'immediate',
        publishAt: null
      });
      setMessage({ text: `Jadwal rilis "${app.name}" dibatalkan dan diubah menjadi Draf.`, type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error('Cancel schedule error:', err);
      setMessage({ text: 'Gagal membatalkan jadwal: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStatusChange = (newStatus: AppStatus) => {
    if (selectedAppIds.length === 0) return;
    const actionLabel = newStatus === 'published' ? 'menerbitkan' : newStatus === 'draft' ? 'menjadikan draf' : 'mengarsipkan';
    
    setConfirmDialog({
      isOpen: true,
      title: `Ubah Status Massal (${selectedAppIds.length} Aplikasi)`,
      message: `Apakah Anda yakin ingin ${actionLabel} ${selectedAppIds.length} aplikasi terpilih ke status "${newStatus}" di Firestore?`,
      detail: `ID terpilih: ${selectedAppIds.slice(0, 5).join(', ')}${selectedAppIds.length > 5 ? '...' : ''}`,
      confirmLabel: `Ubah ke ${newStatus.toUpperCase()}`,
      cancelLabel: 'Batal',
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const chunkSize = 200;
          for (let i = 0; i < selectedAppIds.length; i += chunkSize) {
            const chunk = selectedAppIds.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(id => {
              const docRef = doc(db, 'applications', id);
              batch.update(docRef, { 
                status: newStatus,
                ...(newStatus === 'published' ? { publishMode: 'immediate', publishAt: null } : {})
              });
            });
            await batch.commit();
          }

          setMessage({ text: `Berhasil memperbarui status ${selectedAppIds.length} aplikasi menjadi "${newStatus}".`, type: 'success' });
          setSelectedAppIds([]);
          await loadAllData();
        } catch (err: any) {
          console.error('Bulk status change error:', err);
          setMessage({ text: 'Gagal melakukan pembaruan massal: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedAppIds.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Massal (${selectedAppIds.length} Aplikasi)`,
      message: `PERINGATAN: Anda akan menghapus permanen ${selectedAppIds.length} aplikasi terpilih dari Firestore. Tindakan ini tidak dapat dibatalkan.`,
      detail: `Total item: ${selectedAppIds.length} berkas aplikasi.`,
      confirmLabel: `Ya, Hapus ${selectedAppIds.length} Aplikasi`,
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const chunkSize = 200;
          for (let i = 0; i < selectedAppIds.length; i += chunkSize) {
            const chunk = selectedAppIds.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(id => {
              const docRef = doc(db, 'applications', id);
              batch.delete(docRef);
            });
            try {
              await batch.commit();
            } catch (batchErr) {
              console.warn('Batch delete doc notice:', batchErr);
            }
          }

          addDeletedAppIds(selectedAppIds);
          setApps(prev => prev.filter(a => !selectedAppIds.includes(a.id)));
          setMessage({ text: `Berhasil menghapus permanen ${selectedAppIds.length} aplikasi terpilih.`, type: 'success' });
          setSelectedAppIds([]);
        } catch (err: any) {
          console.error('Bulk delete error:', err);
          setMessage({ text: 'Gagal menghapus aplikasi terpilih: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  const handleToggleSelectAll = (visibleAppIds: string[]) => {
    const allSelected = visibleAppIds.every(id => selectedAppIds.includes(id));
    if (allSelected) {
      setSelectedAppIds(prev => prev.filter(id => !visibleAppIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...visibleAppIds])));
    }
  };

  const handleToggleSelectApp = (appId: string) => {
    setSelectedAppIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Update Feedback Status
  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: 'reviewed' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), { status: newStatus });
      setMessage({ text: 'Status laporan berhasil diperbarui.', type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error('Update feedback error:', err);
      setMessage({ text: 'Gagal memperbarui status: ' + err.message, type: 'error' });
    }
  };

  // Delete Feedback Prompt
  const promptDeleteFeedback = (feedbackId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Laporan Feedback',
      message: 'Apakah Anda yakin ingin menghapus permanen laporan feedback ini?',
      confirmLabel: 'Hapus Feedback',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'feedback', feedbackId));
          setFeedback(prev => prev.filter(f => f.id !== feedbackId));
          setMessage({ text: 'Laporan feedback berhasil dihapus.', type: 'success' });
        } catch (err: any) {
          console.error('Delete feedback error:', err);
          setMessage({ text: 'Gagal menghapus feedback: ' + err.message, type: 'error' });
        } finally {
          closeConfirmDialog();
        }
      }
    });
  };

  // Delete Subscriber Prompt
  const promptDeleteSubscriber = (subId: string, email: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Langganan Newsletter',
      message: `Apakah Anda yakin ingin menghapus email "${email}" dari daftar langganan update AeroAPK?`,
      confirmLabel: 'Hapus Subscriber',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'subscribers', subId));
          setSubscribers(prev => prev.filter(s => s.id !== subId));
          setMessage({ text: 'Subscriber berhasil dihapus.', type: 'success' });
        } catch (err: any) {
          console.error('Delete subscriber error:', err);
          setMessage({ text: 'Gagal menghapus subscriber: ' + err.message, type: 'error' });
        } finally {
          closeConfirmDialog();
        }
      }
    });
  };

  // Category Management: Add
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setMessage({ text: 'Silakan masukkan nama kategori yang valid (minimal 2 karakter).', type: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await addCategoryToDb(trimmed, newCatDesc.trim());
      if (!res.success) {
        setMessage({ text: res.error || 'Gagal menambahkan kategori.', type: 'error' });
      } else {
        setCategories(res.updatedList);
        setNewCatName('');
        setNewCatDesc('');
        setMessage({ text: `Kategori "${trimmed}" berhasil ditambahkan dan disimpan ke database!`, type: 'success' });
      }
    } catch (err: any) {
      console.error('Error adding category:', err);
      setMessage({ text: 'Gagal menambahkan kategori: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Category Management: Delete Prompt
  const promptDeleteCategory = (catName: string) => {
    const appsUsingCategory = apps.filter(a => a.category?.toLowerCase() === catName.toLowerCase());
    const count = appsUsingCategory.length;

    setConfirmDialog({
      isOpen: true,
      title: `Hapus Kategori: ${catName}`,
      message: count > 0 
        ? `Terdapat ${count} aplikasi yang saat ini menggunakan kategori "${catName}". Jika dihapus, aplikasi tersebut akan otomatis dialihkan ke kategori "Utilities". Apakah Anda yakin ingin melanjutkan?`
        : `Apakah Anda yakin ingin menghapus kategori "${catName}" secara permanen dari database?`,
      detail: count > 0 ? `Aplikasi terkait: ${appsUsingCategory.slice(0, 3).map(a => a.name).join(', ')}${count > 3 ? ` dan ${count - 3} lainnya` : ''}` : undefined,
      confirmLabel: 'Ya, Hapus Kategori',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await deleteCategoryFromDb(catName, 'Utilities');
          if (res.success) {
            setCategories(res.updatedList);
            setMessage({ text: `Kategori "${catName}" berhasil dihapus dari database.`, type: 'success' });
            await loadAllData();
          } else {
            setMessage({ text: res.error || 'Gagal menghapus kategori.', type: 'error' });
          }
        } catch (err: any) {
          console.error('Delete category error:', err);
          setMessage({ text: 'Gagal menghapus kategori: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  // Category Management: Save Rename
  const handleSaveRenameCategory = async () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    setActionLoading(true);
    try {
      const res = await renameCategoryInDb(editingCategory.oldName, editingCategory.newName.trim());
      if (res.success) {
        setCategories(res.updatedList);
        setMessage({ text: `Kategori berhasil diubah menjadi "${editingCategory.newName.trim()}".`, type: 'success' });
        setEditingCategory(null);
        await loadAllData();
      } else {
        setMessage({ text: res.error || 'Gagal mengubah nama kategori.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Rename category error:', err);
      setMessage({ text: 'Gagal mengubah nama kategori: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculations
  const totalDownloads = apps.reduce((acc, app) => acc + (Number(app.downloads) || 0), 0);
  const newFeedbackCount = feedback.filter(f => f.status === 'new').length;

  const getBreadcrumbsForTab = (tab: string): BreadcrumbItem[] => {
    switch (tab) {
      case 'dashboard':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Dashboard Overview' }];
      case 'apps':
      case 'applications':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Aplikasi', route: 'apps' }, { label: 'Katalog Aplikasi' }];
      case 'apps-new':
      case 'new-app':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Aplikasi', route: 'apps' }, { label: 'Tambah Aplikasi Baru' }];
      case 'versions':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Aplikasi', route: 'apps' }, { label: 'Manajemen Versi' }];
      case 'categories':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Aplikasi', route: 'apps' }, { label: 'Kategori Aplikasi' }];
      case 'collections':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'CMS & Konten', route: 'homepage-cms' }, { label: 'Koleksi Terkurasi' }];
      case 'homepage':
      case 'homepage-cms':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'CMS & Konten', route: 'homepage-cms' }, { label: 'Homepage Layout' }];
      case 'moderation':
      case 'reports':
      case 'feedback':
      case 'reviews':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Moderasi', route: 'moderation' }, { label: 'Antrean Moderasi' }];
      case 'security-center':
      case 'security-alerts':
      case 'apk-security':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Keamanan APK', route: 'security-center' }, { label: 'Pusat Keamanan' }];
      case 'analytics-overview':
      case 'analytics-apps':
      case 'analytics-downloads':
      case 'trending':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Analytics' }, { label: 'Performa & Unduhan' }];
      case 'system-storage':
      case 'storage-control':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Sistem', route: 'system-health' }, { label: 'Storage & Media' }];
      case 'system-jobs':
      case 'jobs':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Sistem', route: 'system-health' }, { label: 'Antrean Jobs' }];
      case 'system-search':
      case 'search-control':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Sistem', route: 'system-health' }, { label: 'Indeks Pencarian' }];
      case 'system-health':
      case 'production-health':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Sistem' }, { label: 'Status & Audit Produksi' }];
      case 'access-admins':
      case 'users-roles':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Hak Akses' }, { label: 'Pengguna & Administrator' }];
      case 'settings-general':
      case 'settings':
        return [{ label: 'Admin', route: 'dashboard' }, { label: 'Pengaturan Sistem' }];
      default:
        return [{ label: 'Admin', route: 'dashboard' }, { label: tab.replace(/-/g, ' ').toUpperCase() }];
    }
  };

  const getPageTitleForTab = (tab: string): string => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Ringkasan';
      case 'apps': case 'applications': return 'Katalog Aplikasi & Rilis';
      case 'apps-new': case 'new-app': return 'Tambah Aplikasi Baru';
      case 'versions': return 'Manajemen Versi & File APK';
      case 'categories': return 'Kelola Kategori Aplikasi';
      case 'collections': return 'Koleksi Terkurasi (Collections)';
      case 'homepage': case 'homepage-cms': return 'Homepage Layout & CMS';
      case 'moderation': case 'reports': case 'feedback': case 'reviews': return 'Pusat Moderasi & Laporan';
      case 'security-center': case 'security-alerts': case 'apk-security': return 'Audit Keamanan APK & Sertifikat';
      case 'analytics-overview': case 'analytics-apps': case 'analytics-downloads': case 'trending': return 'Laporan Analytics & Performa';
      case 'system-storage': case 'storage-control': return 'Manajemen Storage & Berkas';
      case 'system-jobs': case 'jobs': return 'Antrean Jobs & Background Workers';
      case 'system-search': case 'search-control': return 'Indeks & Algoritma Pencarian';
      case 'system-health': case 'production-health': return 'System Health & Telemetri Produksi';
      case 'access-admins': case 'users-roles': return 'Manajemen Pengguna & Hak Akses (RBAC)';
      case 'settings-general': case 'settings': return 'Konfigurasi Global Sistem';
      case 'seo': return 'SEO & Organic Discovery Control Center';
      case 'ai-discovery': return 'AI Discovery & Search Intelligence Control';
      default: return tab.replace(/-/g, ' ').toUpperCase();
    }
  };

  return (
    <AdminLayout
      user={user}
      activeRoute={activeTab}
      onNavigateRoute={(route, slugOrId) => {
        if (route === 'public-app' && slugOrId) {
          onNavigate('detail', slugOrId);
        } else {
          setActiveTab(route);
        }
      }}
      onSignOut={() => onNavigate('home')}
      apps={apps}
      reports={feedback}
      pendingModerationCount={feedback.filter(f => f.status === 'new').length}
      securityAlertCount={0}
      breadcrumbs={getBreadcrumbsForTab(activeTab)}
      pageTitle={getPageTitleForTab(activeTab)}
    >
      <div className="space-y-6">

      {/* Global Toast Message Feedback */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-bold shadow-md animate-fade-in ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-extrabold uppercase hover:underline opacity-80 cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Main Form Overlay Editor Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-[#151921] rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden my-8 animate-fade-in">
            {/* Form Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {isNewApp ? 'Tambah Aplikasi Baru' : `Edit Aplikasi: ${editingApp.name}`}
                </h2>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                  Lengkapi spesifikasi teknis rilis APK, branding visual, dan audit tanda tangan digital.
                </p>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
              >
                Tutup Form
              </button>
            </div>

            {/* Form Body Scrollable */}
            <form onSubmit={handleSaveAppForm} className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
              
              {/* BRANDING, BASICS & DISTRIBUTION METHOD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLUMN 1: BASIC INFORMATION */}
                <div className="space-y-6 p-6 bg-slate-50 dark:bg-white/[0.01] rounded-3xl border border-slate-150 dark:border-white/5">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Informasi Dasar Aplikasi
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Aplikasi</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.name}
                      onChange={e => setEditingApp({ ...editingApp, name: e.target.value })}
                      placeholder="Contoh: WhatsApp Messenger"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Slug / Package ID (Unik)</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.slug}
                      onChange={e => setEditingApp({ ...editingApp, slug: e.target.value })}
                      placeholder="Contoh: com.whatsapp"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Developer</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.developerName || ''}
                      onChange={e => setEditingApp({ ...editingApp, developerName: e.target.value })}
                      placeholder="Contoh: WhatsApp LLC"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kategori Aplikasi</label>
                    <select
                      value={editingApp.category}
                      onChange={e => setEditingApp({ ...editingApp, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white cursor-pointer shadow-xs"
                    >
                      {categories.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* COLUMN 2: BRAND IDENTITY & SCREENSHOTS */}
                <div className="space-y-6 p-6 bg-slate-50 dark:bg-white/[0.01] rounded-3xl border border-slate-150 dark:border-white/5">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Visual Branding & Screenshots
                  </h3>

                  {/* App Icon Upload */}
                  <ImageUploader
                    type="icon"
                    currentUrl={editingApp.iconUrl}
                    onUpload={(url) => setEditingApp({ ...editingApp, iconUrl: url })}
                    label="Ikon Aplikasi"
                  />

                  {/* Screenshots List Upload */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                      Tangkapan Layar (Screenshots)
                    </label>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {tempScreenshots.split('\n').filter(s => s.trim().length > 0).map((scr, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-[3/4] bg-slate-100 dark:bg-black/30 flex items-center justify-center p-1">
                          <img src={scr} className="max-h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => {
                              const list = tempScreenshots.split('\n').filter(s => s.trim().length > 0);
                              list.splice(idx, 1);
                              setTempScreenshots(list.join('\n'));
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all cursor-pointer shadow-sm"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}

                      {tempScreenshots.split('\n').filter(s => s.trim().length > 0).length < 8 && (
                        <div className="aspect-[3/4] border-2 border-dashed border-slate-200 dark:border-white/15 rounded-xl hover:border-blue-500 transition-colors">
                          <ImageUploader
                            type="screenshot"
                            onUpload={(url) => {
                              if (url) {
                                const list = tempScreenshots.split('\n').filter(s => s.trim().length > 0);
                                list.push(url);
                                setTempScreenshots(list.join('\n'));
                              }
                            }}
                            label="Tambah"
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1">Unggah tangkapan layar antarmuka Android (Maks. 8 gambar).</span>
                  </div>
                </div>

              </div>

              {/* DISTRIBUTION SOURCE TYPE CONTAINER */}
              <div className="p-6 bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/5 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Metode Distribusi Aplikasi
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tentukan bagaimana pengguna mengunduh aplikasi ini. Pilih antara mengarahkan ke website resmi developer atau mengunggah APK secara mandiri.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingApp({ ...editingApp, sourceType: 'official_link' })}
                    className={`p-4 border-2 rounded-2xl text-left transition-all ${
                      editingApp.sourceType === 'official_link'
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${editingApp.sourceType === 'official_link' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-white/5'}`}>
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">Website Resmi (Official Link)</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">Pengguna diarahkan ke situs developer eksternal.</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingApp({ ...editingApp, sourceType: 'apk' })}
                    className={`p-4 border-2 rounded-2xl text-left transition-all ${
                      editingApp.sourceType === 'apk'
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${editingApp.sourceType === 'apk' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-white/5'}`}>
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">Hosted APK (File APK Mandiri)</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">Berkas APK disimpan langsung di server Aero.</p>
                      </div>
                    </div>
                  </button>
                </div>

                {editingApp.sourceType === 'official_link' ? (
                  <div className="space-y-2 p-4 bg-blue-500/5 border border-blue-500/25 rounded-2xl animate-fade-in">
                    <label className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      Tautan Resmi Website Developer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={editingApp.officialUrl || ''}
                      onChange={e => setEditingApp({ ...editingApp, officialUrl: e.target.value })}
                      placeholder="https://www.whatsapp.com/android"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-blue-500/30 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                    />
                    <span className="text-[9.5px] text-slate-400 block mt-1 leading-normal">
                      Sistem discovery Aero akan mendeteksi status tautan ini secara periodik. Pastikan tautan mengarah langsung ke halaman rilis resmi atau tombol download situs web mereka.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6 p-4 bg-slate-100/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-2xl animate-fade-in">
                    
                    {/* APK File Drag-and-drop Component */}
                    <APKUploader
                      label="Upload Berkas Android Package (APK)"
                      currentUrl={editingApp.apkFileUrl}
                      onUploadSuccess={(url, metadata) => {
                        setEditingApp({
                          ...editingApp,
                          apkFileUrl: url,
                          packageName: metadata.packageName,
                          slug: metadata.packageName || editingApp.slug,
                          versionName: metadata.versionName,
                          versionCode: metadata.versionCode,
                          apkSize: metadata.fileSize,
                          size: (metadata.fileSize / (1024 * 1024)).toFixed(1) + ' MB',
                          minSdk: metadata.minSdk,
                          targetSdk: metadata.targetSdk,
                          permissions: metadata.permissions,
                          signingCertificate: metadata.signingCertificate,
                          sha256: metadata.sha256,
                        });
                        setTempPermissions(metadata.permissions.join(', '));
                      }}
                    />

                    {/* Extracted APK Metadata Inspector Panel */}
                    {editingApp.apkFileUrl && (
                      <div className="p-4 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl space-y-4 animate-fade-in">
                        <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                          Hasil Ekstraksi Metadata APK (Otomatis)
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[10.5px]">
                          <div>
                            <span className="text-slate-400 block">Package Name</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{editingApp.packageName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Versi (VersionName)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{editingApp.versionName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Version Code</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{editingApp.versionCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Ukuran File</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {editingApp.apkSize ? `${(editingApp.apkSize / (1024 * 1024)).toFixed(2)} MB` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Minimum SDK API</span>
                            <span className="font-bold text-slate-850 dark:text-slate-100">API {editingApp.minSdk || '24'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Target SDK API</span>
                            <span className="font-bold text-slate-850 dark:text-slate-100 font-mono">API {editingApp.targetSdk || '35'}</span>
                          </div>
                        </div>

                        {/* Architectures list */}
                        {editingApp.architectures && editingApp.architectures.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                            <span className="text-slate-400 text-[10px] block mb-1">CPU Architectures</span>
                            <div className="flex flex-wrap gap-1.5">
                              {editingApp.architectures.map((arch, index) => (
                                <span key={index} className="px-2 py-0.5 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-md font-mono text-[9.5px] font-black text-slate-700 dark:text-slate-300">
                                  {arch}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Detailed Description & Changelogs */}
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                  Publikasi Teks & Log Perubahan
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Deskripsi Lengkap Aplikasi</label>
                  <textarea 
                    rows={5}
                    required
                    value={editingApp.description}
                    onChange={e => setEditingApp({ ...editingApp, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Yang Baru di Versi Ini (Changelog)</label>
                  <textarea 
                    rows={3}
                    value={editingApp.whatsNew || ''}
                    onChange={e => setEditingApp({ ...editingApp, whatsNew: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. Technical Security Information (Form Fields) */}
              <div className="space-y-5 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                  Technical Security Information (Audit Metadata)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target API Level (SDK Target)</label>
                    <input 
                      type="number"
                      value={editingApp.targetSdk || ''}
                      onChange={e => setEditingApp({ ...editingApp, targetSdk: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Contoh: 35"
                      className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Minimum API Level (SDK Minimum)</label>
                    <input 
                      type="number"
                      value={editingApp.minSdk || ''}
                      onChange={e => setEditingApp({ ...editingApp, minSdk: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Contoh: 21"
                      className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Android Permissions (Pisahkan dengan Koma)</label>
                  <input 
                    type="text"
                    value={tempPermissions}
                    onChange={e => setTempPermissions(e.target.value)}
                    placeholder="INTERNET, CAMERA, RECORD_AUDIO, POST_NOTIFICATIONS"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-4 border-t border-slate-200/50 dark:border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">Fingerprint & Certificate Authority</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SHA-256 Fingerprint</label>
                    <input 
                      type="text"
                      value={editingApp.signingCertificate?.sha256 || ''}
                      onChange={e => setEditingApp({
                        ...editingApp,
                        signingCertificate: {
                          ...(editingApp.signingCertificate || { sha1: '', issuer: '', subject: '' }),
                          sha256: e.target.value.toUpperCase()
                        }
                      })}
                      placeholder="AA:BB:CC..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SHA-1 Fingerprint</label>
                    <input 
                      type="text"
                      value={editingApp.signingCertificate?.sha1 || ''}
                      onChange={e => setEditingApp({
                        ...editingApp,
                        signingCertificate: {
                          ...(editingApp.signingCertificate || { sha256: '', issuer: '', subject: '' }),
                          sha1: e.target.value.toUpperCase()
                        }
                      })}
                      placeholder="11:22:33..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Certificate Issuer</label>
                      <input 
                        type="text"
                        value={editingApp.signingCertificate?.issuer || ''}
                        onChange={e => setEditingApp({
                          ...editingApp,
                          signingCertificate: {
                            ...(editingApp.signingCertificate || { sha256: '', sha1: '', subject: '' }),
                            issuer: e.target.value
                          }
                        })}
                        placeholder="C=US, O=Google Play, CN=Android Release"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Certificate Subject</label>
                      <input 
                        type="text"
                        value={editingApp.signingCertificate?.subject || ''}
                        onChange={e => setEditingApp({
                          ...editingApp,
                          signingCertificate: {
                            ...(editingApp.signingCertificate || { sha256: '', sha1: '', issuer: '' }),
                            subject: e.target.value
                          }
                        })}
                        placeholder="C=US, O=WhatsApp LLC, CN=WhatsApp"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Visibility, Discovery, Scheduled Publishing & Dynamic Badges */}
              <div className="space-y-5 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                  Visibilitas, Jadwal Publikasi & Badges
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status Publikasi</label>
                    <select
                      value={editingApp.status || 'published'}
                      onChange={e => setEditingApp({ 
                        ...editingApp, 
                        status: e.target.value as any,
                        publishMode: e.target.value === 'scheduled' ? 'scheduled' : editingApp.publishMode || 'immediate'
                      })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-850 dark:text-white cursor-pointer"
                    >
                      <option value="published">Published (Tampil Publik di Katalog)</option>
                      <option value="draft">Draft (Draf - Hanya Admin yang dapat Pratinjau)</option>
                      <option value="scheduled">Scheduled (Terjadwal Otomatis)</option>
                      <option value="archived">Archived (Diarsipkan / Disembunyikan)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mode Penerbitan</label>
                    <select
                      value={editingApp.publishMode || (editingApp.status === 'scheduled' ? 'scheduled' : 'immediate')}
                      onChange={e => setEditingApp({ 
                        ...editingApp, 
                        publishMode: e.target.value as any,
                        status: e.target.value === 'scheduled' ? 'scheduled' : (editingApp.status === 'scheduled' ? 'published' : editingApp.status)
                      })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-850 dark:text-white cursor-pointer"
                    >
                      <option value="immediate">Immediate (Langsung Aktif)</option>
                      <option value="scheduled">Scheduled (Terjadwal pada Waktu Tertentu)</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Datetime picker when publishMode === 'scheduled' */}
                {(editingApp.publishMode === 'scheduled' || editingApp.status === 'scheduled') && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <label className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Jadwal Tanggal & Jam Penerbitan (WIB / Asia/Jakarta)
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="datetime-local"
                        value={editingApp.publishAt || ''}
                        onChange={e => setEditingApp({ ...editingApp, publishAt: e.target.value, status: 'scheduled' })}
                        className="px-3.5 py-2 bg-white dark:bg-black/40 border border-blue-500/30 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center font-medium">
                        Aplikasi akan disembunyikan sampai waktu jadwal tercapai.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-6 items-center pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={editingApp.featured}
                      onChange={e => setEditingApp({ ...editingApp, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-500 border-slate-300 dark:border-white/10 rounded"
                    />
                    <span>Tampilkan sebagai Aplikasi Featured</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={editingApp.popular}
                      onChange={e => setEditingApp({ ...editingApp, popular: e.target.checked })}
                      className="w-4 h-4 text-blue-500 border-slate-300 dark:border-white/10 rounded"
                    />
                    <span>Tampilkan sebagai Aplikasi Populer</span>
                  </label>
                </div>

                {/* Dynamic Badges Live Inspector */}
                <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Pratinjau Badges Dinamis yang Memenuhi Syarat:
                    </span>
                  </div>
                  
                  {(() => {
                    const dynamicBadges = calculateAppBadges(editingApp);
                    if (dynamicBadges.length === 0) {
                      return (
                        <p className="text-[11px] text-slate-400 italic">
                          Aplikasi saat ini tidak memenuhi aturan trigger badge khusus (standar catalog).
                        </p>
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {dynamicBadges.map((badge, bIdx) => (
                          <AppBadge
                            key={bIdx}
                            type={badge.type as AppBadgeType}
                            label={badge.label}
                            size="sm"
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-150 dark:border-white/5 pt-6">
                <div>
                  {editingApp.slug && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('detail', editingApp.slug);
                        setEditingApp(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-amber-500/20"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Pratinjau Draf Tampilan</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setEditingApp({ ...editingApp, status: 'draft', publishMode: 'immediate' });
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 50);
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <span>Simpan Draf</span>
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    <Save className="h-4 w-4" />
                    <span>{actionLoading ? 'Menyimpan...' : (editingApp.status === 'scheduled' ? 'Jadwalkan Aplikasi' : 'Simpan & Publikasikan')}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Admin Panel Main Content Layout */}
      <div className="space-y-6">
        
        {/* Dynamic Tab Body */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          
          {/* BULK EDIT MODAL */}
          {showBulkEditModal && (
            <BulkEditModal
              selectedAppIds={selectedAppIds}
              apps={apps}
              categories={categories}
              onClose={() => setShowBulkEditModal(false)}
              onSuccess={async () => {
                setShowBulkEditModal(false);
                setSelectedAppIds([]);
                setMessage({ text: 'Perubahan massal berhasil diterapkan ke database!', type: 'success' });
                await loadAllData();
              }}
            />
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3 animate-pulse">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Menghubungkan ke Cloud Firestore...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  <AdminDashboardOverview
                    onNavigateTab={(tab) => setActiveTab(tab as any)}
                    onOpenNewAppForm={() => setActiveTab('new-app')}
                    onNavigateToApp={(slug) => onNavigate('detail', slug)}
                  />
                </div>
              )}

              {/* TAB: NEW APP FORM */}
              {activeTab === 'new-app' && (
                <div className="animate-fade-in">
                  <AdminNewAppForm
                    onBack={() => setActiveTab('applications')}
                    onSuccess={async (newApp) => {
                      await loadAllData();
                      setActiveTab('applications');
                      setMessage({ text: `Aplikasi "${newApp.name}" berhasil dibuat dan disimpan di Firestore!`, type: 'success' });
                    }}
                  />
                </div>
              )}

              {/* TAB 2: APPLICATIONS LIST WITH BULK OPERATIONS */}
              {activeTab === 'applications' && (
                <AdminApplicationsView />
              )}


            </>
          )}

        </div>
      </div>

      {/* EXPORT DATASET MODAL */}
      {showExportModal && (
        <AdminExportModal
          apps={apps}
          feedbacks={feedback}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {versionManagerApp && (
        <VersionManagerModal
          app={versionManagerApp}
          isOpen={!!versionManagerApp}
          onClose={async () => {
            setVersionManagerApp(null);
            await loadAllData();
          }}
          onSaveSuccess={async () => {
            await loadAllData();
          }}
        />
      )}

      {/* In-App Confirmation Modal for Destructive & Important Actions */}
      <ConfirmDialogModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        detail={confirmDialog.detail}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        variant={confirmDialog.variant}
        loading={actionLoading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
      </div>
    </AdminLayout>
  );
}
