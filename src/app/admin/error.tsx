'use client'

import { useEffect } from 'react'
import { LiquidCard } from '@design-system/components/liquid-card'

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
      <LiquidCard className="p-8 max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-liquid-ruby/15 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h2 className="text-lg font-semibold text-liquid-deep mb-2">
          页面加载失败
        </h2>
        <p className="text-sm text-liquid-mist mb-6">
          该页面在渲染时发生了错误。你可以尝试重新加载，或者返回上一页。
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm rounded-xl bg-liquid-ocean/5 text-liquid-mist hover:bg-liquid-ocean/10 transition-all"
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
          <p className="mt-4 text-xs text-liquid-mist/60">
            错误编号: {error.digest}
          </p>
        )}
      </LiquidCard>
    </div>
  )
}
