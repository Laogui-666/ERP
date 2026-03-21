'use client'

import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="数据统计" description="运营数据与绩效分析" />
      <GlassCard className="p-12 text-center animate-fade-in-up">
        <svg className="w-16 h-16 mx-auto text-[var(--color-text-placeholder)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg text-[var(--color-text-primary)] font-medium">数据统计</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">M5 阶段开发中...</p>
      </GlassCard>
    </div>
  )
}
