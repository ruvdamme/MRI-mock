'use client'
import { useEffect } from 'react'

export function useInterval(fn: () => void, ms: number) {
  useEffect(() => {
    const id = setInterval(fn, ms)
    return () => clearInterval(id)
  }, [fn, ms])
}