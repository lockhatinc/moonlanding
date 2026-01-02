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
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.jsx'))) {
      moduleCache.clear();
      console.log(`[Hot] Invalidated: ${filename}`);
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
      const routeFile = path.join(__dirname, `src/app/api/[entity]/[[...path]]/route.js`);

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

      const pathParts = pathname.slice(5).split('/').filter(Boolean);
      const entity = pathParts[0];
      const pathArray = pathParts.slice(1);

      const context = {
        params: Promise.resolve({ entity, path: pathArray })
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
