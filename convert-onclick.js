#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uiDir = path.join(__dirname, 'src/ui');
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.js') && f !== 'event-delegation.js');

let totalConversions = 0;
let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(path.join(uiDir, file), 'utf-8');
  const original = content;
  let conversions = 0;

  // Pattern 1: onclick="document.getElementById('ID').style.display='none'" -> data-dialog-close="ID"
  content = content.replace(/onclick="document\.getElementById\('([^']+)'\)\.style\.display='none'"/g, (match, id) => {
    conversions++;
    return `data-dialog-close="${id}"`;
  });

  // Pattern 2: onclick="window.location='PATH'" -> data-navigate="PATH"
  content = content.replace(/onclick="window\.location='([^']+)'"/g, (match, p) => {
    conversions++;
    return `data-navigate="${p}"`;
  });

  // Pattern 3: onclick="location.href='PATH'" -> data-navigate="PATH"
  content = content.replace(/onclick="location\.href='([^']+)'"/g, (match, p) => {
    conversions++;
    return `data-navigate="${p}"`;
  });

  // Pattern 4: dialog overlay onclick="if(event.target===this)this.style.display='none'" -> data-dialog-close-overlay
  content = content.replace(/onclick="if\(event\.target===this\)this\.style\.display='none'"/g, () => {
    conversions++;
    return `data-dialog-close-overlay="true"`;
  });

  // Pattern 5: Simple function calls onclick="FUNC()" -> data-action="FUNC"
  content = content.replace(/onclick="([a-zA-Z_][a-zA-Z0-9_]*)\(\)"/g, (match, func) => {
    conversions++;
    return `data-action="${func}"`;
  });

  // Pattern 6: dialog open onclick="document.getElementById('ID').style.display='flex'" -> data-action="openDialog" with params
  content = content.replace(/onclick="document\.getElementById\('([^']+)'\)\.style\.display='flex'"/g, (match, id) => {
    conversions++;
    return `data-action="openDialog" data-params='{"dialogId":"${id}"}'`;
  });

  if (conversions > 0) {
    fs.writeFileSync(path.join(uiDir, file), content, 'utf-8');
    filesModified++;
    totalConversions += conversions;
    console.log(`✓ ${file}: ${conversions} conversions`);
  }
});

console.log(`\n✓ Converted ${totalConversions} onclick patterns in ${filesModified} files`);
console.log(`\nNOTE: Still need to:
  1. Ensure event-delegation.js is loaded on all pages
  2. Convert function calls with parameters
  3. Register custom handlers in __events
  4. Update pages to include <script src="/ui/event-delegation.js"></script>`);
