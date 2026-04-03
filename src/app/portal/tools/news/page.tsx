'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { apiFetch } from '@shared/lib/api-client'
import { ToolPageHeader } from '@/components/portal/tool-page-header'
import { ToolSkeleton } from '@/components/portal/tool-skeleton'
import { ToolEmptyState } from '@/components/portal/tool-empty-state'

interface Article {
  id: string
  title: string
  coverImage: string | null
  category: string
  tags: unknown
  viewCount: number
  isPinned: boolean
  publishedAt: string | null
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('')

  const categories = ['全部', '政策解读', '攻略指南', '热门国家', '签证动态']

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ pageSize: '20' })
      if (category && category !== '全部') params.set('category', category)
      const res = await apiFetch(`/api/news?${params}`)
      const json = await res.json()
      if (json.success) setArticles(json.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <ToolPageHeader
        icon="📰"
        title="签证资讯"
        description="各国签证政策、攻略、动态实时更新"
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c === '全部' ? '' : c)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
              (c === '全部' && !category) || category === c
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/5 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <ToolSkeleton count={3} />
      ) : articles.length === 0 ? (
        <ToolEmptyState
          icon="📭"
          title="暂无资讯"
          description="管理员发布后将在此显示"
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => (
            <GlassCard key={article.id} intensity="light" hover className="p-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {article.isPinned && (
                    <span className="mb-1 inline-block rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] text-[var(--color-accent)]">📌 置顶</span>
                  )}
                  <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] line-clamp-2">{article.title}</h3>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--color-text-placeholder)]">
                    <span className="rounded bg-white/5 px-2 py-0.5">{article.category}</span>
                    <span>👁 {article.viewCount}</span>
                    <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
