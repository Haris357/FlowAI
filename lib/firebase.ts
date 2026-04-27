import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// In the browser, force authDomain to match the current page's origin.
// next.config.js reverse-proxies /__/auth/* to the Firebase project, so the
// handler lives on the same origin as the app — no third-party storage,
// signInWithRedirect works in modern Chrome on localhost AND production.
// On the server, fall back to the env value (used only for SSR/admin checks).
const authDomain =
  typeof window !== 'undefined'
    ? window.location.host
    : process.env.FIREBASE_AUTH_DOMAIN;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;