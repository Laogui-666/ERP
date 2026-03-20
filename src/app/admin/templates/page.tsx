'use client'

import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="签证模板" description="管理签证资料清单模板" />
      <GlassCard className="p-12 text-center animate-fade-in-up">
        <svg className="w-16 h-16 mx-auto text-[var(--color-text-placeholder)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg text-[var(--color-text-primary)] font-medium">签证模板管理</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">M6 阶段开发中...</p>
      </GlassCard>
    </div>
  )
}
