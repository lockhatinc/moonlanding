import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, 'src');

function resolveFile(filePath) {
  const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
  if (stats && stats.isFile()) return filePath;

  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    if (fs.existsSync(filePath + '.js')) return filePath + '.js';
    if (fs.existsSync(filePath + '.jsx')) return filePath + '.jsx';
  }

  if (stats && stats.isDirectory()) {
    const indexPath = path.join(filePath, 'index.js');
    if (fs.existsSync(indexPath)) return indexPath;
  }

  return filePath;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const modulePath = specifier.slice(2);
    const filePath = resolveFile(path.join(srcPath, modulePath));
    return nextResolve(`file://${filePath}`, context);
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const filePath = resolveFile(path.resolve(parentDir, specifier));
    return nextResolve(`file://${filePath}`, context);
  }

  return nextResolve(specifier, context);
}
