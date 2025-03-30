import * as admin from 'firebase-admin';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Check all required environment variables
const requiredEnvVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
} as const;

// Validate environment variables and assign types
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyBase = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKeyBase) {
  console.error('Missing Firebase Admin env vars:', {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKeyBase
  });
  throw new Error('Missing required Firebase Admin environment variables');
}

console.log('Firebase Admin initializing with project ID:', projectId);

// Format private key
const privateKey = privateKeyBase.includes('\\n')
  ? privateKeyBase.replace(/\\n/g, '\n')
  : privateKeyBase;

// Initialize Firebase Admin
const getFirebaseApp = () => {
  if (getApps().length > 0) {
    const app = getApp();
    console.log('Reusing existing Firebase Admin app');
    return app;
  }

  const config = {
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    } as admin.ServiceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`
  };
    
  console.log('Initializing Firebase Admin with project:', projectId);
    
  return initializeApp(config);
};

// Initialize app and Firestore with error handling
let db: Firestore;
try {
  const app = getFirebaseApp();
  db = getFirestore(app);
  console.log('Firebase Admin Firestore initialized successfully for project:', projectId);
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

export { db }; 