import { renderMonitoringDashboard } from '@/ui/monitoring-dashboard.js'

export const GET = async (request) => {
  try {
    const html = renderMonitoringDashboard()

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html, 'utf-8').toString()
      }
    })
  } catch (error) {
    console.error('[MonitoringDashboard] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
