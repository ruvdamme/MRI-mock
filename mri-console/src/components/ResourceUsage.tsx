'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu } from 'lucide-react'

interface PodResource {
  pod: string
  cpu: string
  mem: string
  cpuColor: string
}

interface ResourceUsageProps {
  resources: PodResource[]
}

export function ResourceUsage({ resources }: ResourceUsageProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Cpu className="size-4 text-muted-foreground" />
            resource usage
          </CardTitle>
          <span className="text-xs text-muted-foreground">cpu & memory per pod</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-2 text-left font-normal">pod</th>
              <th className="pb-2 text-right font-normal">cpu</th>
              <th className="pb-2 text-right font-normal">mem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {resources.map((r) => (
              <tr key={r.pod}>
                <td className="py-2 font-mono text-xs">{r.pod}</td>
                <td className="py-2 text-right" style={{ color: r.cpuColor }}>{r.cpu}</td>
                <td className="py-2 text-right text-muted-foreground">{r.mem}</td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted-foreground">loading…</td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
