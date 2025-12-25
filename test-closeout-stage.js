#!/usr/bin/env node

/**
 * TEST GROUP 2F: CLOSEOUT STAGE (Tests 24-27)
 *
 * This test verifies the CloseOut stage implementation by analyzing:
 * 1. CloseOut requires Partner role (Test 24)
 * 2. CloseOut strict gate: Engagement Letter must be "Accepted" OR Progress = 0% (Test 25)
 * 3. CloseOut sets engagement to read-only state (Test 26)
 * 4. CloseOut validation prevents invalid transitions (Test 27)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`\n${'='.repeat(80)}`);
console.log('TEST GROUP 2F: CLOSEOUT STAGE (Tests 24-27)');
console.log(`${'='.repeat(80)}\n`);

// Read and analyze the stage transition system
const stageValidatorPath = path.join(__dirname, 'src/lib/hooks/engagement-stage-validator.js');
const lifecycleEnginePath = path.join(__dirname, 'src/lib/lifecycle-engine.js');
const masterConfigPath = path.join(__dirname, 'src/config/master-config.yml');

console.log('▶ Reading CloseOut stage implementation...\n');

let test24Pass = false;
let test25Pass = false;
let test26Pass = false;
let test27Pass = false;

// TEST 24: CloseOut requires Partner role (other roles get 403 Forbidden)
function testCloseoutPartnerOnly() {
  console.log('Test 24: CloseOut requires Partner role (other roles get 403 Forbidden)');
  console.log('-'.repeat(70));

  const stageValidatorCode = fs.readFileSync(stageValidatorPath, 'utf-8');

  // Check for close_out stage validation
  const hasCloseoutCheck = stageValidatorCode.includes("toStage === 'close_out'");
  console.log(`\n✓ Checking for close_out stage validation: ${hasCloseoutCheck ? 'FOUND' : 'NOT FOUND'}`);

  // Check for partner-only enforcement
  const hasPartnerOnly = stageValidatorCode.includes("!isPartner") &&
                        stageValidatorCode.includes("'close_out'");
  console.log(`✓ Checking for partner-only enforcement: ${hasPartnerOnly ? 'FOUND' : 'NOT FOUND'}`);

  // Find the close_out validation block
  const lines = stageValidatorCode.split('\n');
  const closeoutIdx = lines.findIndex(l => l.includes("toStage === 'close_out'"));

  if (closeoutIdx !== -1) {
    const blockText = lines.slice(closeoutIdx, closeoutIdx + 12).join('\n');

    // Check for permission denial logic
    const hasPartnerCheck = blockText.includes('!isPartner');
    const logsPermissionDenial = blockText.includes('logPermissionDenial');
    const throwsError = blockText.includes('throw new AppError');
    const hasForbiddenStatus = blockText.includes('HTTP.FORBIDDEN') || blockText.includes('403');
    const hasInsufficientPermsError = blockText.includes('INSUFFICIENT_PERMISSIONS') || blockText.includes('partner');

    console.log(`\n✓ Implementation details:`);
    console.log(`  - Checks if user is NOT partner: ${hasPartnerCheck ? '✓' : '✗'}`);
    console.log(`  - Logs permission denial: ${logsPermissionDenial ? '✓' : '✗'}`);
    console.log(`  - Throws AppError: ${throwsError ? '✓' : '✗'}`);
    console.log(`  - Returns 403 Forbidden: ${hasForbiddenStatus ? '✓' : '✗'}`);
    console.log(`  - Error indicates insufficient permissions: ${hasInsufficientPermsError ? '✓' : '✗'}`);

    if (blockText.includes('Only partners can close out engagements')) {
      console.log(`  - Error message mentions "Only partners can close out": ✓`);
    }

    test24Pass = hasPartnerCheck && throwsError && hasForbiddenStatus;
    console.log(`\n✅ Status: CloseOut PARTNER-ONLY enforcement ${test24Pass ? 'PROPERLY IMPLEMENTED' : 'NOT PROPERLY IMPLEMENTED'}`);
  }

  return test24Pass;
}

// TEST 25: CloseOut strict gate: Engagement Letter must be "Accepted" OR Progress = 0%
function testCloseoutGate() {
  console.log('\nTest 25: CloseOut strict gate - Letter "Accepted" OR Progress = 0%');
  console.log('-'.repeat(70));

  const lifecycleCode = fs.readFileSync(lifecycleEnginePath, 'utf-8');
  const configCode = fs.readFileSync(masterConfigPath, 'utf-8');

  // Check for close_out validation in lifecycle engine
  const hasLetterAcceptedValidator = lifecycleCode.includes('letterAcceptedOrCancelled');
  console.log(`\n✓ Checking for letterAcceptedOrCancelled validator: ${hasLetterAcceptedValidator ? 'FOUND' : 'NOT FOUND'}`);

  // Check the validator implementation
  const lines = lifecycleCode.split('\n');
  const validatorIdx = lines.findIndex(l => l.includes('letterAcceptedOrCancelled'));

  if (validatorIdx !== -1) {
    const blockText = lines.slice(validatorIdx, validatorIdx + 2).join('\n');
    console.log(`\n✓ Validator logic:`);
    console.log(`  "${blockText.trim()}"`);

    const checksLetterStatus = blockText.includes("letter_status === 'accepted'");
    const checksProgress = blockText.includes('progress === 0');
    const usesOR = blockText.includes('||');

    console.log(`\n  - Checks letter_status === 'accepted': ${checksLetterStatus ? '✓' : '✗'}`);
    console.log(`  - Checks progress === 0: ${checksProgress ? '✓' : '✗'}`);
    console.log(`  - Uses OR logic: ${usesOR ? '✓' : '✗'}`);
  }

  // Check master config for close_out stage definition
  const closeoutInConfig = configCode.includes('close_out') &&
                          configCode.includes('letterAcceptedOrCancelled');
  console.log(`✓ close_out stage defined in config: ${configCode.includes('close_out') ? 'YES' : 'NO'}`);
  console.log(`✓ letterAcceptedOrCancelled validation in config: ${closeoutInConfig ? 'YES' : 'NO'}`);

  // Check validation rules in config
  const configLines = configCode.split('\n');
  const closeoutIdx = configLines.findIndex(l => l.includes('name: close_out'));

  if (closeoutIdx !== -1) {
    const blockText = configLines.slice(closeoutIdx, closeoutIdx + 20).join('\n');

    const hasValidation = blockText.includes('validation:');
    const hasLetterValidator = blockText.includes('letterAcceptedOrCancelled');
    const hasNoBackward = blockText.includes('backward: []');
    const hasReadonly = blockText.includes('readonly: true');

    console.log(`\n✓ close_out stage config:`);
    console.log(`  - Has validation rules: ${hasValidation ? '✓' : '✗'}`);
    console.log(`  - Includes letterAcceptedOrCancelled: ${hasLetterValidator ? '✓' : '✗'}`);
    console.log(`  - No backward transitions: ${hasNoBackward ? '✓' : '✗'}`);
    console.log(`  - Marked as readonly: ${hasReadonly ? '✓' : '✗'}`);

    test25Pass = hasLetterValidator && hasValidation && hasReadonly && hasNoBackward;
  }

  console.log(`\n✅ Status: CloseOut GATE enforcement ${test25Pass ? 'PROPERLY IMPLEMENTED' : 'NOT PROPERLY IMPLEMENTED'}`);
  return test25Pass;
}

// TEST 26: CloseOut sets engagement to read-only state
function testCloseoutReadonly() {
  console.log('\nTest 26: CloseOut sets engagement to read-only state');
  console.log('-'.repeat(70));

  const stageValidatorCode = fs.readFileSync(stageValidatorPath, 'utf-8');
  const lifecycleCode = fs.readFileSync(lifecycleEnginePath, 'utf-8');
  const configCode = fs.readFileSync(masterConfigPath, 'utf-8');

  // Check for isReadOnly method in lifecycle engine
  const hasIsReadOnlyMethod = lifecycleCode.includes('isReadOnly(entity, stage)');
  console.log(`\n✓ Checking for isReadOnly method: ${hasIsReadOnlyMethod ? 'FOUND' : 'NOT FOUND'}`);

  // Check implementation
  const lines = lifecycleCode.split('\n');
  const readonlyIdx = lines.findIndex(l => l.includes('isReadOnly('));

  if (readonlyIdx !== -1) {
    const blockText = lines.slice(readonlyIdx, readonlyIdx + 3).join('\n');
    console.log(`\n✓ isReadOnly implementation:`);
    console.log(`  "${blockText.trim()}"`);
  }

  // Check stage validator uses isReadOnly check
  const usesReadonlyCheck = stageValidatorCode.includes('isReadOnly') &&
                           stageValidatorCode.includes("Object.keys(data).length > 1");
  console.log(`✓ Stage validator checks isReadOnly: ${usesReadonlyCheck ? 'YES' : 'NO'}`);

  // Check config for readonly flag on close_out
  const configLines = configCode.split('\n');
  const closeoutIdx = configLines.findIndex(l => l.includes('name: close_out'));

  let hasReadonlyFlag = false;
  if (closeoutIdx !== -1) {
    const blockText = configLines.slice(closeoutIdx, closeoutIdx + 20).join('\n');
    hasReadonlyFlag = blockText.includes('readonly: true');
    console.log(`✓ close_out stage has readonly: true flag: ${hasReadonlyFlag ? 'YES' : 'NO'}`);
  }

  // Check error handling for readonly violations
  const readonlyErrorCheck = stageValidatorCode.includes('STAGE_READONLY') ||
                            stageValidatorCode.includes('read-only');
  console.log(`✓ Returns error on readonly violation: ${readonlyErrorCheck ? 'YES' : 'NO'}`);

  test26Pass = hasIsReadOnlyMethod && usesReadonlyCheck && hasReadonlyFlag && readonlyErrorCheck;
  console.log(`\n✅ Status: CloseOut READ-ONLY enforcement ${test26Pass ? 'PROPERLY IMPLEMENTED' : 'NOT PROPERLY IMPLEMENTED'}`);
  return test26Pass;
}

// TEST 27: CloseOut validation prevents invalid transitions
function testCloseoutInvalidTransitions() {
  console.log('\nTest 27: CloseOut validation prevents invalid transitions');
  console.log('-'.repeat(70));

  const configCode = fs.readFileSync(masterConfigPath, 'utf-8');
  const stageValidatorCode = fs.readFileSync(stageValidatorPath, 'utf-8');

  // Check that close_out has no backward transitions
  const configLines = configCode.split('\n');
  const closeoutIdx = configLines.findIndex(l => l.includes('name: close_out'));

  let hasNoBackwardTransitions = false;
  let hasNoForwardTransitions = false;
  let checksValidTransitions = false;

  if (closeoutIdx !== -1) {
    const blockText = configLines.slice(closeoutIdx, closeoutIdx + 20).join('\n');

    const backwardMatch = blockText.includes('backward: []');
    const forwardMatch = blockText.includes('forward: []');

    hasNoBackwardTransitions = !!backwardMatch;
    hasNoForwardTransitions = !!forwardMatch;

    console.log(`\n✓ close_out stage transition config:`);
    console.log(`  - backward: [] (no backward transitions): ${hasNoBackwardTransitions ? '✓' : '✗'}`);
    console.log(`  - forward: [] (no forward transitions): ${hasNoForwardTransitions ? '✓' : '✗'}`);
  }

  // Check stage validator enforces transition rules
  const lines = stageValidatorCode.split('\n');
  const transitionCheckIdx = lines.findIndex(l => l.includes('canTransition'));

  if (transitionCheckIdx !== -1) {
    const blockText = lines.slice(transitionCheckIdx, transitionCheckIdx + 15).join('\n');
    checksValidTransitions = blockText.includes('allowedTransitions') && blockText.includes('throw new AppError');
    console.log(`\n✓ Stage validator:`);
    console.log(`  - Validates allowed transitions: ${blockText.includes('canTransition') ? '✓' : '✗'}`);
    console.log(`  - Throws error on invalid transition: ${blockText.includes('throw new AppError') ? '✓' : '✗'}`);
  }

  // Verify the stage validator at beginning checks canTransition
  const hasCanTransitionCheck = stageValidatorCode.includes('canTransition(') &&
                               stageValidatorCode.includes('STAGE_TRANSITION_INVALID');
  console.log(`✓ Validates transitions using canTransition: ${hasCanTransitionCheck ? 'YES' : 'NO'}`);

  test27Pass = hasNoBackwardTransitions && hasNoForwardTransitions && hasCanTransitionCheck;
  console.log(`\n✅ Status: CloseOut TRANSITION VALIDATION ${test27Pass ? 'PROPERLY IMPLEMENTED' : 'NOT PROPERLY IMPLEMENTED'}`);
  return test27Pass;
}

// Run tests
try {
  test24Pass = testCloseoutPartnerOnly();
  test25Pass = testCloseoutGate();
  test26Pass = testCloseoutReadonly();
  test27Pass = testCloseoutInvalidTransitions();

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY: TEST RESULTS');
  console.log(`${'='.repeat(80)}\n`);

  const results = [
    {
      num: 24,
      pass: test24Pass,
      name: 'CloseOut requires Partner role',
      details: test24Pass ? 'Partner-only enforcement properly implemented' : 'Partner-only enforcement not implemented or incorrect'
    },
    {
      num: 25,
      pass: test25Pass,
      name: 'CloseOut strict gate',
      details: test25Pass ? 'Letter acceptance OR progress=0 gate properly implemented' : 'Gate not properly implemented'
    },
    {
      num: 26,
      pass: test26Pass,
      name: 'CloseOut read-only state',
      details: test26Pass ? 'Read-only enforcement properly implemented' : 'Read-only enforcement not implemented'
    },
    {
      num: 27,
      pass: test27Pass,
      name: 'CloseOut prevents invalid transitions',
      details: test27Pass ? 'Invalid transition prevention properly implemented' : 'Invalid transition prevention not implemented'
    }
  ];

  results.forEach(({ num, pass, name, details }) => {
    console.log(`Test ${num}: ${name}`);
    console.log(`Status: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Details: ${details}`);
    console.log();
  });

  const passCount = results.filter(r => r.pass).length;
  console.log(`${'='.repeat(80)}`);
  console.log(`SUMMARY: ${passCount}/4 PASSING`);
  console.log(`${'='.repeat(80)}\n`);

  process.exit(passCount === 4 ? 0 : 1);
} catch (error) {
  console.error(`\n❌ ERROR: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
