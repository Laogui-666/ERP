'use client'

import { GlassCard } from '@shared/ui/glass-card'

interface ToolEmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function ToolEmptyState({ icon, title, description, action }: ToolEmptyStateProps) {
  return (
    <GlassCard intensity="medium" className="flex flex-col items-center gap-3 p-10">
      <span className="text-4xl">{icon}</span>
      <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{title}</p>
      <p className="text-[13px] text-[var(--color-text-secondary)] text-center">{description}</p>
      {action}
    </GlassCard>
  )
}
