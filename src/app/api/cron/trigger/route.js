import { runDueJobs } from '@/lib/job-framework';
import { SCHEDULED_JOBS } from '@/config/jobs';
import { create } from '@/engine';

export const runtime = 'nodejs';

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Verify cron secret token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.CRON_SECRET) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Run all due jobs
    const results = await runDueJobs(SCHEDULED_JOBS);
    const duration = Date.now() - startTime;

    // Log execution
    await create('job_execution_log', {
      timestamp: Math.floor(Date.now() / 1000),
      total_jobs: results.total || 0,
      executed_jobs: results.executed || 0,
      failed_jobs: results.failed || 0,
      duration_ms: duration,
      status: results.failed > 0 ? 'partial_failure' : 'success',
      error_details: results.errors || null
    }).catch(err => console.error('[Cron] Failed to log execution:', err.message));

    console.log(`[Cron] Executed ${results.executed || 0}/${results.total || 0} jobs in ${duration}ms`);

    return new Response(
      JSON.stringify({
        status: 'success',
        timestamp: new Date().toISOString(),
        total_jobs: results.total,
        executed_jobs: results.executed,
        failed_jobs: results.failed,
        duration_ms: duration,
        details: results.details || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Cron] Trigger failed:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request) {
  // Health check endpoint
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Cron trigger endpoint is active. Use POST with Bearer token to execute jobs.',
      timestamp: new Date().toISOString()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
