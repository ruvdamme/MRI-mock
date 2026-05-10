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
      query: promql,
      start: now - minutes * 60,
      end: now,
      step: '15s'
    }
  })
  return res.data.data.result[0]?.values.map(([ts, val]: any) => ({
    time: new Date(ts * 1000).toLocaleTimeString(),
    value: parseFloat(parseFloat(val).toFixed(2))
  })) ?? []
}