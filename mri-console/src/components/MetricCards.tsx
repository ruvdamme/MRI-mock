'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Zap, Clock, AlertTriangle } from 'lucide-react'

type MetricConfig = {
  query: string
  icon: React.ReactNode
  label: string
  unit: string
  decimals: number
}

export const METRICS: MetricConfig[] = [
  {
    query: 'auth_active_sessions',
    icon: <Users className="size-4" />,
    label: 'active sessions',
    unit: '',
    decimals: 0,
  },
  {
    query: 'round(sum(rate(api_requests_total[5m])), 0.1)',
    icon: <Zap className="size-4" />,
    label: 'api throughput',
    unit: ' req/s',
    decimals: 0,
  },
  {
    query: 'round(histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m])) * 1000, 1)',
    icon: <Clock className="size-4" />,
    label: 'p95 latency',
    unit: ' ms',
    decimals: 0,
  },
  {
    query: 'round(sum(rate(api_requests_total{status_code="500"}[5m])) / sum(rate(api_requests_total[5m])) * 100, 0.1)',
    icon: <AlertTriangle className="size-4" />,
    label: 'error rate',
    unit: '%',
    decimals: 1,
  },
]

interface MetricCardsProps {
  values: (number | null)[]
}

export function MetricCards({ values }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 px-6">
      {METRICS.map((metric, i) => {
        const val = values[i]
        const formatted =
          val === null
            ? '—'
            : `${val.toFixed(metric.decimals ?? 0)}${metric.unit ?? ''}`

        return (
          <Card key={metric.label}>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                {metric.icon}
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-4xl font-bold tabular-nums tracking-tight">
                {formatted}
              </p>
              {val === null ? (
                <p className="mt-1 text-xs text-muted-foreground">loading…</p>
              ) : <p></p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
