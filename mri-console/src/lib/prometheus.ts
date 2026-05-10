import axios from 'axios'

const PROM = process.env.PROMETHEUS_URL

export async function getMetric(promql: string): Promise<number> {
  const res = await axios.get(`${PROM}/api/v1/query`, {
    params: { query: promql }
  })
  const result = res.data.data.result[0]
  return result ? parseFloat(result.value[1]) : 0
}

export async function getMetricRange(promql: string, minutes = 30) {
  const now = Math.floor(Date.now() / 1000)
  const res = await axios.get(`${PROM}/api/v1/query_range`, {
    params: {
      query: `${promql}`,
      start: now - minutes * 60,
      end: now,
      step: '5s'
    }
  })

  const results = res.data.data.result
  if (!results.length) return []

  // merge all series by timestamp, summing values across pods
  const merged = new Map<number, number>()
  for (const series of results) {
    for (const [ts, val] of series.values) {
      merged.set(ts, (merged.get(ts) ?? 0) + parseFloat(val))
    }
  }

  return Array.from(merged.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, val]) => ({
      time: new Date(ts * 1000).toISOString(),
      value: parseFloat(val.toFixed(2))
    }))
}
