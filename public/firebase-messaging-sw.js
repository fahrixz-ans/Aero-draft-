// Service Worker for Firebase Cloud Messaging (FCM) v1 support
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

// Initialize Firebase in the Service Worker using the provided config keys
firebase.initializeApp({
  apiKey: "AIzaSyCVpKqKNvJvC4vqWr9RMW8mj1H23tdT2-0",
  authDomain: "aero-apk-6d2bc.firebaseapp.com",
  projectId: "aero-apk-6d2bc",
  storageBucket: "aero-apk-6d2bc.firebasestorage.app",
  messagingSenderId: "970327467039",
  appId: "1:970327467039:web:9e2c33770e9455d4fd612a",
  measurementId: "G-9NT7E1SD4T"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'Aero APK';
  const notificationOptions = {
    body: payload.notification?.body || 'Anda mendapatkan pemberitahuan baru!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
