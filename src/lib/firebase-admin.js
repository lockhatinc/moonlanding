import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let auth = null;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (serviceAccountKey && projectId) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    if (!getApps().length && serviceAccount.project_id) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId
      });
      auth = getAuth();
    }
  }
} catch (error) {
  console.warn('[Firebase Admin] Failed to initialize:', error.message);
}

export { auth };
