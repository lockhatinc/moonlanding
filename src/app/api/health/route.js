import { getDatabase } from '@/engine'
import { getAllMetrics } from '@/lib/metrics-collector.js'
import { getDatabaseStats } from '@/lib/db-monitor.js'
import { getCurrentResources } from '@/lib/resource-monitor.js'
import { getRecentAlerts } from '@/lib/alert-manager.js'

export const GET = async (request) => {
  try {
    const db = getDatabase()
    const start = process.hrtime.bigint()

    db.prepare('SELECT 1').get()

    const dbLatency = Number(process.hrtime.bigint() - start) / 1000000
    const url = new URL(request.url)
    const detailed = url.searchParams.get('detailed') === 'true'

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        latency: dbLatency
      }
    }

    if (detailed) {
      health.metrics = getAllMetrics()
      health.database.stats = getDatabaseStats()
      health.resources = getCurrentResources()
      health.alerts = getRecentAlerts(10)
      health.memory = {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      }
    }

    return new Response(
      JSON.stringify(health, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('[Health] Check failed:', error)
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export const HEAD = async (request) => {
  try {
    const db = getDatabase()
    db.prepare('SELECT 1').get()
    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('[Health] Check failed:', error)
    return new Response(null, { status: 503 })
  }
}
