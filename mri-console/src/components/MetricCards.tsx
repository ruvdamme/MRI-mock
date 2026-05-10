'use client'
import { useState, useCallback, useEffect } from 'react'
import { useInterval } from '@/hooks/useInterval'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type MetricConfig = {
    label: string
    query: string
    unit?: string
    decimals?: number
    warnAbove?: number
}

const METRICS: MetricConfig[] = [
    {
        label: 'Active sessions',
        query: 'auth_active_sessions',
        decimals: 0,
    },
    {
        label: 'API throughput',
        query: 'round(sum(rate(api_requests_total[5m])), 0.1)',
        unit: ' req/s',
        decimals: 1,
    },
    {
        label: 'p95 latency',
        query:
            'round(histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m])) * 1000, 1)',
        unit: ' ms',
        decimals: 0,
        warnAbove: 500,
    },
    {
        label: 'Error rate',
        query:
            'round(sum(rate(api_requests_total{status_code="500"}[5m])) / sum(rate(api_requests_total[5m])) * 100, 0.1)',
        unit: '%',
        decimals: 1,
        warnAbove: 5,
    },
]


export function MetricCards() {
    const [values, setValues] = useState<(number | null)[]>(METRICS.map(() => null))

    const fetchAll = useCallback(async () => {
        const results = await Promise.all(
            METRICS.map(async (m) => {
                try {
                    const res = await fetch(`/api/metrics?q=${encodeURIComponent(m.query)}`)
                    const data = await res.json()
                    return data.value ?? null
                } catch {
                    return null
                }
            })
        )
        setValues(results)
    }, [])

    useEffect(() => {fetchAll()}, [fetchAll])

    useInterval(fetchAll, 5000)

    return (
        <div className="p-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {METRICS.map((metric, i) => {
                    const val = values[i]
                    const warn = metric.warnAbove !== undefined && val !== null && val > metric.warnAbove
                    const formatted =
                        val === null
                            ? '—'
                            : `${val.toFixed(metric.decimals ?? 0)}${metric.unit ?? ''}`

                    return (
                        <Card key={metric.label}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {metric.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tabular-nums">
                                    {formatted}
                                </p>
                                <div className="mt-3">
                                    {val === null ? (
                                        <Badge variant="outline">Loading…</Badge>
                                    ) : (
                                        <Badge variant={warn ? 'destructive' : 'secondary'}>
                                            {warn ? '↑ Above threshold' : '↑ Normal'}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
