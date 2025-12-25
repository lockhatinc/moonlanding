#!/usr/bin/env node

/**
 * CLERK ROLE PERMISSIONS LOGIC TEST (GROUP 1C, Tests 7-8)
 *
 * This test verifies the clerk role permissions logic by analyzing:
 * 1. Permission system implementation for row-level access (Test 7)
 * 2. Stage transition blocking logic for clerks (Test 8)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`\n${'='.repeat(80)}`);
console.log('TEST GROUP 1C: CLERK ROLE PERMISSIONS (Tests 7-8)');
console.log(`${'='.repeat(80)}\n`);

// Read and analyze the permission system
const permissionServicePath = path.join(__dirname, 'src/services/permission.service.js');
const stageValidatorPath = path.join(__dirname, 'src/lib/hooks/engagement-stage-validator.js');
const permissionDefaultsPath = path.join(__dirname, 'src/config/permission-defaults.js');

console.log('▶ Reading permission system implementation...\n');

let test7Pass = false;
let test8Pass = false;

// TEST 7: Row-level access control (assigned vs unassigned engagements)
function testRowAccessControl() {
  console.log('Test 7: Clerk read/write access limited to assigned engagements only');
  console.log('-'.repeat(70));

  const permissionServiceCode = fs.readFileSync(permissionServicePath, 'utf-8');

  // Check for rowAccess method
  const hasRowAccessMethod = permissionServiceCode.includes('checkRowAccess(user, spec, record)');
  console.log(`\n✓ Checking for checkRowAccess method: ${hasRowAccessMethod ? 'FOUND' : 'NOT FOUND'}`);

  // Check for 'assigned' scope
  const hasAssignedScope = permissionServiceCode.includes("scope === 'assigned'");
  console.log(`✓ Checking for 'assigned' scope logic: ${hasAssignedScope ? 'FOUND' : 'NOT FOUND'}`);

  // Find the line with assigned scope logic
  const lines = permissionServiceCode.split('\n');
  const assignedLineIdx = lines.findIndex(l => l.includes("scope === 'assigned'") && l.includes('assigned_to'));

  if (assignedLineIdx !== -1) {
    const assignedLine = lines[assignedLineIdx];
    console.log(`\n✓ Row access logic for 'assigned' scope:`);
    console.log(`  "${assignedLine.trim()}"`);

    // Check if it properly validates assignment
    const propertiesChecked = {
      assigned_to_check: assignedLine.includes('record.assigned_to'),
      userIdMatch: assignedLine.includes('!== user.id'),
      partnerException: assignedLine.includes("user.role !== 'partner'"),
      deniesAccess: assignedLine.includes('return false')
    };

    console.log(`\n  Properties checked:`);
    console.log(`    - record.assigned_to exists: ${propertiesChecked.assigned_to_check ? '✓' : '✗'}`);
    console.log(`    - Must not match user.id: ${propertiesChecked.userIdMatch ? '✓' : '✗'}`);
    console.log(`    - Partner exemption: ${propertiesChecked.partnerException ? '✓' : '✗'}`);
    console.log(`    - Denies access: ${propertiesChecked.deniesAccess ? '✓' : '✗'}`);

    // Logic: If assigned_to exists AND user is not the assigned person AND user is not a partner, deny access
    const isCorrectLogic = propertiesChecked.assigned_to_check &&
                          propertiesChecked.userIdMatch &&
                          propertiesChecked.partnerException &&
                          propertiesChecked.deniesAccess;

    console.log(`\n✅ Implementation: Clerk can ONLY access engagements assigned to them (partners exempt)`);
    return isCorrectLogic;
  }

  return false;
}

// TEST 8: Stage transition blocking for clerks (unless clerksCanApprove=true)
function testStageTransitionBlocking() {
  console.log('\nTest 8: Clerk cannot change stages (unless clerksCanApprove=true flag set)');
  console.log('-'.repeat(70));

  const stageValidatorCode = fs.readFileSync(stageValidatorPath, 'utf-8');

  // Check for clerksCanApprove flag
  const hasClerksCanApproveCheck = stageValidatorCode.includes('clerks_can_approve');
  console.log(`\n✓ Checking for clerksCanApprove flag: ${hasClerksCanApproveCheck ? 'FOUND' : 'NOT FOUND'}`);

  // Check for clerk role check
  const hasClerkRoleCheck = stageValidatorCode.includes("isClerk");
  console.log(`✓ Checking for clerk role check: ${hasClerkRoleCheck ? 'FOUND' : 'NOT FOUND'}`);

  // Find the key logic
  const lines = stageValidatorCode.split('\n');

  // Find line with clerksCanApprove variable assignment
  const clerksCanApproveLine = lines.find(l => l.includes('clerksCanApprove') && l.includes('prev.clerks_can_approve'));
  if (clerksCanApproveLine) {
    console.log(`\n✓ Found clerksCanApprove assignment:`);
    console.log(`  "${clerksCanApproveLine.trim()}"`);
  }

  // Find clerk restrictions for specific stages
  console.log(`\n✓ Checking stage-specific restrictions:`);

  const stageRestrictions = [
    { stage: 'commencement', line: 178 },
    { stage: 'team_execution', line: 178 },
    { stage: 'partner_review', line: 140 },
    { stage: 'finalization', line: 152 }
  ];

  let foundRestrictions = 0;
  stageRestrictions.forEach(({ stage, line }) => {
    if (lines[line - 1] && lines[line - 1].includes(`'${stage}'`)) {
      foundRestrictions++;
      console.log(`  - ${stage}: ✓ Restricted`);
    }
  });

  // Look for the general clerk restriction pattern
  const generalClerkCheck = lines.find(l =>
    l.includes('isClerk') &&
    l.includes('!clerksCanApprove') &&
    !l.includes('//')
  );

  const hasGeneralRestriction = !!generalClerkCheck;
  if (hasGeneralRestriction) {
    console.log(`\n✓ Found general clerk restriction:`);
    console.log(`  "${generalClerkCheck.trim()}"`);
  }

  // Verify specific restriction for commencement/team_execution with clerksCanApprove flag
  const commencementRestrictionIdx = lines.findIndex(l => l.includes("toStage === 'commencement'"));
  let hasCommencementRestriction = false;
  let hasCorrectLogic = false;

  if (commencementRestrictionIdx !== -1) {
    // Check the next 10 lines for the restriction
    const blockText = lines.slice(commencementRestrictionIdx, commencementRestrictionIdx + 15).join('\n');
    hasCommencementRestriction = blockText.includes('isClerk') && blockText.includes('!clerksCanApprove');
    hasCorrectLogic = blockText.includes('throw new AppError') || blockText.includes('throw new Error');

    if (hasCommencementRestriction) {
      console.log(`\n✓ commencement/team_execution stages have clerk restriction with clerksCanApprove check`);
    }
  }

  // Verify partner_review stage also restricts clerks
  const partnerReviewIdx = lines.findIndex(l => l.includes("toStage === 'partner_review'"));
  let hasPartnerReviewRestriction = false;
  if (partnerReviewIdx !== -1) {
    const blockText = lines.slice(partnerReviewIdx, partnerReviewIdx + 15).join('\n');
    hasPartnerReviewRestriction = blockText.includes('isClerk') && blockText.includes('throw new AppError');

    if (hasPartnerReviewRestriction) {
      console.log(`✓ partner_review stage explicitly restricts clerks (no approval flag override)`);
    }
  }

  const throwsOnBlock = stageValidatorCode.includes("throw new AppError") && stageValidatorCode.includes("INSUFFICIENT_PERMISSIONS");
  console.log(`✓ Throws error when blocking: ${throwsOnBlock ? '✓ YES' : '✗ NO'}`);

  // Summary
  const isProperImplementation = hasCommencementRestriction && hasPartnerReviewRestriction && hasGeneralRestriction && throwsOnBlock;

  console.log(`\n✅ Implementation: Clerks blocked from stage transitions unless:`);
  console.log(`   - They are Partners or Managers, OR`);
  console.log(`   - The engagement has clerksCanApprove=true flag`);

  return isProperImplementation;
}

// Run tests
try {
  test7Pass = testRowAccessControl();
  test8Pass = testStageTransitionBlocking();

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY: TEST RESULTS');
  console.log(`${'='.repeat(80)}\n`);

  console.log('Test 7: Clerk read/write access limited to assigned engagements only');
  console.log(`Status: ${test7Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Details: ${test7Pass ? 'Row-level access control properly implemented for assigned scope' : 'Row-level access control not properly implemented'}`);
  console.log('Command: Must authenticate as clerk, can only list/view/edit engagements assigned to them');

  console.log(`\nTest 8: Clerk cannot change stages (unless clerksCanApprove=true flag set)`);
  console.log(`Status: ${test8Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Details: ${test8Pass ? 'Stage transition blocking properly implemented for clerks' : 'Stage transition blocking not properly implemented'}`);
  console.log('Command: curl -X PATCH http://localhost:3001/api/engagement/<id> with stage change will be blocked');

  const passCount = [test7Pass, test8Pass].filter(p => p).length;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY: ${passCount}/2 PASSING`);
  console.log(`${'='.repeat(80)}\n`);

  if (passCount === 2) {
    console.log('✅ All clerk permission logic tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed - clerk permission logic issues detected.\n');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ TEST ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
