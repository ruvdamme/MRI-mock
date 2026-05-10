'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server } from 'lucide-react'

interface Pod {
  name: string
  status: 'running' | 'pending' | 'error'
  restarts: number
  age: string
}

interface PodHealthProps {
  pods: Pod[] | null
}

const statusColor = {
  running: 'bg-green-400',
  pending: 'bg-amber-400',
  error: 'bg-red-400',
}

export function PodHealth({ pods }: PodHealthProps) {
  const running = pods?.filter(p => p.status === 'running').length

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Server className="size-4 text-muted-foreground" />
            pod health
          </CardTitle>
          {pods !== null && (
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
              {running} / {pods?.length} running
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-3">
          {pods?.map((pod, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono">{pod.name}</p>
                <p className="text-xs text-muted-foreground">
                  restarts: {pod.restarts} · age: {pod.age}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${statusColor[pod.status]}`} />
                <span className="text-xs text-muted-foreground">{pod.status}</span>
              </div>
            </div>
          ))}
          {pods === null && (
            <p className="text-sm text-muted-foreground">Couldn't connect to the k8s cluster.</p>
          )}
          {pods?.length === 0 && (
            <p className="text-sm text-muted-foreground">loading…</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
