#!/usr/bin/env node

/**
 * MIGRATION EXECUTION WRAPPER
 * Executes complete migration pipeline (Phases 3.5-3.10)
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('========== STARTING MIGRATION EXECUTION ==========');
    console.log(`Started: ${new Date().toISOString()}`);
    console.log();

    // Execute the main migration orchestrator
    const scriptPath = path.join(__dirname, 'execute-all-phases-real.js');

    console.log(`Executing: ${scriptPath}`);
    console.log();

    // Import and execute the module
    const { default: executePhases } = await import(scriptPath);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
