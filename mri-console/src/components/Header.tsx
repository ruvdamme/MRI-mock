'use client'
import { Badge } from '@/components/ui/badge'
import { useInterval } from '@/hooks/useInterval'
import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HeaderProps {
  namespace: string
  cluster: string
  lastUpdated: number | null
  //hasWarning: boolean
  //warningCount: number
}

export function Header({ 
  namespace, 
  cluster, 
  lastUpdated, 
  //hasWarning, 
  //warningCount 
}: HeaderProps) {
  
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null)

  const updateSecondsAgo = () => {
    setSecondsAgo(
      lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null
    )
  }

  useEffect(() => { updateSecondsAgo() }, [updateSecondsAgo])
  useInterval(updateSecondsAgo, 1000)
  
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold">MRI developer console</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          namespace: {namespace} · cluster: {cluster}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* <Badge variant="outline" className="gap-1.5 border-green-500/40 text-green-400">
          <span className="size-1.5 rounded-full bg-green-400 inline-block" />
          all systems operational
        </Badge>
        {hasWarning && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-400">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </Badge>
        )} */}
        {secondsAgo !== null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="size-3" />
            {secondsAgo}s ago
          </span>
        )}
      </div>
    </div>
  )
}
