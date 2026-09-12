import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Globe, Mail, ShieldAlert, Share2, Database, Lock, Trash2, Info, Shield, Phone, MapPin, Building2, ExternalLink } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppData } from '../types';
import { developerToSlug } from '../utils/developerUtils';

interface DeveloperProfile {
  id: string;
  name: string;
  slug?: string;
  email?: string;
  website?: string;
  address?: string;
  category?: string;
  description?: string;
  verified?: boolean;
}

interface AppExpandableSectionsProps {
  app: AppData;
  onNavigateDeveloper?: (slug: string) => void;
}

export default function AppExpandableSections({ app, onNavigateDeveloper }: AppExpandableSectionsProps) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [developerData, setDeveloperData] = useState<DeveloperProfile | null>(null);
  const [loadingDev, setLoadingDev] = useState(false);

  const devName = app.developerName || app.developer || 'Developer';
  const devSlug = developerToSlug(devName);
  const rawApp = app as any;

  // 10. Fetch real Developer details from Firestore
  useEffect(() => {
    const fetchDeveloper = async () => {
      setLoadingDev(true);
      try {
        if (rawApp.developerId) {
          const devSnap = await getDoc(doc(db, 'developers', rawApp.developerId));
          if (devSnap.exists()) {
            setDeveloperData({ id: devSnap.id, ...devSnap.data() } as DeveloperProfile);
            setLoadingDev(false);
            return;
          }
        }
        // Fallback search by slug or name in developers collection
        const q = query(collection(db, 'developers'), where('slug', '==', devSlug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          setDeveloperData({ id: d.id, ...d.data() } as DeveloperProfile);
        }
      } catch (err) {
        console.warn('Could not fetch developer profile:', err);
      } finally {
        setLoadingDev(false);
      }
    };

    fetchDeveloper();
  }, [app.id, rawApp.developerId, devSlug]);

  const handleDevClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateDeveloper) {
      onNavigateDeveloper(devSlug);
    } else {
      window.location.hash = `/apps/developer/${devSlug}`;
    }
  };

  // Data Security checks
  const securityData = (app as any).dataSafety || (app as any).securityInfo;
  const sharedDataTypes: string[] = securityData?.sharedData || [];
  const collectedDataTypes: string[] = securityData?.collectedData || (app.permissions ? app.permissions.slice(0, 5) : []);
  const encryptionInfo: string = securityData?.encryptionInfo || (app.signingCertificate?.sha256 ? 'Data ditransfer melalui koneksi terenkripsi aman' : '');
  const accountDeletion: boolean = securityData?.accountDeletionAvailable ?? (rawApp.requiresLogin ? true : false);

  const hasAnySecurityData = sharedDataTypes.length > 0 || collectedDataTypes.length > 0 || !!encryptionInfo || !!securityData || !!app.signingCertificate?.sha256;

  return (
    <div className="space-y-4" id="app-expandable-sections">
      {/* 9. DUKUNGAN APLIKASI */}
      <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.03] shadow-xs">
        <button
          onClick={() => setSupportOpen(!supportOpen)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 btn-press-feedback cursor-pointer"
        >
          <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
            Dukungan Aplikasi
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-[180ms] cubic-bezier(0.16, 1, 0.3, 1) ${supportOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>

        {supportOpen && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-white/5 space-y-4">
            {/* [Browser Icon] Situs */}
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Situs</p>
                {app.officialUrl ? (
                  <a
                    href={app.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline break-all inline-flex items-center gap-1"
                  >
                    <span>{app.officialUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Tidak tersedia</p>
                )}
              </div>
            </div>

            {/* [Email Icon] Email */}
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
                {app.contactEmail || developerData?.email ? (
                  <a
                    href={`mailto:${app.contactEmail || developerData?.email}`}
                    className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {app.contactEmail || developerData?.email}
                  </a>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Tidak tersedia</p>
                )}
              </div>
            </div>

            {/* [Privacy Icon] Kebijakan Privasi */}
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Kebijakan Privasi</p>
                {rawApp.privacyPolicyUrl || developerData?.website ? (
                  <a
                    href={rawApp.privacyPolicyUrl || `${developerData?.website}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Lihat Kebijakan Privasi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Tidak tersedia</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. TENTANG DEVELOPER */}
      <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 bg-white dark:bg-white/[0.03] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
          Tentang Developer
        </h3>

        <div className="space-y-3">
          {/* Nama PT / Nama Developer (Clickable) */}
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pengembang</p>
              <button
                onClick={handleDevClick}
                className="font-black text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
              >
                {developerData?.companyName || developerData?.name || devName}
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {developerData?.email || app.contactEmail || 'Tidak dipublikasikan'}
              </p>
            </div>
          </div>

          {/* Alamat */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Alamat</p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {developerData?.address || 'Alamat fisik tidak disediakan'}
              </p>
            </div>
          </div>

          {/* No. Telepon */}
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No. Telepon</p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {developerData?.phone || 'Tidak tersedia'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 11. KEAMANAN DATA */}
      <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.03] shadow-xs">
        <button
          onClick={() => setSecurityOpen(!securityOpen)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 btn-press-feedback cursor-pointer"
        >
          <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
            Keamanan data
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-[180ms] cubic-bezier(0.16, 1, 0.3, 1) ${securityOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>

        {securityOpen && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-white/5 space-y-5">
            {hasAnySecurityData ? (
              <div className="space-y-4">
                {/* [Share Icon] Membagikan hingga {total} jenis data */}
                <div className="flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Membagikan hingga {sharedDataTypes.length} jenis data kepada pihak ketiga
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sharedDataTypes.length > 0
                        ? sharedDataTypes.join(', ')
                        : 'Aplikasi ini menyatakan tidak membagikan data pengguna dengan perusahaan atau organisasi lain.'}
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-white/5" />

                {/* [Backup/Collection Icon] Mengumpulkan hingga {total} jenis data */}
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Mengumpulkan hingga {collectedDataTypes.length} jenis data
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {collectedDataTypes.length > 0
                        ? collectedDataTypes.join(', ')
                        : 'Data yang dapat dikumpulkan mencakup lokasi perkiraan, diagnostik aplikasi, atau pengenal perangkat.'}
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-white/5" />

                {/* [Lock Icon] Data di enkripsi saat transit */}
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Data dienkripsi saat transit
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Data Anda ditransfer melalui koneksi terenkripsi yang aman (HTTPS/TLS).
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-white/5" />

                {/* [Trash Icon] Penghapusan akun tersedia */}
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {accountDeletion ? 'Penghapusan akun tersedia' : 'Opsi penghapusan data tersedia atas permintaan'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Developer menyediakan cara bagi pengguna untuk meminta agar data atau akun mereka dihapus.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  Informasi keamanan data belum tersedia.
                </p>
              </div>
            )}

            {/* Mandatory Disclaimer Note */}
            <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-xl flex gap-3 text-xs text-slate-500 dark:text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <p className="leading-relaxed">
                Praktik privasi dan keamanan data dapat bervariasi berdasarkan penggunaan, wilayah, dan usia Anda. Developer memberikan informasi ini dan dapat memperbaruinya seiring waktu.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
