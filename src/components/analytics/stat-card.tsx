import { GlassCard } from '@/components/layout/glass-card'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  icon?: React.ReactNode
}

const colorMap = {
  primary: 'text-[var(--color-primary-light)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
  info: 'text-[var(--color-info)]',
  accent: 'text-[var(--color-accent)]',
}

export function StatCard({ label, value, sub, color = 'primary', icon }: StatCardProps) {
  return (
    <GlassCard className="p-4 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--color-text-placeholder)] mb-1">{label}</p>
          <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
          {sub && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{sub}</p>}
        </div>
        {icon && <div className={`${colorMap[color]} opacity-60`}>{icon}</div>}
      </div>
    </GlassCard>
  )
}
