'use client'

import { useEffect } from 'react'
import { GlassCard } from '@shared/ui/glass-card'

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CustomerError]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <GlassCard className="p-6 max-w-sm text-center animate-fade-in-up">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-error)]/15 flex items-center justify-center text-xl">
          ⚠️
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
          加载失败
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">
          页面遇到了问题，请重试
        </p>
        <button
          onClick={reset}
          className="glass-btn-primary w-full py-2.5 text-sm font-medium"
        >
          重新加载
        </button>
      </GlassCard>
    </div>
  )
}
