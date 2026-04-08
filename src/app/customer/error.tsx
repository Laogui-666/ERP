'use client'

import { useEffect } from 'react'
import { LiquidCard } from '@design-system/components/liquid-card'

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
      <LiquidCard className="p-6 max-w-sm text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-liquid-ruby/15 flex items-center justify-center text-xl">
          ⚠️
        </div>
        <h2 className="text-base font-semibold text-liquid-deep mb-2">
          加载失败
        </h2>
        <p className="text-xs text-liquid-mist mb-4">
          页面遇到了问题，请重试
        </p>
        <button
          onClick={reset}
          className="glass-btn-primary w-full py-2.5 text-sm font-medium"
        >
          重新加载
        </button>
      </LiquidCard>
    </div>
  )
}
