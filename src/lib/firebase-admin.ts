'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

function getServiceAccount() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
  }
  return JSON.parse(serviceAccount);
}

function initializeAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
    projectId: firebaseConfig.projectId,
  });
}

export async function getFirebaseAdmin() {
  const app = initializeAdminApp();
  return {
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}
