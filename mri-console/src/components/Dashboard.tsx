'use client'
import { useState, useCallback, useEffect } from 'react'
import { useInterval } from '@/hooks/useInterval'
import { Header } from '@/components/Header'
import { MetricCards, METRICS } from '@/components/MetricCards'
import { Charts } from '@/components/Charts'
import { PodHealth } from '@/components/PodHealth'
import { ResourceUsage } from '@/components/ResourceUsage'
import { RecentLogs } from '@/components/RecentLogs'

interface DataPoint { time: string; value: number }

interface Pod {
  name: string
  status: 'running' | 'pending' | 'error'
  restarts: number
  age: string
}

interface LogEntry {
  time: string
  level: 'info' | 'warn' | 'error'
  service: string
  message: string
}

interface PodResource {
  pod: string
  cpu: string
  mem: string
  cpuColor: string
}

function cpuColor(pct: number) {
  if (pct > 80) return '#f87171'
  if (pct > 50) return '#fb923c'
  return '#4ade80'
}

export function Dashboard() {
  const [metricValues, setMetricValues] = useState<(number | null)[]>(METRICS.map(() => null))
  const [throughputData, setThroughputData] = useState<DataPoint[]>([])
  const [errorData, setErrorData] = useState<DataPoint[]>([])
  const [dbData, setDbData] = useState<DataPoint[]>([])
  const [pods, setPods] = useState<Pod[] | null>([])
  const [resources, setResources] = useState<PodResource[] | null>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [namespace, setNamespace] = useState('default')
  const [cluster, setCluster] = useState('mri-prod-gke')
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchMetrics = useCallback(async () => {
    const results = await Promise.all(
      METRICS.map(async (m) => {
        try {
          const res = await fetch(`/api/metrics?q=${encodeURIComponent(m.query)}`)
          const data = await res.json()
          return data.value ?? null
        } catch { return null }
      })
    )
    setMetricValues(results)
  }, [])

  const fetchCharts = useCallback(async () => {
    try {
      const [thrRes, errRes, dbRes] = await Promise.all([
        fetch('/api/metrics?q=' + encodeURIComponent('round(sum(rate(api_requests_total[5m])), 0.1)') + '&range=30'),
        fetch('/api/metrics?q=' + encodeURIComponent('round(sum(rate(api_requests_total{status_code="500"}[5m])), 0.01)') + '&range=30'),
        fetch('/api/metrics?q=' + encodeURIComponent('db_active_connections') + '&range=30'),
      ])
      const [thr, err, db] = await Promise.all([thrRes.json(), errRes.json(), dbRes.json()])
      if (Array.isArray(thr)) setThroughputData(thr)
      if (Array.isArray(err)) setErrorData(err)
      if (Array.isArray(db)) setDbData(db)
    } catch { /* charts optional */ }
  }, [])

  const fetchPods = useCallback(async () => {
    try {
      const res = await fetch('/api/pods')
      const data = await res.json()

      if (!data.success) {
        setPods(null)
        return
      }

      setPods(data.pods ?? [])
      if (data.namespace) setNamespace(data.namespace)
      if (data.cluster) setCluster(data.cluster)

      if (data.metricsAvailable && data.podMetrics) {
        const r: PodResource[] = Object.entries(data.podMetrics).map(([name, m]: [string, any]) => {
          const pod = data.pods.find((p: any) => p.name === name)
          const cpuVal = parseFloat(m.cpu)
          const cpuPct = pod?.cpuLimit ? Math.round((cpuVal / pod.cpuLimit) * 100) : null

          return {
            pod: name,
            cpu: cpuPct !== null ? `${cpuPct}%` : m.cpu,  // fall back to raw if no limit
            mem: m.mem,
            cpuColor: cpuPct !== null ? cpuColor(cpuPct) : '#999999',
          }
        })
        setResources(r)
      } else {
        setResources(null)
      }
    } catch { /* pods optional */ }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs')
      const data = await res.json()
      setLogs(data.logs ?? [])
    } catch { /* logs optional */ }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchMetrics(), fetchCharts(), fetchPods(), fetchLogs()])
    setLastUpdated(Date.now())
  }, [fetchMetrics, fetchCharts, fetchPods, fetchLogs])

  useEffect(() => { fetchAll() }, [fetchAll])
  useInterval(fetchAll, 5000)

  /* const warningCount = metricValues.filter((v, i) => {
    const m = METRICS[i]
    return m.warnAbove !== undefined && v !== null && v > m.warnAbove
  }).length */

  return (
    <div className="min-h-screen flex flex-col gap-4 pb-8">
      <Header
        namespace={namespace}
        cluster={cluster}
        lastUpdated={lastUpdated}
      /* hasWarning={warningCount > 0}
      warningCount={warningCount} */
      />
      <MetricCards values={metricValues} />
      <Charts
        throughputData={throughputData}
        errorData={errorData}
        dbConnectionData={dbData}
      />
      <div className="grid grid-cols-1 gap-4 px-6 lg:grid-cols-3">
        <PodHealth pods={pods} />
        <ResourceUsage resources={resources} />
        {/* <RecentLogs logs={logs} /> */}
      </div>
    </div>
  )
}
