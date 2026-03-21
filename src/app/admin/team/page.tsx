'use client'

import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="团队管理" description="管理员工与部门" />
      <GlassCard className="p-12 text-center animate-fade-in-up">
        <svg className="w-16 h-16 mx-auto text-[var(--color-text-placeholder)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-lg text-[var(--color-text-primary)] font-medium">团队管理</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">M5 阶段开发中...</p>
      </GlassCard>
    </div>
  )
}
