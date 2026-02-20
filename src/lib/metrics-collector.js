// Comprehensive metrics collection
const metrics = {
  requests: new Map(),
  errors: new Map(),
  database: new Map(),
  resources: new Map(),
  custom: new Map()
}

const timings = new Map()
const errorCounts = new Map()
const resourceSamples = []
let maxSamples = 10000

function recordRequest(path, method, duration, status) {
  const key = `${method}:${path}`
  if (!metrics.requests.has(key)) {
    metrics.requests.set(key, [])
  }
  const arr = metrics.requests.get(key)
  arr.push({ duration, status, ts: Date.now() })
  if (arr.length > 1000) arr.shift()
}

function recordError(path, method, error, stack) {
  const key = `${method}:${path}`
  if (!metrics.errors.has(key)) {
    metrics.errors.set(key, [])
  }
  const arr = metrics.errors.get(key)
  arr.push({ error, stack, ts: Date.now() })
  if (arr.length > 100) arr.shift()

  const countKey = error || 'unknown'
  errorCounts.set(countKey, (errorCounts.get(countKey) || 0) + 1)
}

function recordDatabase(operation, duration, query) {
  const key = operation
  if (!metrics.database.has(key)) {
    metrics.database.set(key, [])
  }
  const arr = metrics.database.get(key)
  arr.push({ duration, query: query?.substring(0, 200), ts: Date.now() })
  if (arr.length > 1000) arr.shift()
}

function recordResource(cpu, memory, disk) {
  resourceSamples.push({ cpu, memory, disk, ts: Date.now() })
  if (resourceSamples.length > 1000) resourceSamples.shift()
}

function recordCustom(name, value, tags = {}) {
  const key = name
  if (!metrics.custom.has(key)) {
    metrics.custom.set(key, [])
  }
  const arr = metrics.custom.get(key)
  arr.push({ value, tags, ts: Date.now() })
  if (arr.length > 1000) arr.shift()
}

function getPercentile(values, percentile) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * percentile) - 1
  return sorted[Math.max(0, index)]
}

function getStats(dataArray, field = 'duration') {
  if (!dataArray || dataArray.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 }
  }

  const values = dataArray.map(d => d[field] || 0).filter(v => typeof v === 'number')
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 }
  }

  const sum = values.reduce((a, b) => a + b, 0)
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    p50: getPercentile(values, 0.50),
    p95: getPercentile(values, 0.95),
    p99: getPercentile(values, 0.99)
  }
}

function getRequestMetrics() {
  const result = {}
  for (const [key, data] of metrics.requests.entries()) {
    result[key] = getStats(data, 'duration')
  }
  return result
}

function getErrorMetrics() {
  const result = {
    byEndpoint: {},
    byCause: Object.fromEntries(errorCounts)
  }
  for (const [key, data] of metrics.errors.entries()) {
    result.byEndpoint[key] = { count: data.length, recent: data.slice(-5) }
  }
  return result
}

function getDatabaseMetrics() {
  const result = {}
  for (const [key, data] of metrics.database.entries()) {
    result[key] = getStats(data, 'duration')
  }
  return result
}

function getResourceMetrics() {
  if (resourceSamples.length === 0) return null
  const cpuVals = resourceSamples.map(s => s.cpu).filter(v => v != null)
  const memVals = resourceSamples.map(s => s.memory).filter(v => v != null)
  const diskVals = resourceSamples.map(s => s.disk).filter(v => v != null)

  return {
    cpu: cpuVals.length > 0 ? getStats(cpuVals.map((v, i) => ({ duration: v }))) : null,
    memory: memVals.length > 0 ? getStats(memVals.map((v, i) => ({ duration: v }))) : null,
    disk: diskVals.length > 0 ? getStats(diskVals.map((v, i) => ({ duration: v }))) : null
  }
}

function getAllMetrics() {
  return {
    requests: getRequestMetrics(),
    errors: getErrorMetrics(),
    database: getDatabaseMetrics(),
    resources: getResourceMetrics(),
    custom: Object.fromEntries(
      Array.from(metrics.custom.entries()).map(([k, v]) => [k, getStats(v, 'value')])
    ),
    timestamp: Date.now()
  }
}

function clearMetrics() {
  metrics.requests.clear()
  metrics.errors.clear()
  metrics.database.clear()
  metrics.custom.clear()
  resourceSamples.length = 0
  errorCounts.clear()
}

export {
  recordRequest,
  recordError,
  recordDatabase,
  recordResource,
  recordCustom,
  getRequestMetrics,
  getErrorMetrics,
  getDatabaseMetrics,
  getResourceMetrics,
  getAllMetrics,
  clearMetrics,
  getStats
}

if (typeof globalThis !== 'undefined') {
  globalThis.__metrics = {
    recordRequest,
    recordError,
    recordDatabase,
    recordResource,
    recordCustom,
    getAllMetrics,
    clearMetrics
  }
}
