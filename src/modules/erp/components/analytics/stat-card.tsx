import { GlassCard } from '@shared/ui/glass-card'
import { cn } from '@shared/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  icon?: React.ReactNode
}

const colorMap = {
  primary: {
    text: 'text-[var(--color-primary-light)]',
    bg: 'bg-[var(--color-primary)]/10',
    glow: 'shadow-[var(--color-primary)]/5',
  },
  success: {
    text: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success)]/10',
    glow: 'shadow-[var(--color-success)]/5',
  },
  warning: {
    text: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning)]/10',
    glow: 'shadow-[var(--color-warning)]/5',
  },
  error: {
    text: 'text-[var(--color-error)]',
    bg: 'bg-[var(--color-error)]/10',
    glow: 'shadow-[var(--color-error)]/5',
  },
  info: {
    text: 'text-[var(--color-info)]',
    bg: 'bg-[var(--color-info)]/10',
    glow: 'shadow-[var(--color-info)]/5',
  },
  accent: {
    text: 'text-[var(--color-accent)]',
    bg: 'bg-[var(--color-accent)]/10',
    glow: 'shadow-[var(--color-accent)]/5',
  },
}

export function StatCard({ label, value, sub, color = 'primary', icon }: StatCardProps) {
  const c = colorMap[color]

  return (
    <GlassCard className="p-4.5" intensity="medium">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[var(--color-text-placeholder)] mb-2 tracking-wide uppercase font-medium">{label}</p>
          <p className={cn('text-[22px] font-bold tracking-tight leading-none', c.text)}>{value}</p>
          {sub && <p className="text-[12px] text-[var(--color-text-secondary)] mt-1.5 leading-snug">{sub}</p>}
        </div>
        {icon && (
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ml-3',
            c.bg, c.text
          )}>
            <span className="opacity-70">{icon}</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
