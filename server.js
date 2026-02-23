import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Load .env file manually
function loadEnv(filePath) {
  try {
    const envFile = fs.readFileSync(filePath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
      if (key) process.env[key] = value;
    });
  } catch (e) {
    console.warn('[Server] .env file not loaded:', e.message);
  }
}

loadEnv(path.join(__dirname, '.env'));

let _recordRequest = null;
async function ensureMetrics() {
  if (!_recordRequest) {
    try {
      const mod = await import('./src/lib/metrics-collector.js');
      _recordRequest = mod.recordRequest;
    } catch { _recordRequest = () => {}; }
  }
  return _recordRequest;
}

function trackResponse(req, statusCode, startTime) {
  const elapsed = Date.now() - startTime;
  const pathname = req.url.split('?')[0];
  if (_recordRequest) _recordRequest(pathname, req.method, elapsed, statusCode);
  console.log(`[${req.method}] ${req.url} ${statusCode} ${elapsed}ms`);
}

register('./import-hook.js', import.meta.url);

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception (process kept alive):', err?.message || err);
  if (err?.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection (process kept alive):', reason?.message || reason);
  if (reason?.stack) console.error(reason.stack);
});

let systemInitialized = false;
const moduleCache = new Map();
globalThis.__reloadTs__ = Date.now();

const watchedDirs = [
  path.join(__dirname, 'src/config'),
  path.join(__dirname, 'src/app/api'),
  path.join(__dirname, 'src/ui'),
];

watchedDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) return;
  try {
    const watcher = fs.watch(dir, { recursive: true }, async (eventType, filename) => {
      if (filename && (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.yml'))) {
        moduleCache.clear();
        globalThis.__reloadTs__ = Date.now();
        console.log(`[Hot] Invalidated: ${filename}`);

        if (filename.endsWith('master-config.yml') || filename.includes('master-config')) {
          try {
            const { resetConfigEngine } = await import('./src/lib/config-generator-engine.js');
            resetConfigEngine();
            console.log('[Hot] Reset ConfigGeneratorEngine for re-init');
          } catch (e) {
            console.log('[Hot] Could not reset config engine:', e.message);
          }
        }
      }
    });
    watcher.on('error', (err) => {
      console.error(`[Hot] Watcher error on ${dir}:`, err.message);
    });
  } catch (err) {
    console.error(`[Hot] Failed to watch ${dir}:`, err.message);
  }
});

async function loadModule(filePath) {
  const cached = moduleCache.get(filePath);
  if (cached) return cached;

  const timestamp = `?t=${Date.now()}`;
  const module = await import(`file://${filePath}${timestamp}`);
  moduleCache.set(filePath, module);
  return module;
}

// Normalize header names to proper HTTP case
// Response.headers converts all keys to lowercase, but Node.js http server
// needs proper case for headers to be transmitted correctly (especially Set-Cookie)
function normalizeHeaderName(key) {
  const headerMap = {
    'content-type': 'Content-Type',
    'content-length': 'Content-Length',
    'set-cookie': 'Set-Cookie',
    'cache-control': 'Cache-Control',
    'expires': 'Expires',
    'etag': 'ETag',
    'last-modified': 'Last-Modified',
    'location': 'Location',
    'date': 'Date',
    'connection': 'Connection',
  };

  return headerMap[key.toLowerCase()] || key;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' wss: ws:; frame-ancestors 'none'");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  setSecurityHeaders(res);
  await ensureMetrics();

  try {
    const { setCurrentRequest } = await loadModule(path.join(__dirname, 'src/engine.server.js'));
    setCurrentRequest(req);

    if (!systemInitialized) {
      const module = await loadModule(path.join(__dirname, 'src/config/system-config-loader.js'));
      await module.initializeSystemConfig();
      systemInitialized = true;
      console.log('[Server] System initialized');
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    const { compress, getCacheHeaders } = await loadModule(path.join(__dirname, 'src/lib/compression.js'));
    const acceptEncoding = req.headers['accept-encoding'] || '';

    if (pathname === '/service-worker.js') {
      const swPath = path.join(__dirname, 'src/service-worker.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        const cacheHeaders = getCacheHeaders('dynamic');
        Object.entries(cacheHeaders).forEach(([k, v]) => res.setHeader(k, v));
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf-8'));
        res.writeHead(200);
        res.end(content);
        trackResponse(req, 200, startTime);
        return;
      }
    }

    if (pathname.startsWith('/lib/webjsx/')) {
      const file = pathname.slice(12);
      const filePath = path.join(__dirname, 'node_modules/webjsx/dist', file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        const cacheHeaders = getCacheHeaders('static', 31536000);
        Object.entries(cacheHeaders).forEach(([k, v]) => res.setHeader(k, v));
        const { content: finalContent, encoding } = compress(content, acceptEncoding);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        if (encoding) res.setHeader('Content-Encoding', encoding);
        res.setHeader('Content-Length', Buffer.byteLength(finalContent));
        res.writeHead(200);
        res.end(finalContent);
        trackResponse(req, 200, startTime);
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      trackResponse(req, 404, startTime);
      return;
    }

    if (pathname === '/ui/styles.css' || pathname === '/ui/styles2.css') {
      const cssPath = path.join(__dirname, 'src/ui/styles.css');
      if (fs.existsSync(cssPath)) {
        let content = fs.readFileSync(cssPath, 'utf-8');
        const { minifyCSS } = await loadModule(path.join(__dirname, 'src/lib/minifier.js'));
        content = minifyCSS(content);
        const etag = `"${content.length}-${fs.statSync(cssPath).mtimeMs.toString(36)}"`;
        if (req.headers['if-none-match'] === etag) { res.writeHead(304); res.end(); return; }
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.setHeader('ETag', etag);
        const { content: finalContent, encoding } = compress(content, acceptEncoding);
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        if (encoding) res.setHeader('Content-Encoding', encoding);
        res.setHeader('Content-Length', Buffer.byteLength(finalContent));
        res.writeHead(200);
        res.end(finalContent);
        trackResponse(req, 200, startTime);
        return;
      }
    }

    if (pathname === '/ui/client.js') {
      const jsPath = path.join(__dirname, 'src/ui/client.js');
      if (fs.existsSync(jsPath)) {
        let content = fs.readFileSync(jsPath, 'utf-8');
        const { minifyJS } = await loadModule(path.join(__dirname, 'src/lib/minifier.js'));
        content = minifyJS(content);
        const cacheHeaders = getCacheHeaders('static', 86400);
        Object.entries(cacheHeaders).forEach(([k, v]) => res.setHeader(k, v));
        const { content: finalContent, encoding } = compress(content, acceptEncoding);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        if (encoding) res.setHeader('Content-Encoding', encoding);
        res.setHeader('Content-Length', Buffer.byteLength(finalContent));
        res.writeHead(200);
        res.end(finalContent);
        trackResponse(req, 200, startTime);
        return;
      }
    }

    // Handle page requests (non-API routes) with new Ripple UI renderer
    if (!pathname.startsWith('/api/')) {
      try {
        // Test: Try simple page first
        if (pathname === '/test') {
          const { generateTestPage } = await loadModule(path.join(__dirname, 'src/ui/test-page.js'));
          const html = generateTestPage();
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Length', Buffer.byteLength(html, 'utf-8'));
          res.writeHead(200);
          res.end(html);
          trackResponse(req, 200, startTime);
          return;
        }

        if (pathname === '/login') {
          const { renderStandaloneLogin } = await loadModule(path.join(__dirname, 'src/ui/standalone-login.js'));
          const { hasGoogleAuth } = await loadModule(path.join(__dirname, 'src/config/env.js'));
          const html = renderStandaloneLogin(hasGoogleAuth());
          if (html) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Length', Buffer.byteLength(html, 'utf-8'));
            res.writeHead(200);
            res.end(html);
            trackResponse(req, 200, startTime);
            return;
          }
        }

        const { handlePage } = await loadModule(path.join(__dirname, 'src/ui/page-handler.js'));
        const { REDIRECT } = await loadModule(path.join(__dirname, 'src/ui/renderer.js'));
        const html = await handlePage(pathname, req, res);
        if (html === REDIRECT) {
          trackResponse(req, res.statusCode, startTime);
          return;
        }
        if (html && html !== REDIRECT) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Length', Buffer.byteLength(html, 'utf-8'));
            res.writeHead(200);
          }
          if (!res.writableEnded) {
            res.end(html);
          }
          trackResponse(req, 200, startTime);
          return;
        }
      } catch (err) {
        console.error('[Page Handler] Error:', err.message);
        if (err.stack) console.error(err.stack);
        if (res.headersSent) return;
      }
      // No HTML returned or error occurred, fall through to 404
      console.log('[Server] Page handler returned null or errored for:', pathname);
    }

    if (pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const pathParts = pathname.slice(5).split('/').filter(Boolean);
      const firstPart = pathParts[0];
      const domains = ['friday', 'mwr'];
      const isDomain = domains.includes(firstPart);
      let routeFile = null;
      let params = {};

      if (isDomain) {
        const domain = firstPart;
        const domainParts = pathParts.slice(1);

        const specificCheck = path.join(__dirname, `src/app/api/${domain}/${domainParts.join('/')}/route.js`);
        if (fs.existsSync(specificCheck)) {
          routeFile = specificCheck;
          params = resolveSpecificParams(specificCheck, pathParts);
        }

        if (!routeFile && domainParts.length >= 3) {
          const parentEntity = domainParts[0];
          const parentId = domainParts[1];
          const childParts = domainParts.slice(2);
          const childEntity = childParts[0];
          const childId = childParts[1] || null;

          const nestedSpecific = buildNestedRoutePath(__dirname, domain, parentEntity, childParts);
          if (nestedSpecific && fs.existsSync(nestedSpecific)) {
            routeFile = nestedSpecific;
            params = resolveSpecificParams(nestedSpecific, pathParts);
          }

          if (!routeFile) {
            routeFile = path.join(__dirname, 'src/app/api/[entity]/[[...path]]/route.js');
            url.searchParams.set('domain', domain);
            params = { entity: childEntity, path: childId ? [childId] : [], parentEntity, parentId };
          }
        }

        if (!routeFile && domainParts.length >= 1) {
          const entity = domainParts[0];
          const entityPath = domainParts.slice(1);
          routeFile = path.join(__dirname, 'src/app/api/[entity]/[[...path]]/route.js');
          url.searchParams.set('domain', domain);
          params = { entity, path: entityPath };
        }
      }

      if (!routeFile && firstPart) {
        const exactRoute = path.join(__dirname, `src/app/api/${pathParts.join('/')}/route.js`);
        if (fs.existsSync(exactRoute)) {
          routeFile = exactRoute;
          params = resolveSpecificParams(exactRoute, pathParts);
        }
      }

      if (!routeFile && firstPart) {
        // Try parameterized route matching for non-domain routes (e.g. /api/rfi/[id]/questions)
        const paramRouteFile = resolveParamRoute(path.join(__dirname, 'src/app/api', firstPart), pathParts.slice(1));
        if (paramRouteFile) {
          routeFile = paramRouteFile;
          params = resolveSpecificParams(paramRouteFile, pathParts);
        }
      }

            if (!routeFile) {
        routeFile = path.join(__dirname, 'src/app/api/[entity]/[[...path]]/route.js');
        params = { entity: firstPart, path: pathParts.slice(1) };
      }

      if (!fs.existsSync(routeFile)) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'API route not found' }));
        trackResponse(req, 404, startTime);
        return;
      }

      let module = await loadModule(routeFile);
      let handler = module[req.method] || module.default;

      if (!handler && isDomain) {
        routeFile = path.join(__dirname, 'src/app/api/[entity]/[[...path]]/route.js');
        url.searchParams.set('domain', firstPart);
        const domainParts = pathParts.slice(1);
        params = { entity: domainParts[0], path: domainParts.slice(1) };
        module = await loadModule(routeFile);
        handler = module[req.method] || module.default;
      }

      if (!handler) {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        trackResponse(req, 405, startTime);
        return;
      }

      let body;
      try {
        body = await readBody(req);
      } catch (bodyErr) {
        res.writeHead(413);
        res.end(JSON.stringify({ error: 'Request body too large' }));
        return;
      }
      const request = new NextRequest(req, body, url);
      const context = { params };

      try {
        const response = await handler(request, context);

        let headerObj = {};
        if (response.headers) {
          for (const [key, value] of response.headers) {
            headerObj[normalizeHeaderName(key)] = value;
          }
        }

        if (response.status >= 300 && response.status < 400) {
          res.writeHead(response.status, headerObj);
          res.end();
          trackResponse(req, response.status, startTime);
          return;
        }

        const responseBody = await response.json();
        if (!headerObj['Content-Type']) {
          headerObj['Content-Type'] = 'application/json; charset=utf-8';
        }

        res.writeHead(response.status, headerObj);
        res.end(JSON.stringify(responseBody));
        trackResponse(req, response.status, startTime);
      } catch (err) {
        console.error('[API] Handler error:', err.message || err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message || String(err) }));
        trackResponse(req, 500, startTime);
      }
      return;
    }

    if (!res.headersSent) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      trackResponse(req, 404, startTime);
    }
  } catch (err) {
    console.error('[Server] Error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      const safeMessage = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
      res.end(JSON.stringify({ error: safeMessage }));
    }
    trackResponse(req, 500, startTime);
  }
});

class NextRequest {
  constructor(req, body, url) {
    this.method = req.method;
    this.headers = req.headers;
    this.url = url;
    this.body = body;
  }

  async json() {
    return this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return this.body;
  }

  static json(body, init = {}) {
    return new NextResponse(body, init);
  }
}

const MAX_BODY_SIZE = 10 * 1024 * 1024;

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve(data);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function resolveParamRoute(baseDir, segments) {
  if (!fs.existsSync(baseDir)) return null;
  if (segments.length === 0) {
    const r = path.join(baseDir, 'route.js');
    return fs.existsSync(r) ? r : null;
  }
  const [seg, ...rest] = segments;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true }).filter(e => e.isDirectory());
  for (const entry of entries) {
    const name = entry.name;
    if (name === seg || name.startsWith('[')) {
      const found = resolveParamRoute(path.join(baseDir, name), rest);
      if (found) return found;
    }
  }
  return null;
}

function resolveSpecificParams(routeFile, pathParts) {
  const result = {};
  const routeRelative = routeFile.replace(/.*src\/app\/api\//, '').replace(/\/route\.js$/, '');
  const routeSegments = routeRelative.split('/');
  const urlSegments = pathParts.slice(0);

  for (let i = 0; i < routeSegments.length && i < urlSegments.length; i++) {
    const seg = routeSegments[i];
    if (seg.startsWith('[') && seg.endsWith(']')) {
      const paramName = seg.replace(/^\[\.\.\./, '').replace(/[\[\]]/g, '');
      result[paramName] = urlSegments[i];
    }
  }
  return result;
}

function singularize(name) {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('ses') || name.endsWith('xes') || name.endsWith('zes')) return name.slice(0, -2);
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1);
  return name;
}

function buildNestedRoutePath(baseDir, domain, parentEntity, childParts) {
  if (childParts.length === 0) return null;

  function buildSegments(parentParam, childParamFn) {
    const segs = [domain, parentEntity, parentParam];
    for (let i = 0; i < childParts.length; i++) {
      if (i % 2 === 0) segs.push(childParts[i]);
      else segs.push(childParamFn(i));
    }
    return path.join(baseDir, 'src/app/api', ...segs, 'route.js');
  }

  const variants = [
    () => buildSegments('[id]', (i) => `[${childParts[i - 1]}Id]`),
    () => buildSegments('[id]', (i) => `[${singularize(childParts[i - 1])}Id]`),
    () => buildSegments(`[${parentEntity}Id]`, (i) => `[${childParts[i - 1]}Id]`),
    () => buildSegments(`[${parentEntity}Id]`, (i) => `[${singularize(childParts[i - 1])}Id]`),
    () => buildSegments('[id]', () => `[${childParts[0]}Id]`),
    () => buildSegments('[id]', () => `[${singularize(childParts[0])}Id]`),
  ];

  for (const variant of variants) {
    const candidate = variant();
    if (fs.existsSync(candidate)) return candidate;
  }

  return variants[0]();
}

globalThis.NextRequest = NextRequest;
globalThis.NextResponse = NextResponse;

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n▲ Zero-Build Runtime Server`);
  console.log(`- Local:        http://localhost:${PORT}`);
  console.log(`- Network:      http://0.0.0.0:${PORT}`);
  console.log(`- Environments: .env.local, .env`);
  console.log(`✓ Ready in 0.1s\n`);

  try {
    const { startLifecycle } = await import('./src/lib/dr-lifecycle.js');
    startLifecycle(server);
  } catch (err) {
    console.error('[Server] DR lifecycle init failed:', err.message);
  }
});
