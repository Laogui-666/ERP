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
    text: 'text-primary',
    bg: 'bg-primary/10',
  },
  success: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/20',
  },
  warning: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  error: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  info: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  accent: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
  },
}

export function StatCard({ label, value, sub, color = 'primary', icon }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-2 tracking-wide uppercase font-medium">{label}</p>
          <p className={cn('text-2xl font-bold tracking-tight leading-none', c.text)}>{value}</p>
          {sub && <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{sub}</p>}
        </div>
        {icon && (
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3',
            c.bg, c.text
          )}>
            <span className="opacity-80">{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}
