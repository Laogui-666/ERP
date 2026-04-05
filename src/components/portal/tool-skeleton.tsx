'use client'

import { GlassCard } from '@shared/ui/glass-card'

interface ToolSkeletonProps {
  count?: number
}

export function ToolSkeleton({ count = 3 }: ToolSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i} intensity="light" className="p-4 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-white/10 mb-2" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </GlassCard>
      ))}
    </div>
  )
}
