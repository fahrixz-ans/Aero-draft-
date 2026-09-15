import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';
import { auth } from './lib/firebase';

// Inject Firebase ID Token into every local /api/* fetch request
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: async function (input: RequestInfo | URL, init?: RequestInit) {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as any).url;
      }

      // Check if it is an API request
      if (url.startsWith('/api/') || (url.startsWith(window.location.origin) && url.includes('/api/'))) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            init = init || {};
            const headers = new Headers(init.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            init.headers = headers;
          } catch (err) {
            console.warn('Failed to retrieve Firebase ID token for fetch request:', err);
          }
        }
      }
      return originalFetch(input, init);
    }
  });
} catch (e) {
  console.warn('Failed to override window.fetch using Object.defineProperty. Attempting direct fallback:', e);
  try {
    (window as any).fetch = async function (input: any, init: any) {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as any).url;
      }

      if (url.startsWith('/api/') || (url.startsWith(window.location.origin) && url.includes('/api/'))) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            init = init || {};
            const headers = new Headers(init.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            init.headers = headers;
          } catch (err) {
            console.warn('Failed to retrieve Firebase ID token for fetch request in fallback:', err);
          }
        }
      }
      return originalFetch(input, init);
    };
  } catch (err) {
    console.error('Completely unable to override window.fetch in this environment:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
