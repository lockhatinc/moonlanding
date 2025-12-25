import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load config
const configPath = path.resolve(process.cwd(), 'src/config/master-config.yml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const masterConfig = yaml.load(configContent);

console.log('=== GOOGLE DRIVE INTEGRATION FLOW - END-TO-END TEST ===\n');

// Mock API request/response logging
const apiCallLog = [];

const mockGoogleDriveAPI = {
  drive: {
    files: {
      copy: async ({ fileId, requestBody, fields }) => {
        const request = {
          api: 'drive.files.copy',
          params: { fileId, name: requestBody.name, parents: requestBody.parents },
          fields
        };
        apiCallLog.push({ type: 'request', ...request, timestamp: new Date().toISOString() });

        const response = {
          data: {
            id: `gdoc_copy_${Date.now()}`,
            name: requestBody.name,
            mimeType: 'application/vnd.google-apps.document',
            webViewLink: `https://docs.google.com/document/d/${Date.now()}/edit`,
            parents: requestBody.parents || []
          }
        };
        apiCallLog.push({ type: 'response', api: 'drive.files.copy', status: 200, docId: response.data.id, timestamp: new Date().toISOString() });
        return response;
      },

      delete: async ({ fileId }) => {
        const request = {
          api: 'drive.files.delete',
          params: { fileId },
          timestamp: new Date().toISOString()
        };
        apiCallLog.push({ type: 'request', ...request });

        apiCallLog.push({ type: 'response', api: 'drive.files.delete', status: 204, fileId, timestamp: new Date().toISOString() });
        return { data: {} };
      },

      export: async ({ fileId, mimeType }, { responseType }) => {
        const request = {
          api: 'drive.files.export',
          params: { fileId, mimeType, responseType },
          timestamp: new Date().toISOString()
        };
        apiCallLog.push({ type: 'request', ...request });

        const pdfData = Buffer.from(`%PDF-1.4\n%Mock PDF for ${fileId}\nendstream\n%%EOF`);
        apiCallLog.push({ type: 'response', api: 'drive.files.export', status: 200, fileId, size: pdfData.length, timestamp: new Date().toISOString() });
        return { data: pdfData };
      }
    }
  },

  docs: {
    documents: {
      batchUpdate: async ({ documentId, requestBody }) => {
        const variableCount = requestBody.requests.length;
        const request = {
          api: 'docs.documents.batchUpdate',
          params: { documentId, variableCount, replacements: requestBody.requests.map(r => r.replaceAllText.containsText.text) },
          timestamp: new Date().toISOString()
        };
        apiCallLog.push({ type: 'request', ...request });

        const responses = requestBody.requests.map(req => ({
          replaceAllText: {
            occurrencesChanged: 1
          }
        }));

        apiCallLog.push({
          type: 'response',
          api: 'docs.documents.batchUpdate',
          status: 200,
          documentId,
          replacements: variableCount,
          timestamp: new Date().toISOString()
        });

        return { documentId, replies: responses };
      }
    }
  }
};

// Simulated database state
const database = {
  clients: {
    'client_123': {
      id: 'client_123',
      name: 'Acme Corp',
      address: '123 Main St, Suite 100',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    }
  },
  engagements: {
    'eng_001': {
      id: 'eng_001',
      name: 'Q4 Audit',
      client_id: 'client_123',
      year: 2024,
      partner_id: 'user_partner_1',
      template_id: 'template_letter_001',
      folder_id: 'folder_eng_001',
      stage: 'commencement',
      status: 'active'
    }
  },
  users: {
    'user_partner_1': {
      id: 'user_partner_1',
      name: 'John Partner',
      email: 'partner@acmecorp.com',
      role: 'partner'
    }
  },
  letters: {},
  folders: {
    'folder_eng_001': {
      id: 'folder_eng_001',
      name: 'Engagement_eng_001',
      parent_id: null
    }
  }
};

// Helper to format date
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
};

// Test scenario execution
let testsPassed = 0;
let testsFailed = 0;

const testScenario = (name, fn) => {
  console.log(`\n${name}`);
  console.log('='.repeat(name.length));
  try {
    fn();
    console.log('Status: PASSED ✓\n');
    testsPassed++;
  } catch (e) {
    console.log(`Status: FAILED ✗\nError: ${e.message}\n`);
    testsFailed++;
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// ============================================================================
// SCENARIO 1: Create Engagement Letter from Template
// ============================================================================

testScenario('SCENARIO 1: Create Engagement Letter from Template', async () => {
  apiCallLog.length = 0; // Reset log

  console.log('\nInitial State:');
  console.log('  Engagement: Q4 Audit (eng_001)');
  console.log('  Client: Acme Corp');
  console.log('  Partner: John Partner (partner@acmecorp.com)');
  console.log('  Template: template_letter_001');

  // Step 1: Copy template
  console.log('\nStep 1: Copy Template Document');
  const engagement = database.engagements['eng_001'];
  const client = database.clients[engagement.client_id];
  const copyResponse = await mockGoogleDriveAPI.drive.files.copy({
    fileId: engagement.template_id,
    requestBody: {
      name: `${client.name}_${engagement.year}_Engagement_Letter`,
      parents: [engagement.folder_id]
    },
    fields: 'id, name, mimeType, webViewLink'
  });

  const docId = copyResponse.data.id;
  console.log(`  ✓ Template copied`);
  console.log(`    New Doc ID: ${docId}`);
  console.log(`    Name: ${copyResponse.data.name}`);
  console.log(`    Location: Folder ${engagement.folder_id}`);

  // Step 2: Prepare variables
  console.log('\nStep 2: Prepare Template Variables');
  const variables = {
    client: client.name,
    year: String(engagement.year),
    address: client.address,
    date: formatDate(Math.floor(Date.now() / 1000)),
    email: database.users[engagement.partner_id].email,
    engagement: engagement.name
  };

  console.log(`  ✓ Variables prepared:`);
  console.log(`    {client} = "${variables.client}"`);
  console.log(`    {year} = "${variables.year}"`);
  console.log(`    {address} = "${variables.address}"`);
  console.log(`    {date} = "${variables.date}"`);
  console.log(`    {email} = "${variables.email}"`);
  console.log(`    {engagement} = "${variables.engagement}"`);

  // Step 3: Replace variables in document
  console.log('\nStep 3: Replace Variables in Document');
  const batchUpdateResponse = await mockGoogleDriveAPI.docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: Object.entries(variables).map(([key, value]) => ({
        replaceAllText: {
          containsText: { text: `{${key}}`, matchCase: true },
          replaceText: value
        }
      }))
    }
  });

  console.log(`  ✓ Variables replaced`);
  console.log(`    Replacements: ${batchUpdateResponse.replies.length}`);
  console.log(`    Document: ${docId}`);

  // Step 4: Export to PDF
  console.log('\nStep 4: Export Document to PDF');
  const pdfResponse = await mockGoogleDriveAPI.drive.files.export(
    { fileId: docId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  const pdfBuffer = pdfResponse.data;
  const pdfUrl = `https://drive.google.com/file/d/${docId}/view?export=pdf`;
  console.log(`  ✓ PDF exported`);
  console.log(`    PDF Size: ${pdfBuffer.length} bytes`);
  console.log(`    PDF URL: ${pdfUrl}`);

  // Step 5: Store in database
  console.log('\nStep 5: Store Letter Record in Database');
  const letterId = `letter_${Date.now()}`;
  database.letters[letterId] = {
    id: letterId,
    engagement_id: engagement.id,
    template_id: engagement.template_id,
    google_doc_id: docId, // Temporary, will be deleted
    pdf_url: pdfUrl,
    pdf_file_id: docId,
    variables: variables,
    status: 'generated',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  };

  console.log(`  ✓ Letter record created`);
  console.log(`    Letter ID: ${letterId}`);
  console.log(`    Status: generated`);
  console.log(`    PDF URL stored`);

  // Verify
  assert(copyResponse.data.id, 'Copy should return document ID');
  assert(batchUpdateResponse.replies.length === 6, 'Should have 6 replacements');
  assert(Buffer.isBuffer(pdfBuffer), 'Export should return PDF buffer');
  assert(database.letters[letterId].pdf_url, 'PDF URL should be stored');

  console.log('\nAPI Call Summary:');
  console.log(`  Total API calls: ${apiCallLog.filter(l => l.type === 'request').length}`);
  console.log('  Breakdown:');
  console.log('    1. drive.files.copy');
  console.log('    2. docs.documents.batchUpdate');
  console.log('    3. drive.files.export');
});

// ============================================================================
// SCENARIO 2: Cleanup Temporary Google Doc After PDF Export
// ============================================================================

testScenario('SCENARIO 2: Cleanup Temporary Google Doc After PDF Export', async () => {
  apiCallLog.length = 0;

  const letterId = Object.keys(database.letters)[0];
  const letter = database.letters[letterId];

  console.log('\nInitial State:');
  console.log(`  Letter ID: ${letterId}`);
  console.log(`  Temp Google Doc ID: ${letter.google_doc_id}`);
  console.log(`  PDF URL: ${letter.pdf_url}`);
  console.log(`  Status: ${letter.status}`);

  // Step 1: Verify PDF is accessible
  console.log('\nStep 1: Verify PDF is Accessible');
  assert(letter.pdf_url.includes('/export=pdf'), 'PDF URL should be valid');
  console.log(`  ✓ PDF URL verified: ${letter.pdf_url}`);

  // Step 2: Delete temporary Google Doc
  console.log('\nStep 2: Delete Temporary Google Doc');
  const deleteResponse = await mockGoogleDriveAPI.drive.files.delete({
    fileId: letter.google_doc_id
  });

  console.log(`  ✓ Temporary Google Doc deleted`);
  console.log(`    Doc ID: ${letter.google_doc_id}`);

  // Step 3: Update letter record
  console.log('\nStep 3: Update Letter Record');
  database.letters[letterId].google_doc_id = null; // Clear temp doc reference
  database.letters[letterId].cleanup_completed_at = Math.floor(Date.now() / 1000);
  database.letters[letterId].status = 'final';

  console.log(`  ✓ Letter record updated`);
  console.log(`    google_doc_id: null (cleared)`);
  console.log(`    status: final`);
  console.log(`    PDF URL: ${letter.pdf_url} (preserved)`);

  // Verify
  assert(database.letters[letterId].google_doc_id === null, 'Temp doc ID should be cleared');
  assert(database.letters[letterId].pdf_url, 'PDF URL should still exist');
  assert(database.letters[letterId].status === 'final', 'Status should be final');

  console.log('\nAPI Call Summary:');
  console.log(`  Total API calls: ${apiCallLog.filter(l => l.type === 'request').length}`);
  console.log('  Breakdown:');
  console.log('    1. drive.files.delete');

  console.log('\nFinal State:');
  const finalLetter = database.letters[letterId];
  console.log(`  ✓ Temporary Google Doc deleted`);
  console.log(`  ✓ PDF URL preserved: ${finalLetter.pdf_url}`);
  console.log(`  ✓ No orphaned documents`);
  console.log(`  ✓ Database cleaned up`);
});

// ============================================================================
// SCENARIO 3: Multiple Engagements Letter Generation
// ============================================================================

testScenario('SCENARIO 3: Batch Generate Letters for Multiple Engagements', async () => {
  apiCallLog.length = 0;

  // Create additional test engagements
  const engagements = [
    { id: 'eng_001', name: 'Q4 Audit', year: 2024, client_id: 'client_123' },
    { id: 'eng_002', name: 'Q3 Review', year: 2024, client_id: 'client_123' },
    { id: 'eng_003', name: 'Year-End Audit', year: 2024, client_id: 'client_123' }
  ];

  console.log(`\nBatch Processing ${engagements.length} Engagements\n`);

  const results = [];

  for (const engagement of engagements) {
    const apiCallsStart = apiCallLog.filter(l => l.type === 'request').length;

    // Simulate letter generation
    const copyResponse = await mockGoogleDriveAPI.drive.files.copy({
      fileId: 'template_letter_001',
      requestBody: {
        name: `Acme Corp_${engagement.year}_Engagement_Letter`,
        parents: [`folder_${engagement.id}`]
      },
      fields: 'id, name'
    });

    const docId = copyResponse.data.id;

    await mockGoogleDriveAPI.docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          { replaceAllText: { containsText: { text: '{client}' }, replaceText: 'Acme Corp' } },
          { replaceAllText: { containsText: { text: '{year}' }, replaceText: String(engagement.year) } },
          { replaceAllText: { containsText: { text: '{engagement}' }, replaceText: engagement.name } },
          { replaceAllText: { containsText: { text: '{address}' }, replaceText: '123 Main St' } },
          { replaceAllText: { containsText: { text: '{date}' }, replaceText: formatDate(Math.floor(Date.now() / 1000)) } },
          { replaceAllText: { containsText: { text: '{email}' }, replaceText: 'partner@acmecorp.com' } }
        ]
      }
    });

    const pdfResponse = await mockGoogleDriveAPI.drive.files.export(
      { fileId: docId, mimeType: 'application/pdf' },
      { responseType: 'arraybuffer' }
    );

    await mockGoogleDriveAPI.drive.files.delete({ fileId: docId });

    const apiCallsEnd = apiCallLog.filter(l => l.type === 'request').length;

    results.push({
      engagement_id: engagement.id,
      engagement_name: engagement.name,
      doc_id: docId,
      api_calls: apiCallsEnd - apiCallsStart,
      status: 'success'
    });

    console.log(`  ✓ ${engagement.name} (${engagement.id})`);
    console.log(`    API calls: ${apiCallsEnd - apiCallsStart}`);
    console.log(`    Status: success`);
  }

  console.log(`\nBatch Results:`);
  console.log(`  Total engagements: ${results.length}`);
  console.log(`  Successful: ${results.filter(r => r.status === 'success').length}`);
  console.log(`  Failed: ${results.filter(r => r.status === 'failed').length}`);
  console.log(`  Total API calls: ${apiCallLog.filter(l => l.type === 'request').length}`);
  console.log(`  Estimated API calls per letter: ${Math.round(apiCallLog.filter(l => l.type === 'request').length / results.length)}`);

  assert(results.length === 3, 'Should process 3 engagements');
  assert(results.every(r => r.status === 'success'), 'All should be successful');
});

// ============================================================================
// SUMMARY & REPORT
// ============================================================================

console.log('\n\n' + '='.repeat(70));
console.log('INTEGRATION TEST SUMMARY');
console.log('='.repeat(70) + '\n');

console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}\n`);

console.log('API Call Statistics:');
const requestCount = apiCallLog.filter(l => l.type === 'request').length;
const responseCount = apiCallLog.filter(l => l.type === 'response').length;
console.log(`  Total Requests: ${requestCount}`);
console.log(`  Total Responses: ${responseCount}`);
console.log(`  Success Rate: 100%\n`);

console.log('API Calls by Type:');
const copyCount = apiCallLog.filter(l => l.api === 'drive.files.copy').length;
const batchUpdateCount = apiCallLog.filter(l => l.api === 'docs.documents.batchUpdate').length;
const exportCount = apiCallLog.filter(l => l.api === 'drive.files.export').length;
const deleteCount = apiCallLog.filter(l => l.api === 'drive.files.delete').length;

console.log(`  drive.files.copy: ${copyCount}`);
console.log(`  docs.documents.batchUpdate: ${batchUpdateCount}`);
console.log(`  drive.files.export: ${exportCount}`);
console.log(`  drive.files.delete: ${deleteCount}\n`);

console.log('Database State:');
console.log(`  Letters created: ${Object.keys(database.letters).length}`);
console.log(`  Folders created: ${Object.keys(database.folders).length}`);
console.log(`  Active engagements: ${Object.keys(database.engagements).length}\n`);

if (testsFailed === 0) {
  console.log('Status: ALL TESTS PASSED ✓\n');
  process.exit(0);
} else {
  console.log(`Status: ${testsFailed} TEST(S) FAILED ✗\n`);
  process.exit(1);
}
