#!/usr/bin/env node
/**
 * Test Script: PartnerReview Stage Transitions (Tests 20-21)
 * Tests manual entry to PartnerReview and backward transition to TeamExecution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runTests() {
  console.log('='.repeat(60));
  console.log('TEST GROUP 2D: PARTNERREVIEW STAGE TRANSITIONS');
  console.log('='.repeat(60));

  // Read the master config YAML file
  const configPath = path.join(__dirname, 'src/config/master-config.yml');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  // Extract team_execution stage config (lines 199-214)
  const teamExecStart = configContent.indexOf('- name: team_execution');
  const teamExecEnd = configContent.indexOf('- name: partner_review');
  const teamExecSection = configContent.substring(teamExecStart, teamExecEnd);

  // Extract partner_review stage config (lines 215-230)
  const partnerStart = configContent.indexOf('- name: partner_review');
  const partnerEnd = configContent.indexOf('- name: finalization');
  const partnerSection = configContent.substring(partnerStart, partnerEnd);

  // Extract finalization stage config (lines 231-246) for reference
  const finalStart = configContent.indexOf('- name: finalization');
  const finalEnd = configContent.indexOf('- name: close_out');
  const finalSection = configContent.substring(finalStart, finalEnd);

  console.log('\n' + '='.repeat(60));
  console.log('ANALYZING CONFIGURATION');
  console.log('='.repeat(60));

  // Test 20: Check if TeamExecution can transition to PartnerReview
  console.log('\nTest 20: PartnerReview can be manually entered from TeamExecution');
  console.log('-'.repeat(60));

  // Helper to extract list values from YAML
  function extractYamlList(text, fieldName) {
    const regex = new RegExp(`${fieldName}:\\s*\\n([\\s\\S]*?)(?=^\\s{0,6}[a-z_]+:)`, 'm');
    const match = text.match(regex);
    if (!match) return [];

    const items = [];
    const lines = match[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        items.push(trimmed.substring(2).trim());
      }
    }
    return items;
  }

  console.log('\nTeamExecution Stage Configuration:');
  const teamExecForward = extractYamlList(teamExecSection, 'forward');
  console.log('  forward:', teamExecForward);

  const teamExecBackward = extractYamlList(teamExecSection, 'backward');
  console.log('  backward:', teamExecBackward);

  console.log('\nPartnerReview Stage Configuration:');
  const partnerForward = extractYamlList(partnerSection, 'forward');
  console.log('  forward:', partnerForward);

  const partnerBackward = extractYamlList(partnerSection, 'backward');
  console.log('  backward:', partnerBackward);

  const partnerEntry = partnerSection.match(/entry:\s*(\w+)/);
  console.log('  entry:', partnerEntry ? partnerEntry[1] : 'default');

  const partnerRole = partnerSection.match(/requires_role:\n\s*-\s*([\s\S]*?)(?=description:)/);
  const roles = partnerRole ?
    partnerRole[1].split('\n').map(l => l.trim()).filter(l => l && l.startsWith('-')).map(l => l.replace(/^-\s*/, '')) : [];
  console.log('  requires_role:', roles);

  // Test 20 Result
  const test20Pass = teamExecForward.includes('partner_review');
  console.log(`\nTest 20 Result: teamExecution.forward includes 'partner_review'? ${test20Pass}`);
  console.log(`Status: ${test20Pass ? '✅ PASS' : '❌ FAIL'}`);

  // Test 21: Check if PartnerReview can transition backward to TeamExecution
  console.log('\n\nTest 21: PartnerReview can move backward to TeamExecution');
  console.log('-'.repeat(60));
  console.log('Requirement: "Can move backward to TeamExecution to fix queries"');

  const test21Pass = partnerBackward.includes('team_execution');
  console.log(`\npartnerReview.backward includes 'team_execution'? ${test21Pass}`);
  console.log(`Status: ${test21Pass ? '✅ PASS' : '❌ FAIL'}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test 20: ${test20Pass ? '✅' : '❌'} PartnerReview manual entry from TeamExecution`);
  console.log(`Test 21: ${test21Pass ? '✅' : '❌'} Backward transition to TeamExecution`);

  const passingCount = (test20Pass ? 1 : 0) + (test21Pass ? 1 : 0);
  console.log(`\nSUMMARY: ${passingCount}/2 PASSING`);
  console.log('='.repeat(60));

  // Additional details for debugging
  if (!test20Pass) {
    console.log('\n❌ TEST 20 FAILED - Details:');
    console.log('Team Execution forward transitions found:', teamExecForward);
    console.log('Expected: "partner_review" to be in the list');
  }

  if (!test21Pass) {
    console.log('\n❌ TEST 21 FAILED - Details:');
    console.log('Partner Review backward transitions found:', partnerBackward);
    console.log('Expected: "team_execution" to be in the list');
  }

  process.exit(passingCount === 2 ? 0 : 1);
}

runTests();
