'use client'

import { useEffect } from 'react'
import { Card } from '@shared/ui/card'
import { Button } from '@shared/ui/button'

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
      <Card padding="lg" className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass-error/15 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h2 className="text-lg font-semibold text-glass-primary mb-2">
          页面加载失败
        </h2>
        <p className="text-sm text-glass-muted mb-6">
          该页面在渲染时发生了错误。你可以尝试重新加载，或者返回上一页。
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => window.history.back()}
          >
            返回上一页
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={reset}
          >
            重新加载
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-glass-muted/60">
            错误编号: {error.digest}
          </p>
        )}
      </Card>
    </div>
  )
}
