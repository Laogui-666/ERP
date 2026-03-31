import { GlassCard } from '@shared/ui/glass-card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '申请表助手 - 沐海旅行' }

export default function FormHelperPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-[22px] font-bold text-[var(--color-text-primary)]">📝 申请表助手</h1>
      <GlassCard intensity="medium" className="flex flex-col items-center gap-3 p-10">
        <span className="text-4xl">🚧</span>
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">即将上线</p>
        <p className="text-[13px] text-[var(--color-text-secondary)] text-center">
          签证申请表逐步填写指导<br />敬请期待
        </p>
      </GlassCard>
    </div>
  )
}
