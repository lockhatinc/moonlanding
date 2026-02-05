// Simplified page handler - just for login
import { renderLogin } from './renderer.js';

export async function handleSimplePage(pathname, req, res) {
  if (pathname === '/login') {
    return renderLogin();
  }
  return null;
}
