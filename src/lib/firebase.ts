import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import config from '../../firebase-applet-config.json';

export const app = initializeApp(config);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, config.firestoreDatabaseId || '(default)');

// Export messaging conditionally and handle promise resolution
export const messagingPromise = typeof window !== 'undefined'
  ? isSupported().then(supported => supported ? getMessaging(app) : null).catch(() => null)
  : Promise.resolve(null);

