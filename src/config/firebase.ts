import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  Auth,
  getAuth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In React Native Metro bundler, getReactNativePersistence is provided by firebase/auth react-native entry
declare const process: any;
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence?: (storage: any) => any;
};

export const firebaseConfig = {
  // Use the Firebase API key supplied by the user as the web config value
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA_USER_KEY_PLACEHOLDER',
  authDomain: 'hospital-bf28e.firebaseapp.com',
  projectId: 'hospital-bf28e',
  storageBucket: 'hospital-bf28e.firebasestorage.app',
  messagingSenderId: '279046839743',
  appId: '1:279046839743:web:436bfc0221c8354c1a550a',
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  const currentApp = getFirebaseApp();
  if (!auth) {
    try {
      if (typeof getReactNativePersistence === 'function') {
        auth = initializeAuth(currentApp, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } else {
        auth = getAuth(currentApp);
      }
    } catch {
      auth = getAuth(currentApp);
    }
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  const currentApp = getFirebaseApp();
  if (!firestore) {
    firestore = getFirestore(currentApp);
  }
  return firestore;
}
