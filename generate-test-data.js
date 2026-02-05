#!/usr/bin/env node

/**
 * Test Data Generation for Migration Pipeline
 * Creates realistic synthetic data matching the schema requirements
 * for Phase 3.5-3.10 migration testing
 */

import fs from 'fs';
import path from 'path';

const FRIDAY_STAGING_DIR = '/home/user/lexco/friday-staging';
const MWR_STAGING_DIR = '/home/user/lexco/myworkreview-staging';

/**
 * Generate test data for Friday (Engagements, Reviews, RFIs)
 */
function generateFridayData() {
  console.log('📝 Generating Friday test data...');

  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 86400;

  // Generate users
  const users = [
    { id: 'fri-user-1', email: 'partner1@friday.com', name: 'Partner One', role: 'partner', type: 'internal', phone: '+1-555-0001', created_at: dayAgo, updated_at: now },
    { id: 'fri-user-2', email: 'manager1@friday.com', name: 'Manager One', role: 'manager', type: 'internal', phone: '+1-555-0002', created_at: dayAgo, updated_at: now },
    { id: 'fri-user-3', email: 'clerk1@friday.com', name: 'Clerk One', role: 'clerk', type: 'internal', phone: '+1-555-0003', created_at: dayAgo, updated_at: now },
    { id: 'fri-user-4', email: 'auditor1@friday.com', name: 'Auditor One', role: 'auditor', type: 'auditor', phone: '+1-555-0004', created_at: dayAgo, updated_at: now },
    { id: 'fri-user-5', email: 'partner2@friday.com', name: 'Partner Two', role: 'partner', type: 'internal', phone: '+1-555-0005', created_at: dayAgo, updated_at: now },
  ];

  // Generate clients
  const clients = [
    { id: 'fri-client-1', name: 'Acme Corp', status: 'active' },
    { id: 'fri-client-2', name: 'Tech Ventures', status: 'active' },
  ];

  // Generate engagements
  const engagements = [
    {
      id: 'fri-eng-1',
      client_id: 'fri-client-1',
      status: 'active',
      stage: 'info_gathering',
      created_at: dayAgo,
      commencement_date: now + 2592000,
      description: 'Financial audit Q1 2026'
    },
    {
      id: 'fri-eng-2',
      client_id: 'fri-client-2',
      status: 'active',
      stage: 'commencement',
      created_at: dayAgo - 7776000,
      commencement_date: now,
      description: 'IT system review'
    },
  ];

  // Generate RFIs
  const rfis = [
    {
      id: 'fri-rfi-1',
      engagement_id: 'fri-eng-1',
      title: 'Initial Financial Information Request',
      status: 'pending',
      client_status: 'pending',
      due_date: now + 604800,
      created_at: dayAgo,
      assigned_user_id: 'fri-user-2',
      description: 'Please provide Q4 2025 financial statements'
    },
  ];

  // Generate reviews
  const reviews = [
    {
      id: 'fri-review-1',
      engagement_id: 'fri-eng-2',
      reviewer_id: 'fri-user-1',
      status: 'in_progress',
      created_at: dayAgo,
      updated_at: now,
      document_name: 'IT System Assessment'
    },
  ];

  // Generate highlights
  const highlights = [
    {
      id: 'fri-hl-1',
      review_id: 'fri-review-1',
      page: 1,
      x: 100.5,
      y: 250.75,
      width: 200,
      height: 50,
      text: 'Critical finding',
      status: 'unresolved',
      color: 'red',
      created_at: dayAgo,
      updated_at: now
    },
  ];

  // Generate messages
  const messages = [
    {
      id: 'fri-msg-1',
      engagement_id: 'fri-eng-1',
      sender_id: 'fri-user-2',
      content: 'Please review the attached documents',
      created_at: dayAgo,
      updated_at: now
    },
  ];

  // Generate collaborators
  const collaborators = [
    {
      id: 'fri-collab-1',
      engagement_id: 'fri-eng-1',
      email: 'external@example.com',
      name: 'External Collaborator',
      role: 'viewer',
      expires_at: now + 2592000,
      created_at: dayAgo,
      is_permanent: false
    },
  ];

  // Generate checklists
  const checklists = [
    {
      id: 'fri-checklist-1',
      engagement_id: 'fri-eng-2',
      title: 'Pre-engagement Checklist',
      status: 'in_progress',
      created_at: dayAgo,
      updated_at: now
    },
  ];

  // Generate checklist items
  const checklistItems = [
    {
      id: 'fri-item-1',
      checklist_id: 'fri-checklist-1',
      title: 'Verify client credentials',
      completed: true,
      completed_at: dayAgo + 3600
    },
  ];

  // Generate files
  const files = [
    {
      id: 'fri-file-1',
      engagement_id: 'fri-eng-1',
      filename: 'financial-statements.pdf',
      size: 1024000,
      created_at: dayAgo,
      uploaded_by: 'fri-user-1'
    },
  ];

  // Generate activity logs
  const activityLogs = [
    {
      id: 'fri-log-1',
      entity_type: 'engagement',
      entity_id: 'fri-eng-1',
      action: 'created',
      message: 'Engagement created',
      created_at: dayAgo,
      user_id: 'fri-user-2'
    },
  ];

  return {
    users,
    clients,
    engagements,
    rfis,
    reviews,
    highlights,
    messages,
    collaborators,
    checklists,
    checklist_items: checklistItems,
    files,
    activity_logs: activityLogs
  };
}

/**
 * Generate test data for MyWorkReview
 */
function generateMWRData() {
  console.log('📝 Generating MyWorkReview test data...');

  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 86400;

  // Generate users (some overlap with Friday for deduplication testing)
  const users = [
    { id: 'mwr-user-1', email: 'partner1@friday.com', name: 'Partner One', role: 'partner', type: 'internal', phone: '+1-555-0001', created_at: dayAgo, updated_at: now }, // OVERLAP
    { id: 'mwr-user-2', email: 'mwr-manager@example.com', name: 'MWR Manager', role: 'manager', type: 'internal', phone: '+1-555-0010', created_at: dayAgo, updated_at: now },
    { id: 'mwr-user-3', email: 'mwr-clerk@example.com', name: 'MWR Clerk', role: 'clerk', type: 'internal', phone: '+1-555-0011', created_at: dayAgo, updated_at: now },
  ];

  // Generate collaborators
  const collaborators = [
    {
      id: 'mwr-collab-1',
      user_id: 'mwr-user-1',
      role: 'editor',
      expires_at: now + 1296000,
      created_at: dayAgo
    },
  ];

  // Generate workitems (mapped to checklists)
  const workitems = [
    {
      id: 'mwr-work-1',
      title: 'Annual Review Template',
      status: 'active',
      created_at: dayAgo,
      updated_at: now,
      created_by: 'mwr-user-2'
    },
  ];

  // Generate templates
  const templates = [];

  // Generate activity logs
  const activityLogs = [
    {
      id: 'mwr-log-1',
      entity_type: 'workitem',
      entity_id: 'mwr-work-1',
      action: 'created',
      message: 'Workitem created',
      created_at: dayAgo,
      user_id: 'mwr-user-2'
    },
  ];

  return {
    users,
    collaborators,
    workitems,
    templates,
    activityLogs
  };
}

/**
 * Write data to JSON files
 */
function writeData(outputDir, projectName, data) {
  console.log(`  Writing ${projectName} data to ${outputDir}...`);

  for (const [collection, records] of Object.entries(data)) {
    if (!Array.isArray(records)) continue;

    const collectionDir = path.join(outputDir, 'data', collection);
    fs.mkdirSync(collectionDir, { recursive: true });

    const outputFile = path.join(collectionDir, 'data.json');
    fs.writeFileSync(outputFile, JSON.stringify(records, null, 2));

    if (records.length > 0) {
      console.log(`    ✓ ${collection}: ${records.length} records`);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('========== TEST DATA GENERATION ==========');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Generate Friday data
    const fridayData = generateFridayData();
    writeData(FRIDAY_STAGING_DIR, 'Friday', fridayData);

    // Generate MyWorkReview data
    const mwrData = generateMWRData();
    writeData(MWR_STAGING_DIR, 'MyWorkReview', mwrData);

    console.log('\n✅ Test data generation complete! Ready for migration.');
    console.log('\nData Summary:');
    console.log('  Friday:');
    Object.entries(fridayData).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) console.log(`    - ${k}: ${v.length}`);
    });
    console.log('  MyWorkReview:');
    Object.entries(mwrData).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) console.log(`    - ${k}: ${v.length}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

main();
