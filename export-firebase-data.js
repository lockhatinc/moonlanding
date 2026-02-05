#!/usr/bin/env node

/**
 * Firebase Data Export Script
 * Exports Firestore data from friday-staging and myworkreview-staging
 * into JSON format for the migration pipeline
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIDAY_STAGING_DIR = '/home/user/lexco/friday-staging';
const MWR_STAGING_DIR = '/home/user/lexco/myworkreview-staging';

/**
 * Export Collections from a Firebase project
 */
async function exportFirebaseData(projectDir, outputDir, projectName) {
  console.log(`\n📤 Exporting ${projectName} data...`);

  // Initialize Firebase Admin SDK
  const credentialsPath = path.join(projectDir, `${projectName.toLowerCase()}-credentials/service-account.json`);

  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ Service account not found: ${credentialsPath}`);
    return false;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

  // Initialize app
  const appName = `export-${projectName}-${Date.now()}`;
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }, appName);

  const db = admin.firestore(app);

  try {
    // Collections to export
    const collections = projectName === 'friday'
      ? ['users', 'clients', 'engagements', 'rfis', 'reviews', 'messages', 'collaborators', 'checklists', 'files', 'activityLogs']
      : ['users', 'collaborators', 'workitems', 'templates', 'activityLogs'];

    for (const collection of collections) {
      console.log(`  Exporting ${collection}...`);

      const collectionDir = path.join(outputDir, 'data', collection);
      fs.mkdirSync(collectionDir, { recursive: true });

      const snapshot = await db.collection(collection).get();
      const docs = [];

      for (const doc of snapshot.docs) {
        docs.push({
          id: doc.id,
          ...doc.data(),
        });
      }

      const outputFile = path.join(collectionDir, 'data.json');
      fs.writeFileSync(outputFile, JSON.stringify(docs, null, 2));
      console.log(`    ✓ ${docs.length} records exported`);
    }

    console.log(`✅ ${projectName} export complete`);
    return true;

  } catch (error) {
    console.error(`❌ Export failed: ${error.message}`);
    return false;

  } finally {
    // Clean up
    await app.delete();
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('========== FIREBASE DATA EXPORT ==========');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Export Friday
    const fridaySuccess = await exportFirebaseData(FRIDAY_STAGING_DIR, FRIDAY_STAGING_DIR, 'friday');

    // Export MyWorkReview
    const mwrSuccess = await exportFirebaseData(MWR_STAGING_DIR, MWR_STAGING_DIR, 'myworkreview');

    if (fridaySuccess && mwrSuccess) {
      console.log('\n✅ All exports complete! Ready for migration.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some exports failed. Please check the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
