#!/usr/bin/env node

/**
 * RippleUI Component Migration Tool
 * Automates conversion of Mantine components to RippleUI + native HTML
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPLACEMENTS = [
  // Remove imports
  {
    pattern: /import\s*{[\s\S]*?}\s*from\s*['"]@mantine\/(?:core|hooks|notifications)['"]\s*;?\n?/g,
    replacement: '',
  },
  // Stack → flexbox
  {
    pattern: /<Stack\s+gap="([^"]+)"(?:\s+[^>]*)?>([^<]*)<\/Stack>/g,
    replacement: '<div className="flex flex-col gap-$1">$2</div>',
  },
  {
    pattern: /<Stack(?:\s+[^>]*)?>([^<]*)<\/Stack>/g,
    replacement: '<div className="flex flex-col">$1</div>',
  },
  // Group → flexbox
  {
    pattern: /<Group\s+gap="([^"]+)"(?:\s+[^>]*)?>([^<]*)<\/Group>/g,
    replacement: '<div className="flex flex-row gap-$1">$2</div>',
  },
  {
    pattern: /<Group(?:\s+[^>]*)?>([^<]*)<\/Group>/g,
    replacement: '<div className="flex flex-row">$1</div>',
  },
  // Button
  {
    pattern: /<Button\s+variant="outline"(?:\s+[^>]*)?>([^<]*)<\/Button>/g,
    replacement: '<button className="btn btn-outline">$1</button>',
  },
  {
    pattern: /<Button(?:\s+[^>]*)?>([^<]*)<\/Button>/g,
    replacement: '<button className="btn">$1</button>',
  },
  // Text
  {
    pattern: /<Text\s+size="sm"(?:\s+[^>]*)?>([^<]*)<\/Text>/g,
    replacement: '<span className="text-sm">$1</span>',
  },
  {
    pattern: /<Text(?:\s+[^>]*)?>([^<]*)<\/Text>/g,
    replacement: '<span>$1</span>',
  },
  // Badge
  {
    pattern: /<Badge(?:\s+[^>]*)?>([^<]*)<\/Badge>/g,
    replacement: '<span className="badge">$1</span>',
  },
  // Paper
  {
    pattern: /<Paper(?:\s+[^>]*)?>([^<]*)<\/Paper>/g,
    replacement: '<div className="card">$1</div>',
  },
  // Alert
  {
    pattern: /<Alert\s+color="green"(?:\s+[^>]*)?>([^<]*)<\/Alert>/g,
    replacement: '<div className="alert alert-success">$1</div>',
  },
  {
    pattern: /<Alert\s+color="red"(?:\s+[^>]*)?>([^<]*)<\/Alert>/g,
    replacement: '<div className="alert alert-error">$1</div>',
  },
  // Modal
  {
    pattern: /<Modal\s+opened={([^}]+)}(?:\s+[^>]*)?>([^<]*)<\/Modal>/g,
    replacement: '{$1 && <dialog className="modal modal-open"><div className="modal-box">$2</div></dialog>}',
  },
];

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Apply replacements
    for (const { pattern, replacement } of REPLACEMENTS) {
      content = content.replace(pattern, replacement);
    }

    // Skip if no changes
    if (content === originalContent) {
      return null;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return { file: filePath, status: 'migrated' };
  } catch (error) {
    return { file: filePath, status: 'error', error: error.message };
  }
}

function walkDir(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

const componentsDir = path.join(__dirname, 'src/components');
const files = walkDir(componentsDir);

console.log(`Found ${files.length} component files\n`);

let migrated = 0;
let errors = 0;

for (const file of files) {
  const result = migrateFile(file);
  if (result) {
    console.log(`✓ ${path.relative(__dirname, result.file)}`);
    if (result.status === 'migrated') migrated++;
    if (result.status === 'error') {
      console.log(`  Error: ${result.error}`);
      errors++;
    }
  }
}

console.log(`\n${migrated} files migrated, ${errors} errors`);
