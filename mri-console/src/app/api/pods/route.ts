import * as k8s from '@kubernetes/client-node'

const parseCpu = (cpu: string): number => {
  if (cpu.endsWith('n')) return parseFloat(cpu) / 1_000_000
  if (cpu.endsWith('m')) return parseFloat(cpu)
  return parseFloat(cpu) * 1000
}

const parseMem = (mem: string): number =>
  mem.endsWith('Ki') ? parseFloat(mem) / 1024 :
    mem.endsWith('Gi') ? parseFloat(mem) * 1024 : parseFloat(mem)

export async function GET() {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
    const namespace = 'default'
    const clusterName = kc.getCurrentCluster()?.name ?? 'unknown'

    const res = await k8sApi.listNamespacedPod({ namespace })
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

      // Sum CPU/mem limits across all containers
      const containers = pod.spec?.containers ?? []
      const cpuLimit = containers.reduce((sum, c) => {
        const raw = c.resources?.limits?.['cpu']
        return sum + (raw ? parseCpu(raw) : 0)
      }, 0)
      const memLimit = containers.reduce((sum, c) => {
        const raw = c.resources?.limits?.['memory']
        return sum + (raw ? parseMem(raw) : 0)
      }, 0)

      return {
        name: pod.metadata?.name ?? 'unknown',
        status, restarts, age,
        cpuLimit: cpuLimit || null,   // null = no limit set
        memLimit: memLimit || null,
      }
    })

    let metricsAvailable = false
    let podMetrics: Record<string, { cpu: string; mem: string }> = {}

    try {
      const metricsClient = new k8s.Metrics(kc)
      const podMetricsList = await metricsClient.getPodMetrics(namespace)

      metricsAvailable = true

      for (const item of podMetricsList.items) {
        const cpu = item.containers.reduce((sum: number, c: any) => sum + parseCpu(c.usage.cpu), 0)
        const mem = item.containers.reduce((sum: number, c: any) => sum + parseMem(c.usage.memory), 0)
        podMetrics[item.metadata.name] = {
          cpu: `${cpu < 1 ? cpu.toFixed(1) : Math.round(cpu)}m`,
          mem: `${Math.round(mem)}Mi`,
        }
      }
    } catch (e) {
      console.error('metrics-server unavailable:', e)
    }

    return Response.json({ success: true, pods, namespace, cluster: clusterName, metricsAvailable, podMetrics })
  } catch (err) {
    console.error('k8s error:', err)
    return Response.json({ success: false })
  }
}