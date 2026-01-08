import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3004;

const hooks = {
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const resolved = specifier.replace('@/', `${__dirname}/src/`);
      return nextResolve(`${resolved}`, context);
    }
    return nextResolve(specifier, context);
  },
};

register('./import-hook.js', import.meta.url);

let systemInitialized = false;
const moduleCache = new Map();

const watchedDirs = [
  path.join(__dirname, 'src/config'),
  path.join(__dirname, 'src/app/api'),
];

watchedDirs.forEach((dir) => {
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
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (pathname.startsWith('/api/')) {
      // Special handling for specific routes
      const pathParts = pathname.slice(5).split('/').filter(Boolean);
      const firstPart = pathParts[0];
      let routeFile = null;

      // Check for specific route files first (auth, cron, etc)
      if (firstPart && firstPart !== '[entity]') {
        const specificRoute = path.join(__dirname, `src/app/api/${firstPart}${pathParts.slice(1).map(p => `/${p}`).join('')}/route.js`);
        if (fs.existsSync(specificRoute)) {
          console.log(`[Server] Using specific route: ${firstPart}`);
          routeFile = specificRoute;
        } else {
          console.log(`[Server] No specific route found at: ${specificRoute}`);

          // Check for nested dynamic routes like /mwr/review/[id]/highlights
          if (pathParts.length >= 3 && firstPart === 'mwr') {
            const baseEntity = pathParts[1];
            const childEntity = pathParts[3];
            const nestedRoute = path.join(__dirname, `src/app/api/mwr/${baseEntity}/[id]/${childEntity}/route.js`);
            if (childEntity && fs.existsSync(nestedRoute)) {
              console.log(`[Server] Using nested MWR route: mwr/${baseEntity}/[id]/${childEntity}`);
              routeFile = nestedRoute;
            }
          }

          // Check for domain-specific dynamic routes (e.g., /api/friday/[entity]/route.js)
          if (!routeFile && pathParts.length >= 2) {
            const domainDynamicRoute = path.join(__dirname, `src/app/api/${firstPart}/[entity]/route.js`);
            if (fs.existsSync(domainDynamicRoute)) {
              console.log(`[Server] Using domain-specific dynamic route: ${firstPart}/[entity]`);
              routeFile = domainDynamicRoute;
            }
          }
        }
      }

      // Fall back to catch-all route
      if (!routeFile) {
        console.log(`[Server] Using catch-all route for: ${pathname}`);
        routeFile = path.join(__dirname, `src/app/api/[entity]/[[...path]]/route.js`);
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

      let entity;
      let pathArray;
      let params = { entity: firstPart, path: [] };

      if (routeFile.includes('mwr/') && routeFile.includes('[id]')) {
        // Nested MWR route like /mwr/review/[id]/highlights
        params = { id: pathParts[2] };
      } else if (routeFile.includes('[entity]')) {
        if (routeFile.includes('src/app/api/[entity]')) {
          entity = firstPart;
          pathArray = pathParts.slice(1);
        } else {
          entity = pathParts[1];
          pathArray = pathParts.slice(2);
        }
        params = { entity, path: pathArray };
      } else {
        entity = firstPart;
        pathArray = pathParts.slice(1);
        params = { entity, path: pathArray };
      }

      const context = {
        params: params
      };

      try {
        const response = await handler(request, context);
        const responseBody = await response.json();
        res.writeHead(response.status, response.headers);
        res.end(JSON.stringify(responseBody));
      } catch (err) {
        console.error('[API] Handler error:', err.message || err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message || String(err) }));
      }
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('[Server] Error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
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

globalThis.NextRequest = NextRequest;
globalThis.NextResponse = NextResponse;

server.listen(PORT, () => {
  console.log(`\n▲ Zero-Build Runtime Server`);
  console.log(`- Local:        http://localhost:${PORT}`);
  console.log(`- Environments: .env.local, .env`);
  console.log(`✓ Ready in 0.1s\n`);
});
