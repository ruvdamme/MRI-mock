'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface LogEntry {
  time: string|null
  level: 'info' | 'warn' | 'error'
  service: string
  message: string
}

interface RecentLogsProps {
  logs: LogEntry[]
}

const levelColor = {
  info: 'text-muted-foreground',
  warn: 'text-amber-400',
  error: 'text-red-400',
}

export function RecentLogs({ logs }: RecentLogsProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4 text-muted-foreground" />
            recent logs
          </CardTitle>
          <Badge variant="outline" className="text-xs">all services</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-2 font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 leading-relaxed">
              {log.time && <span className="shrink-0 text-muted-foreground/60">{log.time}</span>}
              <span className={`shrink-0 font-medium ${levelColor[log.level]}`}>{log.level}</span>
              <span className="shrink-0 text-primary/70">{log.service}</span>
              <span className="text-muted-foreground break-all">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-muted-foreground">loading…</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
