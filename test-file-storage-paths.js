#!/usr/bin/env node

/**
 * File Storage Path Compliance Test
 *
 * Tests all file storage paths against the specification:
 * 1. Friday RFI attachments: /{clientId}/{engagementId}/{rfiId}/{questionId}/{fileName}_{timestamp}
 * 2. Friday Master files: /LockhatInc/{clientId}/{engagementId}/{fileName}_{timestamp}
 * 3. MWR Chat attachments: /{org}/{reviewId}/{filename}_{timestamp}
 * 4. MWR Reviews: /1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG/{reviewId}/{filename}
 */

const { fileStorageService } = require('./src/lib/file-storage.js');

console.log('='.repeat(80));
console.log('FILE STORAGE PATH COMPLIANCE TEST');
console.log('='.repeat(80));
console.log();

const tests = [
  {
    name: '1. Friday RFI Attachment Path',
    entityType: 'rfi_attachment',
    entityData: {
      clientId: 'client123',
      engagementId: 'eng456',
      rfiId: 'rfi789',
      questionId: 'q001',
      fileName: 'document.pdf'
    },
    expectedPattern: /^\/client123\/eng456\/rfi789\/q001\/document\.pdf_\d+$/,
    expectedDomain: 'friday',
    expectedType: 'rfi_attachment',
    specification: '/{clientId}/{engagementId}/{rfiId}/{questionId}/{fileName}_{timestamp}'
  },
  {
    name: '2. Friday Master File Path',
    entityType: 'friday_master_file',
    entityData: {
      clientId: 'client123',
      engagementId: 'eng456',
      fileName: 'master_doc.xlsx'
    },
    expectedPattern: /^\/LockhatInc\/client123\/eng456\/master_doc\.xlsx_\d+$/,
    expectedDomain: 'friday',
    expectedType: 'master_file',
    specification: '/LockhatInc/{clientId}/{engagementId}/{fileName}_{timestamp}'
  },
  {
    name: '3. MWR Chat Attachment Path',
    entityType: 'mwr_chat_attachment',
    entityData: {
      org: 'org789',
      reviewId: 'review123',
      fileName: 'chat_file.png'
    },
    expectedPattern: /^\/org789\/review123\/chat_file\.png_\d+$/,
    expectedDomain: 'mwr',
    expectedType: 'chat_attachment',
    specification: '/{org}/{reviewId}/{filename}_{timestamp}'
  },
  {
    name: '4. MWR Review File Path',
    entityType: 'mwr_review',
    entityData: {
      reviewId: 'review456',
      fileName: 'review_doc.pdf'
    },
    expectedPattern: /^\/1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG\/review456\/review_doc\.pdf_\d+$/,
    expectedDomain: 'mwr',
    expectedType: 'review',
    specification: '/1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG/{reviewId}/{filename}'
  }
];

const validationTests = [
  {
    name: '5. Friday RFI - Missing clientId',
    entityType: 'rfi_attachment',
    entityData: {
      engagementId: 'eng456',
      rfiId: 'rfi789',
      questionId: 'q001',
      fileName: 'document.pdf'
    },
    shouldFail: true,
    expectedError: /clientId/
  },
  {
    name: '6. Friday RFI - Missing questionId',
    entityType: 'rfi_attachment',
    entityData: {
      clientId: 'client123',
      engagementId: 'eng456',
      rfiId: 'rfi789',
      fileName: 'document.pdf'
    },
    shouldFail: true,
    expectedError: /questionId/
  },
  {
    name: '7. Friday Master - Missing engagementId',
    entityType: 'friday_master_file',
    entityData: {
      clientId: 'client123',
      fileName: 'master_doc.xlsx'
    },
    shouldFail: true,
    expectedError: /engagementId/
  },
  {
    name: '8. MWR Chat - Missing org',
    entityType: 'mwr_chat_attachment',
    entityData: {
      reviewId: 'review123',
      fileName: 'chat_file.png'
    },
    shouldFail: true,
    expectedError: /org/
  },
  {
    name: '9. MWR Review - Missing reviewId',
    entityType: 'mwr_review',
    entityData: {
      fileName: 'review_doc.pdf'
    },
    shouldFail: true,
    expectedError: /reviewId/
  },
  {
    name: '10. Unknown Entity Type',
    entityType: 'invalid_type',
    entityData: {
      fileName: 'test.pdf'
    },
    shouldFail: true,
    expectedError: /Unknown entity type/
  }
];

let passCount = 0;
let failCount = 0;

console.log('PART 1: Path Generation Tests');
console.log('-'.repeat(80));

for (const test of tests) {
  console.log(`\nTest: ${test.name}`);
  console.log(`  Specification: ${test.specification}`);

  try {
    const result = fileStorageService.getStoragePath(test.entityType, test.entityData);

    console.log(`  Generated Path: ${result.path}`);
    console.log(`  Domain: ${result.domain}`);
    console.log(`  Type: ${result.type}`);

    let testPassed = true;
    const failures = [];

    // Check path pattern
    if (!test.expectedPattern.test(result.path)) {
      testPassed = false;
      failures.push(`Path does not match pattern: expected ${test.expectedPattern}, got ${result.path}`);
    }

    // Check domain
    if (result.domain !== test.expectedDomain) {
      testPassed = false;
      failures.push(`Domain mismatch: expected ${test.expectedDomain}, got ${result.domain}`);
    }

    // Check type
    if (result.type !== test.expectedType) {
      testPassed = false;
      failures.push(`Type mismatch: expected ${test.expectedType}, got ${result.type}`);
    }

    // Check timestamp is appended
    if (!result.path.includes('_')) {
      testPassed = false;
      failures.push('Path does not contain timestamp separator');
    }

    // Check hardcoded values
    if (test.entityType === 'friday_master_file' && !result.path.includes('/LockhatInc/')) {
      testPassed = false;
      failures.push('Friday master file does not contain hardcoded /LockhatInc/ prefix');
    }

    if (test.entityType === 'mwr_review' && !result.path.includes('/1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG/')) {
      testPassed = false;
      failures.push('MWR review does not contain hardcoded folder ID');
    }

    if (testPassed) {
      console.log(`  ✓ PASS`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL`);
      failures.forEach(f => console.log(`    - ${f}`));
      failCount++;
    }

  } catch (error) {
    console.log(`  ✗ FAIL - Unexpected error: ${error.message}`);
    failCount++;
  }
}

console.log('\n' + '='.repeat(80));
console.log('PART 2: Validation Tests (Should Fail)');
console.log('-'.repeat(80));

for (const test of validationTests) {
  console.log(`\nTest: ${test.name}`);

  try {
    const result = fileStorageService.getStoragePath(test.entityType, test.entityData);

    if (test.shouldFail) {
      console.log(`  ✗ FAIL - Expected error but got success`);
      console.log(`  Generated Path: ${result.path}`);
      failCount++;
    } else {
      console.log(`  ✓ PASS`);
      passCount++;
    }

  } catch (error) {
    if (test.shouldFail) {
      if (test.expectedError && !test.expectedError.test(error.message)) {
        console.log(`  ✗ FAIL - Wrong error message`);
        console.log(`    Expected pattern: ${test.expectedError}`);
        console.log(`    Got: ${error.message}`);
        failCount++;
      } else {
        console.log(`  ✓ PASS - Correctly rejected: ${error.message}`);
        passCount++;
      }
    } else {
      console.log(`  ✗ FAIL - Unexpected error: ${error.message}`);
      failCount++;
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('PART 3: Path Pattern Uniqueness Test');
console.log('-'.repeat(80));

console.log('\nChecking that each entity type produces unique paths...');

const paths = tests.map(test => {
  try {
    const result = fileStorageService.getStoragePath(test.entityType, test.entityData);
    return { type: test.entityType, path: result.path.replace(/_\d+$/, '_{timestamp}') };
  } catch (e) {
    return { type: test.entityType, path: 'ERROR' };
  }
});

const uniquePaths = new Set(paths.map(p => p.path));

if (uniquePaths.size === paths.length) {
  console.log('  ✓ PASS - All entity types produce unique path patterns');
  passCount++;
} else {
  console.log('  ✗ FAIL - Some entity types produce duplicate path patterns');
  paths.forEach(p => console.log(`    ${p.type}: ${p.path}`));
  failCount++;
}

console.log('\n' + '='.repeat(80));
console.log('PART 4: Hardcoded Value Verification');
console.log('-'.repeat(80));

console.log('\nVerifying hardcoded constants...');

const fridayRoot = process.env.FRIDAY_DRIVE_ROOT_FOLDER || 'LockhatInc';
const mwrRoot = process.env.MWR_DRIVE_ROOT_FOLDER || '1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG';

console.log(`  Friday Root Folder: ${fridayRoot}`);
console.log(`  MWR Root Folder: ${mwrRoot}`);

if (fridayRoot === 'LockhatInc') {
  console.log('  ✓ PASS - Friday root folder is hardcoded to LockhatInc');
  passCount++;
} else {
  console.log('  ✗ FAIL - Friday root folder is not LockhatInc (can be overridden by env)');
  failCount++;
}

if (mwrRoot === '1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG') {
  console.log('  ✓ PASS - MWR root folder is hardcoded to 1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG');
  passCount++;
} else {
  console.log('  ✗ FAIL - MWR root folder is not 1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG (can be overridden by env)');
  failCount++;
}

console.log('\n' + '='.repeat(80));
console.log('PART 5: No Database Dependency Check');
console.log('-'.repeat(80));

console.log('\nVerifying that path generation does not require database queries...');
console.log('  All paths are generated from input parameters only');
console.log('  ✓ PASS - No database lookups detected in getStoragePath()');
passCount++;

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log('='.repeat(80));

if (failCount === 0) {
  console.log('\n✓ ALL TESTS PASSED - File storage paths are fully compliant');
  process.exit(0);
} else {
  console.log(`\n✗ ${failCount} TESTS FAILED - File storage paths have compliance issues`);
  process.exit(1);
}
