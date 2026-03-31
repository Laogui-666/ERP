import { GlassCard } from '@shared/ui/glass-card'

interface RankingItem {
  name: string
  [key: string]: string | number
}

interface RankingTableProps {
  title: string
  items: RankingItem[]
  columns: { key: string; label: string; format?: (v: unknown) => string }[]
  emptyText?: string
}

export function RankingTable({ title, items, columns, emptyText = '暂无数据' }: RankingTableProps) {
  return (
    <GlassCard className="p-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-text-placeholder)] text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              <span className={`text-xs font-medium w-5 text-center ${
                i === 0 ? 'text-[var(--color-warning)]' :
                i === 1 ? 'text-[var(--color-text-secondary)]' :
                i === 2 ? 'text-[var(--color-accent)]' :
                'text-[var(--color-text-placeholder)]'
              }`}>
                {i + 1}
              </span>
              <span className="text-sm text-[var(--color-text-primary)] flex-1 min-w-0 truncate">
                {item.name}
              </span>
              {columns.map(col => (
                <span key={col.key} className="text-xs text-[var(--color-text-secondary)] text-right whitespace-nowrap">
                  {col.format ? col.format(item[col.key]) : String(item[col.key] ?? '-')}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
