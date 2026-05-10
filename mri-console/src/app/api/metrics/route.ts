import { getMetric, getMetricRange } from '@/lib/prometheus'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const range = searchParams.get('range') // optional: ?range=30

  if (!q) {
    return Response.json({ error: 'Missing query param: q' }, { status: 400 })
  }

  try {
    if (range) {
      const data = await getMetricRange(q, parseInt(range))
      return Response.json(data)
    }
    const value = await getMetric(q)
    return Response.json({ value })
  } catch (err) {
    console.error('Prometheus query failed:', err)
    return Response.json({ error: 'Prometheus query failed' }, { status: 500 })
  }
}
