import * as k8s from '@kubernetes/client-node'

export async function GET() {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = await k8sApi.listNamespacedPod({ namespace: 'default' })
    const pods = res.items.filter((pod) => pod.metadata?.name?.includes('service'))

    const logLines: { time: string | null; level: string; service: string; message: string }[] = []

    for (const pod of pods) {
      const podName = pod.metadata?.name ?? ''
      try {
        const logRes = await k8sApi.readNamespacedPodLog({
          name: podName,
          namespace: 'default',
          tailLines: 10,
        })
        const lines = (logRes as unknown as string).split('\n').filter(Boolean)
        for (const line of lines) {
          const level = line.includes('error') || line.includes('ERROR') ? 'error'
            : line.includes('warn') || line.includes('WARN') ? 'warn'
              : 'info'
          const service = podName.split('-')[0]

          const timeMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
          let time = null
          let message = line
          if (timeMatch !== null) {
            time = new Date(timeMatch[0]).toLocaleTimeString('en-GB', { hour12: false })
            message = line.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?\s*/, '').trim()
          }

          logLines.push({
            time,
            level,
            service,
            message: message.slice(0, 80),
          })
        }
      } catch {
        // skip pod if logs unavailable
      }
    }

    logLines.sort((a, b) => {
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1
      return b.time.localeCompare(a.time)
    })

    return Response.json({ logs: logLines.slice(0, 20) })
  } catch {
    // mock logs
    const now = new Date()
    const t = (offset: number) => {
      const d = new Date(now.getTime() - offset * 1000)
      return d.toLocaleTimeString('en-GB', { hour12: false })
    }
    return Response.json({
      logs: [
        { time: t(5), level: 'info', service: 'auth', message: 'user_login userId=u_8821 duration=43ms' },
        { time: t(3), level: 'info', service: 'api', message: 'GET /v2/resource 200 38ms' },
        { time: t(1), level: 'warn', service: 'api', message: 'high latency detected: 780ms on POST /v2/submit' },
        { time: t(0), level: 'info', service: 'db', message: 'SELECT query 12ms rows=42' },
        { time: t(8), level: 'error', service: 'api', message: 'connection timeout to db-service after 5000ms' },
        { time: t(12), level: 'info', service: 'auth', message: 'token refresh userId=u_4421 duration=12ms' },
        { time: t(15), level: 'info', service: 'db', message: 'INSERT 3 rows 8ms' },
        { time: t(20), level: 'warn', service: 'db', message: 'slow query detected: 1200ms' },
      ],
    })
  }
}
