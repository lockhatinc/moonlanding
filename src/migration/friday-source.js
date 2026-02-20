// Friday Firebase source - reads from friday-staging-lockhat Firestore
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const FRIDAY_SA = '/config/workspace/friday-staging/friday-staging-credentials/functions/serviceAccountKey.json';
const FRIDAY_FUNCTIONS = '/config/workspace/friday-staging/functions';

const COLLECTIONS = [
  'friday/users/list',
  'friday/clients/list',
  'friday/engagements/list',
  'friday/teams/list',
  'friday/rfis/list',
  'friday/templates/list',
];

export async function fetchFridayData(limit = null) {
  const adminPath = `${FRIDAY_FUNCTIONS}/node_modules/firebase-admin`;
  const admin = require(adminPath);
  const sa = require(FRIDAY_SA);

  const appName = `friday-${Date.now()}`;
  const app = admin.initializeApp({ credential: admin.credential.cert(sa) }, appName);
  const db = app.firestore();

  const result = {};
  try {
    for (const col of COLLECTIONS) {
      let query = db.collection(col);
      if (limit) query = query.limit(limit);
      const snap = await query.get();
      result[col] = snap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      console.log(`  Friday ${col}: ${result[col].length} docs`);
    }
  } finally {
    await app.delete();
  }
  return result;
}
