import { withErrorHandler } from '@/lib/with-error-handler';
import { ok } from '@/lib/response-formatter';
import { requireAuth } from '@/lib/auth-middleware';

let dualRouter = null;

async function getDualRouter() {
  if (!dualRouter) {
    try {
      const module = await import('@/lib/dual-database-router');
      dualRouter = module;
      if (!module.getDatabaseStatus) {
        module.initializeDualDatabaseRouter();
      }
    } catch (e) {
      console.error('[DualRouting] Failed to load router:', e.message);
      throw new Error('Dual routing not available');
    }
  }
  return dualRouter;
}

export const GET = withErrorHandler(async (request) => {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    return new NextResponse({ error: 'Admin access required' }, { status: 403 });
  }

  const router = await getDualRouter();
  const status = router.getRoutingStatus();
  return ok(status);
}, 'GET /admin/dual-routing');

export const POST = withErrorHandler(async (request) => {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    return new NextResponse({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { action, mode, primary } = body;
  const router = await getDualRouter();

  if (action === 'initialize') {
    router.initializeDualDatabaseRouter();
    return ok({ success: true, message: 'Dual routing initialized' });
  }

  if (action === 'set-write-mode') {
    if (!['moonlanding', 'friday', 'dual'].includes(mode)) {
      return new NextResponse({ error: 'Invalid write mode' }, { status: 400 });
    }
    router.setRoutingMode(mode);
    return ok({ success: true, writeMode: mode });
  }

  if (action === 'set-read-primary') {
    if (!['moonlanding', 'friday'].includes(primary)) {
      return new NextResponse({ error: 'Invalid read primary' }, { status: 400 });
    }
    router.setReadPrimary(primary);
    return ok({ success: true, readPrimary: primary });
  }

  if (action === 'get-telemetry') {
    const telemetry = router.getTelemetry();
    return ok(telemetry);
  }

  if (action === 'reset-telemetry') {
    router.resetTelemetry();
    return ok({ success: true, message: 'Telemetry reset' });
  }

  return new NextResponse({ error: 'Unknown action' }, { status: 400 });
}, 'POST /admin/dual-routing');
