import { setCurrentRequest } from '@/engine.server';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';
import fs from 'fs';
import path from 'path';

let cachedVersion = null;
let lastCheck = 0;
const CHECK_INTERVAL_MS = 60000;

function getAppVersion() {
  const elapsed = Date.now() - lastCheck;
  if (cachedVersion && elapsed < CHECK_INTERVAL_MS) return cachedVersion;

  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    cachedVersion = {
      version: pkg.version || '1.0.0',
      name: pkg.name || 'moonlanding',
      buildTime: fs.statSync(pkgPath).mtime.toISOString()
    };
  } catch {
    cachedVersion = {
      version: process.env.APP_VERSION || '1.0.0',
      name: 'moonlanding',
      buildTime: new Date().toISOString()
    };
  }

  lastCheck = Date.now();
  return cachedVersion;
}

async function handleGet(request) {
  setCurrentRequest(request);
  const versionInfo = getAppVersion();

  const url = new URL(request.url);
  const clientVersion = url.searchParams.get('client_version');

  const response = {
    status: 'success',
    data: {
      ...versionInfo,
      server_time: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    }
  };

  if (clientVersion && clientVersion !== versionInfo.version) {
    response.data.update_available = true;
    response.data.message = 'A new version is available. Please refresh your browser.';
  } else {
    response.data.update_available = false;
  }

  return new Response(
    JSON.stringify(response),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handlePost(request) {
  setCurrentRequest(request);
  cachedVersion = null;
  lastCheck = 0;
  const versionInfo = getAppVersion();

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { ...versionInfo, cache_cleared: true }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET = withErrorHandler(handleGet, 'version-check');
export const POST = withErrorHandler(handlePost, 'version-refresh');
