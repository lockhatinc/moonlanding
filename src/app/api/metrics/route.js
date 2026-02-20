import { getAllMetrics, clearMetrics } from '@/lib/metrics-collector.js'
import { getRecentAlerts } from '@/lib/alert-manager.js'
import { getDatabaseStats } from '@/lib/db-monitor.js'
import { getCurrentResources } from '@/lib/resource-monitor.js'
import { getLogs } from '@/lib/log-aggregator.js'

export const GET = async (request) => {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'

    let data = {}

    if (type === 'all' || type === 'metrics') {
      data.metrics = getAllMetrics()
    }

    if (type === 'all' || type === 'alerts') {
      data.alerts = getRecentAlerts(50)
    }

    if (type === 'all' || type === 'database') {
      data.database = getDatabaseStats()
    }

    if (type === 'all' || type === 'resources') {
      data.resources = getCurrentResources()
    }

    if (type === 'all' || type === 'logs') {
      const level = url.searchParams.get('level')
      const since = url.searchParams.get('since')
      const search = url.searchParams.get('search')
      const limit = parseInt(url.searchParams.get('limit')) || 100

      data.logs = getLogs({ level, since, search, limit })
    }

    return new Response(
      JSON.stringify(data, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('[Metrics] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export const DELETE = async (request) => {
  try {
    clearMetrics()

    return new Response(
      JSON.stringify({ success: true, message: 'Metrics cleared' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('[Metrics] Clear error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
