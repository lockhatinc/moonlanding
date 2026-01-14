import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setCurrentRequest } from '@/engine.server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/**
 * Minimal page renderer for zero-build runtime
 * Serves HTML that uses client-side rendering for React pages
 * Server executes async page functions to handle redirects and auth checks
 *
 * Returns:
 *   - string: HTML content (server should send as response)
 *   - REDIRECT_HANDLED: special symbol indicating redirect was already sent
 *   - null: page not found
 */
export const REDIRECT_HANDLED = Symbol('REDIRECT_HANDLED');

export async function renderPageToHtml(pathname, req, res) {
  try {
    // Set the current request for server functions (getUser(), etc)
    setCurrentRequest(req);

    // Normalize pathname
    let normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

    // Route matching - maps pathname to page file
    let pageFile = null;
    let params = {};

    if (normalizedPath === '/' || normalizedPath === '') {
      pageFile = path.join(projectRoot, 'app', 'page.jsx');
    } else if (normalizedPath === '/login') {
      pageFile = path.join(projectRoot, 'app', 'login', 'page.jsx');
    } else if (normalizedPath === '/dashboard') {
      pageFile = path.join(projectRoot, 'app', 'dashboard', 'page.jsx');
    } else if (normalizedPath === '/not-found') {
      pageFile = path.join(projectRoot, 'app', 'not-found.jsx');
    } else {
      // Dynamic routes: /entity, /entity/[id], /entity/[id]/edit, /entity/new
      const segments = normalizedPath.split('/').filter(Boolean);

      if (segments.length === 1) {
        pageFile = path.join(projectRoot, 'app', '[entity]', 'page.jsx');
        params = { entity: segments[0] };
      } else if (segments.length === 2) {
        const [entity, idOrAction] = segments;
        if (idOrAction === 'new') {
          pageFile = path.join(projectRoot, 'app', '[entity]', 'new', 'page.jsx');
          params = { entity };
        } else {
          pageFile = path.join(projectRoot, 'app', '[entity]', '[id]', 'page.jsx');
          params = { entity, id: idOrAction };
        }
      } else if (segments.length === 3) {
        const [entity, id, action] = segments;
        if (action === 'edit') {
          pageFile = path.join(projectRoot, 'app', '[entity]', '[id]', 'edit', 'page.jsx');
          params = { entity, id };
        }
      }
    }

    // Check if page file exists
    if (!pageFile || !fs.existsSync(pageFile)) {
      return null;
    }

    console.log(`[Page Renderer] Rendering: ${normalizedPath} from ${pageFile}`);

    // Import the page module
    const pageModule = await import(`file://${pageFile}?t=${Date.now()}`);
    const PageComponent = pageModule.default;

    if (!PageComponent) {
      console.warn(`[Page Renderer] No default export in ${pageFile}`);
      return null;
    }

    // Execute the page component (may be async server component)
    // This is needed to handle redirects, getUser(), etc
    let result;
    try {
      result = await PageComponent({ params });
    } catch (error) {
      // Check if it's a redirect or special error
      if (error && typeof error === 'object') {
        if (error.type === 'redirect' || error.digest?.includes('NEXT_REDIRECT')) {
          const status = error.status || 302;
          const location = error.location || '/';
          console.log(`[Page Renderer] Redirect to ${location} (${status})`);
          try {
            res.writeHead(status, { 'Location': location });
            res.end();
          } catch (e) {
            console.error('[Page Renderer] Error sending redirect:', e.message);
          }
          return REDIRECT_HANDLED;
        }
        if (error.type === 'not-found' || error.digest?.includes('NEXT_NOT_FOUND')) {
          res.writeHead(404);
          res.end('Not found');
          return REDIRECT_HANDLED;
        }
      }
      // Other errors - log and try to render anyway
      console.error('[Page Renderer] Page error:', error?.message);
    }

    // Generate HTML shell with client-side rendering bootstrap
    const html = generateHtmlShell(normalizedPath, params, pageFile);
    return html;
  } catch (error) {
    console.error('[Page Renderer] Error:', error.message, error.stack);
    return null;
  }
}

function generateHtmlShell(pathname, params, pageFile) {
  const title = extractPageTitle(pageFile);

  return `<!DOCTYPE html>
<html lang="en" suppressHydrationWarning>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="theme-color" content="#3b82f6">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mantine/core@7/esm/styles.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #f8f9fa; }
    #__next { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="__next"></div>
  <script>
    window.__PATHNAME__ = '${escapeJs(pathname)}';
    window.__PARAMS__ = ${JSON.stringify(params)};
  </script>
  <script type="module">
    // Client-side page initialization
    console.log('[App] Starting on', window.__PATHNAME__);
  </script>
</body>
</html>`;
}

function extractPageTitle(pageFile) {
  if (pageFile.includes('login')) return 'Login';
  if (pageFile.includes('dashboard')) return 'Dashboard';
  if (pageFile.includes('not-found')) return '404 - Not Found';
  return 'Platform';
}

function escapeJs(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
