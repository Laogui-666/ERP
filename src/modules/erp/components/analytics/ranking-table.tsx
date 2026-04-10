

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
    <div className="glass-card rounded-xl p-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-glass-primary mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-glass-muted text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-glass-primary/5 hover:bg-glass-primary/10 transition-colors"
            >
              <span className={`text-xs font-medium w-5 text-center ${
                i === 0 ? 'text-yellow-500' :
                i === 1 ? 'text-glass-muted' :
                i === 2 ? 'text-purple-500' :
                'text-glass-muted'
              }`}>
                {i + 1}
              </span>
              <span className="text-sm text-glass-primary flex-1 min-w-0 truncate">
                {item.name}
              </span>
              {columns.map(col => (
                <span key={col.key} className="text-xs text-glass-muted text-right whitespace-nowrap">
                  {col.format ? col.format(item[col.key]) : String(item[col.key] ?? '-')}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
