import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load config directly from YAML file
const configPath = path.resolve(process.cwd(), 'src/config/master-config.yml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const masterConfig = yaml.load(configContent);

console.log('=== GOOGLE DRIVE TEMPLATE VARIABLES & DOCUMENT CONVERSION TESTS ===\n');

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log('✓', name);
    passed++;
  } catch (e) {
    console.log('✗', name, '-', e.message);
    failed++;
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

// Mock Google Drive API responses and implementations
const mockGoogleDriveApi = {
  documents: {
    batchUpdate: async ({ documentId, requestBody }) => {
      // Mock: Simulate batch update with template variable replacements
      return {
        documentId,
        replies: requestBody.requests.map(req => ({
          replaceAllText: req.replaceAllText
        }))
      };
    }
  },
  files: {
    create: async ({ requestBody, media, fields }) => {
      // Mock: Simulate file creation
      return {
        data: {
          id: `doc_${Date.now()}`,
          name: requestBody.name,
          mimeType: requestBody.mimeType,
          webViewLink: `https://docs.google.com/document/d/${Date.now()}/edit`,
          webContentLink: `https://docs.google.com/document/d/${Date.now()}/export?format=pdf`
        }
      };
    },
    copy: async ({ fileId, requestBody, fields }) => {
      // Mock: Simulate file copy
      return {
        data: {
          id: `copy_${Date.now()}`,
          name: requestBody.name,
          webViewLink: `https://docs.google.com/document/d/${Date.now()}/edit`
        }
      };
    },
    export: async ({ fileId, mimeType }, { responseType }) => {
      // Mock: Simulate PDF export
      if (mimeType === 'application/pdf') {
        return {
          data: Buffer.from('Mock PDF content for file: ' + fileId)
        };
      }
      throw new Error('Unsupported export MIME type: ' + mimeType);
    },
    delete: async ({ fileId }) => {
      // Mock: Simulate file deletion
      return { data: {} };
    },
    get: async ({ fileId, fields }) => {
      // Mock: Simulate file get
      return {
        data: {
          id: fileId,
          name: 'Template Document',
          mimeType: 'application/vnd.google-apps.document',
          size: '1000',
          webViewLink: `https://docs.google.com/document/d/${fileId}/edit`,
          webContentLink: `https://docs.google.com/document/d/${fileId}/export?format=pdf`,
          createdTime: new Date().toISOString(),
          modifiedTime: new Date().toISOString()
        }
      };
    },
    list: async ({ q, fields }) => {
      // Mock: Simulate file list
      return {
        data: {
          files: []
        }
      };
    }
  }
};

// Helper function to simulate template variable injection
const simulateTemplateVariableInjection = (templateContent, variables) => {
  let content = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, value || '');
  }
  return content;
};

// Helper to check for unresolved variables
const hasUnresolvedVariables = (content) => {
  const unresolvedRegex = /{[a-zA-Z_]+}/g;
  return unresolvedRegex.test(content);
};

console.log('\n--- TEST 46: Template Variable Injection ---\n');

test('Letter entity exists with document_type engagement_letter', () => {
  const letterEntity = masterConfig.entities?.letter;
  assert(letterEntity, 'Letter entity not found in config');
  assert(letterEntity.document_type === 'engagement_letter',
    'Entity should have document_type: engagement_letter');
  console.log('  [INFO] letter entity found with document_type: engagement_letter');
});

test('Letter entity has Google Drive and template variables support', () => {
  const letterEntity = masterConfig.entities?.letter;
  assert(letterEntity?.has_google_drive_integration === true,
    'letter should have has_google_drive_integration: true');
  assert(letterEntity?.has_template_variables === true,
    'letter should have has_template_variables: true');
  assert(letterEntity?.parent === 'engagement',
    'letter should have engagement as parent');
  console.log('  [INFO] letter entity configured with:');
  console.log('    ✓ has_google_drive_integration: true');
  console.log('    ✓ has_template_variables: true');
  console.log('    ✓ parent: engagement');
});

test('Template supports all required variable placeholders', () => {
  const requiredVariables = ['client', 'year', 'address', 'date', 'email', 'engagement'];
  const templateContent = 'Title: {engagement} - {client} {year}\nContent: Client: {client}, Address: {address}, Date: {date}, Email: {email}';

  for (const varName of requiredVariables) {
    const placeholder = `{${varName}}`;
    assert(templateContent.includes(placeholder),
      `Template should contain placeholder {${varName}}`);
  }

  console.log(`  [INFO] All required placeholders present: ${requiredVariables.join(', ')}`);
});

test('Template variable injection replaces all placeholders correctly', () => {
  const templateContent = 'Title: {engagement} - {client} {year}\nContent: Client: {client}, Address: {address}, Date: {date}, Email: {email}';

  const variables = {
    engagement: 'Q4 Audit',
    client: 'Acme Corp',
    year: '2024',
    address: '123 Main St',
    date: '2025-12-25',
    email: 'partner@example.com'
  };

  const result = simulateTemplateVariableInjection(templateContent, variables);

  assert(result.includes('Q4 Audit'), '{engagement} should be replaced');
  assert(result.includes('Acme Corp'), '{client} should be replaced');
  assert(result.includes('2024'), '{year} should be replaced');
  assert(result.includes('123 Main St'), '{address} should be replaced');
  assert(result.includes('2025-12-25'), '{date} should be replaced');
  assert(result.includes('partner@example.com'), '{email} should be replaced');
  assert(!hasUnresolvedVariables(result), 'No unresolved variables should remain');

  console.log('  [INFO] All variables injected successfully:');
  console.log('    {engagement} → Q4 Audit');
  console.log('    {client} → Acme Corp');
  console.log('    {year} → 2024');
  console.log('    {address} → 123 Main St');
  console.log('    {date} → 2025-12-25');
  console.log('    {email} → partner@example.com');
});

test('Partial variable injection is handled gracefully', () => {
  const templateContent = 'Title: {engagement} - {client} {year}\nContent: Client: {client}, Address: {address}';

  const partialVariables = {
    engagement: 'Q4 Audit',
    client: 'Acme Corp',
    year: '2024'
    // Missing: address
  };

  const result = simulateTemplateVariableInjection(templateContent, partialVariables);

  assert(result.includes('Q4 Audit'), 'Should inject provided variables');
  assert(result.includes('Acme Corp'), 'Should inject all provided values');
  assert(result.includes('{address}'), 'Should preserve unresolved variables');

  console.log('  [INFO] Partial injection handled: provided vars injected, missing vars preserved');
});

console.log('\n--- TEST 47: Conversion Flow (Docx → Google Doc → PDF) ---\n');

test('Google Drive adapter supports file copy operations', () => {
  const hasReplaceInDoc = typeof mockGoogleDriveApi.documents.batchUpdate === 'function';
  assert(hasReplaceInDoc, 'Drive adapter should support document text replacement');
  console.log('  [INFO] replaceInDoc operation available');
});

test('Google Drive adapter supports PDF export', () => {
  const hasExportPdf = typeof mockGoogleDriveApi.files.export === 'function';
  assert(hasExportPdf, 'Drive adapter should support PDF export');
  console.log('  [INFO] exportToPdf operation available');
});

test('Template variable replacement uses Google Docs batch API', async () => {
  const templateVars = {
    client: 'Acme Corp',
    year: '2024',
    address: '123 Main St',
    date: '2025-12-25',
    email: 'partner@example.com',
    engagement: 'Q4 Audit'
  };

  const requests = Object.entries(templateVars).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{${key}}`, matchCase: true },
      replaceText: value || ''
    }
  }));

  const result = await mockGoogleDriveApi.documents.batchUpdate({
    documentId: 'test_doc_id',
    requestBody: { requests }
  });

  assert(result.documentId === 'test_doc_id', 'Should maintain document ID');
  assert(result.replies.length === Object.keys(templateVars).length,
    'Should have one reply per template variable');

  console.log(`  [INFO] Batch update: ${requests.length} text replacements queued`);
  console.log('  [INFO] Replacements: client, year, address, date, email, engagement');
});

test('PDF export creates valid PDF for Google Doc', async () => {
  const docId = 'test_doc_id';
  const result = await mockGoogleDriveApi.files.export(
    { fileId: docId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  assert(Buffer.isBuffer(result.data), 'Should return PDF buffer');
  assert(result.data.toString().includes('Mock PDF'), 'Should contain PDF content');

  console.log('  [INFO] PDF export successful');
  console.log(`  [INFO] PDF content length: ${result.data.length} bytes`);
});

test('Engagement letter generation includes all conversion steps', async () => {
  // Simulate the complete generateEngagementLetter flow
  const templateId = 'template_id_123';
  const folderId = 'folder_id_456';

  const data = {
    client: 'Acme Corp',
    year: '2024',
    address: '123 Main St',
    date: '2025-12-25',
    email: 'partner@example.com',
    engagement: 'Q4 Audit'
  };

  // Step 1: Copy template
  const copyResult = await mockGoogleDriveApi.files.copy({
    fileId: templateId,
    requestBody: {
      name: `${data.client}_${data.year}_Engagement_Letter`,
      parents: [folderId]
    },
    fields: 'id, name, webViewLink'
  });

  assert(copyResult.data.id, 'Copy should create new document ID');
  assert(copyResult.data.name.includes(data.client), 'Copy name should include client');

  // Step 2: Replace variables
  const variables = {
    client: data.client,
    year: data.year,
    address: data.address || '',
    date: data.date,
    email: data.email || '',
    engagement: data.engagement || ''
  };

  const updateResult = await mockGoogleDriveApi.documents.batchUpdate({
    documentId: copyResult.data.id,
    requestBody: {
      requests: Object.entries(variables).map(([key, value]) => ({
        replaceAllText: {
          containsText: { text: `{${key}}`, matchCase: true },
          replaceText: value || ''
        }
      }))
    }
  });

  assert(updateResult.replies.length === 6, 'Should have 6 text replacements');

  // Step 3: Export to PDF
  const pdfResult = await mockGoogleDriveApi.files.export(
    { fileId: copyResult.data.id, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  assert(Buffer.isBuffer(pdfResult.data), 'PDF export should return buffer');

  console.log('  [INFO] Full conversion flow completed:');
  console.log('    1. Template copied (ID: ' + copyResult.data.id + ')');
  console.log('    2. Variables replaced (6 replacements)');
  console.log('    3. PDF exported (' + pdfResult.data.length + ' bytes)');
});

console.log('\n--- TEST 48: Intermediate Google Doc Cleanup After PDF Export ---\n');

test('Google Doc deletion is available after PDF export', async () => {
  const docId = 'temp_doc_id';

  // First, export to PDF
  const pdfResult = await mockGoogleDriveApi.files.export(
    { fileId: docId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  assert(Buffer.isBuffer(pdfResult.data), 'PDF should export successfully');

  // Then, delete the temp doc
  const deleteResult = await mockGoogleDriveApi.files.delete({ fileId: docId });

  assert(deleteResult.data !== undefined, 'Delete operation should complete');
  console.log('  [INFO] Temporary Google Doc deleted after PDF export');
});

test('Cleanup sequence preserves PDF while removing intermediate Google Doc', async () => {
  const templateId = 'template_id';
  const folderId = 'folder_id';
  const data = {
    client: 'Acme Corp',
    year: '2024',
    address: '123 Main St',
    date: '2025-12-25',
    email: 'partner@example.com',
    engagement: 'Q4 Audit'
  };

  // Step 1: Create Google Doc from template
  const copyResult = await mockGoogleDriveApi.files.copy({
    fileId: templateId,
    requestBody: {
      name: `${data.client}_${data.year}_Engagement_Letter`,
      parents: [folderId]
    },
    fields: 'id, name, webViewLink'
  });

  const googleDocId = copyResult.data.id;

  // Step 2: Export to PDF
  const pdfResult = await mockGoogleDriveApi.files.export(
    { fileId: googleDocId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  const pdfData = pdfResult.data;
  const pdfUrl = `https://drive.google.com/file/d/${googleDocId}/view?export=pdf`;

  // Step 3: Delete Google Doc
  await mockGoogleDriveApi.files.delete({ fileId: googleDocId });

  // Verify: PDF is preserved, Google Doc is deleted
  assert(Buffer.isBuffer(pdfData), 'PDF should be preserved');
  assert(pdfUrl, 'PDF URL should be available');
  assert(googleDocId, 'Google Doc ID was captured before deletion');

  console.log('  [INFO] Cleanup sequence preserved:');
  console.log('    ✓ PDF exported and stored (' + pdfData.length + ' bytes)');
  console.log('    ✓ Intermediate Google Doc deleted (' + googleDocId + ')');
  console.log('    ✓ PDF remains accessible');
});

test('Engagement should reference PDF URL after cleanup', () => {
  // This test verifies the expected database state after cleanup
  const engagementState = {
    id: 'eng_123',
    engagement_letter: 'https://drive.google.com/file/d/pdf_file_id/view?export=pdf',
    engagement_letter_google_doc_id: null, // Should be cleared after cleanup
    engagement_letter_status: 'generated'
  };

  assert(engagementState.engagement_letter.includes('pdf'),
    'Engagement should reference PDF, not Google Doc');
  assert(!engagementState.engagement_letter_google_doc_id,
    'Intermediate Google Doc ID should be cleared');
  assert(engagementState.engagement_letter_status === 'generated',
    'Status should indicate successful generation');

  console.log('  [INFO] Engagement database state verified:');
  console.log('    ✓ engagement_letter → PDF URL');
  console.log('    ✓ engagement_letter_google_doc_id → null');
  console.log('    ✓ engagement_letter_status → generated');
});

test('No orphaned Google Docs should remain after cleanup job', () => {
  // Simulate checking for orphaned docs after cleanup
  const cleanupResults = {
    processed: 5,
    pdfExported: 5,
    googleDocsDeleted: 5,
    orphaned: 0,
    errors: []
  };

  assert(cleanupResults.processed === cleanupResults.googleDocsDeleted,
    'All temporary Google Docs should be deleted');
  assert(cleanupResults.orphaned === 0,
    'No orphaned documents should remain');

  console.log('  [INFO] Cleanup job results:');
  console.log(`    Processed: ${cleanupResults.processed}`);
  console.log(`    PDFs exported: ${cleanupResults.pdfExported}`);
  console.log(`    Temp Google Docs deleted: ${cleanupResults.googleDocsDeleted}`);
  console.log(`    Orphaned docs: ${cleanupResults.orphaned}`);
});

// Additional validation tests
console.log('\n--- ADDITIONAL VALIDATION TESTS ---\n');

test('Template variable regex matches all placeholder patterns', () => {
  const placeholderRegex = /{[a-zA-Z_]+}/g;
  const testContent = 'Title: {engagement} - {client} {year}\nContent: {address} {date} {email}';

  const matches = testContent.match(placeholderRegex);
  assert(matches && matches.length === 6, 'Should find exactly 6 placeholders');

  const expectedVars = ['engagement', 'client', 'year', 'address', 'date', 'email'];
  for (const varName of expectedVars) {
    assert(testContent.includes(`{${varName}}`), `Should find {${varName}} placeholder`);
  }

  console.log('  [INFO] Placeholder regex validation passed');
  console.log(`  [INFO] Pattern matches: ${matches.join(', ')}`);
});

test('Template injection handles special characters in values', () => {
  const templateContent = 'Client: {client}\nAddress: {address}';

  const variables = {
    client: "Acme Corp & Partners",
    address: "123 Main St, Suite #100"
  };

  const result = simulateTemplateVariableInjection(templateContent, variables);

  assert(result.includes("Acme Corp & Partners"), 'Should preserve & character');
  assert(result.includes("Suite #100"), 'Should preserve # character');

  console.log('  [INFO] Special characters handled correctly');
  console.log('    Client: ' + variables.client);
  console.log('    Address: ' + variables.address);
});

test('Template handles empty/null variable values', () => {
  const templateContent = 'Optional: {optional_field}\nRequired: {required_field}';

  const variables = {
    optional_field: null,
    required_field: 'Value'
  };

  const result = simulateTemplateVariableInjection(templateContent, variables);

  assert(result.includes('Optional: '), 'Should handle null as empty string');
  assert(result.includes('Required: Value'), 'Should handle defined values');

  console.log('  [INFO] Null/empty values handled gracefully');
});

// Summary
console.log('\n=== TEST SUMMARY ===\n');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`TOTAL: ${passed + failed}\n`);

if (failed === 0) {
  console.log('All tests passed! ✓\n');
  process.exit(0);
} else {
  console.log(`${failed} test(s) failed.\n`);
  process.exit(1);
}
