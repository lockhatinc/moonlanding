import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3004;

register('./import-hook.js', import.meta.url);

let systemInitialized = false;
const moduleCache = new Map();

const watchedDirs = [
  path.join(__dirname, 'src/config'),
  path.join(__dirname, 'src/app/api'),
  path.join(__dirname, 'src/ui'),
];

watchedDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, async (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.yml'))) {
      moduleCache.clear();
      console.log(`[Hot] Invalidated: ${filename}`);

      if (filename.endsWith('master-config.yml') || filename.includes('master-config')) {
        try {
          const { getConfigEngineSync } = await import('./src/lib/config-generator-engine.js');
          const engine = getConfigEngineSync();
          if (engine && engine.invalidateCache) {
            engine.invalidateCache();
            console.log('[Hot] Invalidated ConfigGeneratorEngine cache');
          }
        } catch (e) {
          console.log('[Hot] Could not invalidate config cache:', e.message);
        }
      }
    }
  });
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

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();

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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (pathname.startsWith('/lib/webjsx/')) {
      const file = pathname.slice(12);
      const filePath = path.join(__dirname, 'node_modules/webjsx/dist', file);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.writeHead(200);
        res.end(fs.readFileSync(filePath, 'utf-8'));
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    if (pathname === '/ui/styles.css') {
      const cssPath = path.join(__dirname, 'src/ui/styles.css');
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, 'utf-8');
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(css, 'utf-8'));
        res.writeHead(200);
        res.end(css);
        return;
      }
    }

    // Handle page requests (non-API routes) with new Ripple UI renderer
    if (!pathname.startsWith('/api/')) {
      try {
        const { handlePage } = await loadModule(path.join(__dirname, 'src/ui/page-handler.js'));
        const { REDIRECT } = await loadModule(path.join(__dirname, 'src/ui/renderer.js'));
        const html = await handlePage(pathname, req, res);
        if (html === REDIRECT) {
          const elapsed = Date.now() - startTime;
          console.log(`[${req.method}] ${req.url} ${res.statusCode} ${elapsed}ms (redirect)`);
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
          const elapsed = Date.now() - startTime;
          console.log(`[${req.method}] ${req.url} 200 ${elapsed}ms (page)`);
          return;
        }
      } catch (err) {
        console.error('[Page Handler] Error:', err.message, err.stack);
        if (res.headersSent) return;
      }
      // Fall through to 404 if page rendering fails
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

      if (!routeFile) {
        routeFile = path.join(__dirname, 'src/app/api/[entity]/[[...path]]/route.js');
        params = { entity: firstPart, path: pathParts.slice(1) };
      }

      if (!fs.existsSync(routeFile)) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'API route not found' }));
        return;
      }

      const module = await loadModule(routeFile);
      const handler = module[req.method] || module.default;

      if (!handler) {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      const body = await readBody(req);
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
          return;
        }

        const responseBody = await response.json();
        if (!headerObj['Content-Type']) {
          headerObj['Content-Type'] = 'application/json; charset=utf-8';
        }

        res.writeHead(response.status, headerObj);
        res.end(JSON.stringify(responseBody));
      } catch (err) {
        console.error('[API] Handler error:', err.message || err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message || String(err) }));
      }
      return;
    }

    if (!res.headersSent) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error('[Server] Error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[${req.method}] ${req.url} ${res.statusCode} ${elapsed}ms`);
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

async function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve(data);
      }
    });
  });
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

function buildNestedRoutePath(baseDir, domain, parentEntity, childParts) {
  if (childParts.length === 0) return null;
  const segments = [domain, parentEntity, '[id]'];
  for (let i = 0; i < childParts.length; i++) {
    if (i % 2 === 0) {
      segments.push(childParts[i]);
    } else {
      segments.push(`[${childParts[i - 1]}Id]`);
    }
  }
  const candidate = path.join(baseDir, 'src/app/api', ...segments, 'route.js');
  if (fs.existsSync(candidate)) return candidate;

  const altSegments = [domain, parentEntity, '[id]'];
  for (let i = 0; i < childParts.length; i++) {
    if (i % 2 === 0) {
      altSegments.push(childParts[i]);
    } else {
      altSegments.push(`[${childParts[0]}Id]`);
    }
  }
  const altCandidate = path.join(baseDir, 'src/app/api', ...altSegments, 'route.js');
  if (fs.existsSync(altCandidate)) return altCandidate;

  return candidate;
}

globalThis.NextRequest = NextRequest;
globalThis.NextResponse = NextResponse;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n▲ Zero-Build Runtime Server`);
  console.log(`- Local:        http://localhost:${PORT}`);
  console.log(`- Network:      http://0.0.0.0:${PORT}`);
  console.log(`- Environments: .env.local, .env`);
  console.log(`✓ Ready in 0.1s\n`);
});
