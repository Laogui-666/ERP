'use client'

import { useEffect } from 'react'
import { GlassCard } from '@/components/layout/glass-card'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="p-8 max-w-md text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-error)]/15 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          页面加载失败
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          该页面在渲染时发生了错误。你可以尝试重新加载，或者返回上一页。
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
          >
            返回上一页
          </button>
          <button
            onClick={reset}
            className="glass-btn-primary px-6 py-2 text-sm font-medium"
          >
            重新加载
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-[var(--color-text-placeholder)]">
            错误编号: {error.digest}
          </p>
        )}
      </GlassCard>
    </div>
  )
}
