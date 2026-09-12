/**
 * Google AdSense Singleton Service
 * Production-ready, compliant with Google AdSense Policies & Core Web Vitals
 */

// Retrieve client ID safely from Vite env
const getRawClientId = (): string => {
  const envId = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID || 
                (import.meta as any).env?.ADSENSE_CLIENT_ID || 
                (typeof window !== 'undefined' ? (window as any).__ADSENSE_CLIENT_ID__ : '');
  return (envId || '').trim();
};

/**
 * Checks if AdSense is properly configured with a valid publisher ID.
 * Returns false if missing, empty, or using a placeholder string.
 */
export const isAdSenseConfigured = (): boolean => {
  const id = getRawClientId();
  if (!id) return false;
  if (id.includes('XXXX') || id.includes('placeholder')) return false;
  return id.startsWith('ca-pub-') || id.startsWith('pub-');
};

/**
 * Returns the normalized ca-pub-XXXX client ID string.
 */
export const getAdSenseClientId = (): string => {
  const id = getRawClientId();
  if (!id) return '';
  if (id.startsWith('pub-')) {
    return `ca-${id}`;
  }
  return id;
};

let scriptLoadedOrLoading = false;

/**
 * Loads the official Google AdSense script only once in the page lifetime.
 * Automatically supports Auto Ads if configured in AdSense console.
 */
export const loadAdSenseScript = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!isAdSenseConfigured()) return false;

  const existingScript = document.getElementById('google-adsense-script');
  if (existingScript || scriptLoadedOrLoading) {
    return true;
  }

  try {
    const clientId = getAdSenseClientId();
    const script = document.createElement('script');
    script.id = 'google-adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    document.head.appendChild(script);
    scriptLoadedOrLoading = true;
    return true;
  } catch (err) {
    console.warn('[AdSense] Failed to initialize AdSense script:', err);
    return false;
  }
};

/**
 * Safely triggers an ad unit push without throwing errors during fast SPA navigation
 * or when blocked by ad blockers.
 */
export const pushAdSenseSlot = (): void => {
  if (typeof window === 'undefined') return;
  try {
    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
  } catch (err) {
    // Silently capture adblocker or duplicate push warnings
  }
};
