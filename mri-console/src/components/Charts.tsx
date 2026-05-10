'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Database } from 'lucide-react'
import { useMemo } from 'react'

interface DataPoint {
  time: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  data2?: DataPoint[]
  color?: string
  color2?: string
  maxValue?: number
  height?: number
}

function avgEveryXSeconds(data: DataPoint[]): DataPoint[] {
  const buckets = new Map<number, number[]>()

  const XSeconds = 10

  for (const d of data) {
    const bucket = Math.floor(new Date(d.time).getTime() / (XSeconds*1000)) * (XSeconds*1000)
    if (!buckets.has(bucket)) buckets.set(bucket, [])
    buckets.get(bucket)!.push(d.value)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ms, values]) => ({
      time: new Date(ms).toISOString(),
      value: values.reduce((a, b) => a + b, 0) / values.length
    }))
}

const WINDOW_S = 30 * 60

function MiniLineChart({ data, data2, color = '#4ade80', color2 = '#f87171', maxValue, height = 120 }: LineChartProps) {
  const w = 500
  const h = height
  const pad = { top: 8, right: 8, bottom: 24, left: 32 }
  const iw = w - pad.left - pad.right
  const ih = h - pad.top - pad.bottom

  const allValues = [...data.map(d => d.value), ...(data2?.map(d => d.value) ?? [])]
  const max = maxValue ?? Math.max(...allValues, 1) * 1.1
  const min = 0

  // fixed time domain: always [now - 30min, now]
  const nowMs = Date.now()
  const startMs = nowMs - WINDOW_S * 1000

  const toX = (ms: number) => pad.left + ((ms - startMs) / (WINDOW_S * 1000)) * iw
  const toY = (v: number) => pad.top + ih - ((v - min) / (max - min)) * ih

  const parseMs = (time: string) => new Date(time).getTime()

  const pathFor = (points: DataPoint[]) => {
    if (points.length < 2) return ''
    return points
      .map((d, i) => {
        const x = toX(parseMs(d.time))
        const y = toY(d.value)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const yTicks = [0, Math.round(max * 0.5), Math.round(max)]
  const xLabels = [
    { label: '-30m', ms: startMs },
    { label: '-15m', ms: startMs + (WINDOW_S * 1000) / 2 },
    { label: 'now',  ms: nowMs },
  ]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={pad.left} y1={toY(tick)}
            x2={pad.left + iw} y2={toY(tick)}
            stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
          />
          <text x={pad.left - 4} y={toY(tick) + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.4">
            {tick}
          </text>
        </g>
      ))}
      {xLabels.map(({ label, ms }) => (
        <text key={label} x={toX(ms)} y={h - 4} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.4">
          {label}
        </text>
      ))}
      <path d={pathFor(data)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {data2 && <path d={pathFor(data2)} fill="none" stroke={color2} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 2" />}
    </svg>
  )
}

interface ChartsProps {
  throughputData: DataPoint[]
  errorData: DataPoint[]
  dbConnectionData: DataPoint[]
}

export function Charts({ throughputData, errorData, dbConnectionData }: ChartsProps) {

  const throughput = useMemo(() => avgEveryXSeconds(throughputData), [throughputData])
  const errors     = useMemo(() => avgEveryXSeconds(errorData), [errorData])
  const dbConns    = useMemo(() => avgEveryXSeconds(dbConnectionData), [dbConnectionData])

  return (
    <div className="grid grid-cols-1 gap-4 px-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-muted-foreground" />
              api throughput & errors
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-blue-400" /> requests/s</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-red-400 border-dashed" /> errors/s</span>
          </div>
        </CardHeader>
        <CardContent>
          <MiniLineChart data={throughput} data2={errors} color="#60a5fa" color2="#f87171" height={130} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="size-4 text-muted-foreground" />
              db connection pool
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MiniLineChart
            data={dbConns}
            color="#4ade80"
            height={130}
          />

        </CardContent>
      </Card>
    </div>
  )
}
