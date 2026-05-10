import * as k8s from '@kubernetes/client-node'

export async function GET() {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = await k8sApi.listNamespacedPod({ namespace: 'default' })
    const pods = res.items.map((pod) => {
      const containerStatuses = pod.status?.containerStatuses ?? []
      const ready = containerStatuses.every((cs) => cs.ready)
      const restarts = containerStatuses.reduce((sum, cs) => sum + (cs.restartCount ?? 0), 0)
      const startTime = pod.status?.startTime
      const ageMs = startTime ? Date.now() - new Date(startTime).getTime() : 0
      const ageHours = Math.floor(ageMs / 1000 / 60 / 60)
      const ageMin = Math.floor((ageMs / 1000 / 60) % 60)
      const age = ageHours > 0 ? `${ageHours}h` : `${ageMin}m`

      const phase = pod.status?.phase ?? 'Unknown'
      const status = ready ? 'running' : phase === 'Pending' ? 'pending' : 'error'

      return {
        name: pod.metadata?.name ?? 'unknown',
        status,
        restarts,
        age,
      }
    })

    const namespace = 'default'
    const cluster = kc.getCurrentCluster()?.name ?? 'unknown'

    return Response.json({ success: true, pods, namespace, cluster })
  } catch (err) {
    console.error('k8s error:', err)
    return Response.json({ success: false })
  }
}
