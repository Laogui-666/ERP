'use client'

import { useEffect } from 'react'
import { Card } from '@shared/ui/card'
import { Button } from '@shared/ui/button'

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
      <Card padding="lg" className="max-w-sm text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-glass-error/15 flex items-center justify-center text-xl">
          ⚠️
        </div>
        <h2 className="text-base font-semibold text-glass-primary mb-2">
          加载失败
        </h2>
        <p className="text-xs text-glass-muted mb-4">
          页面遇到了问题，请重试
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={reset}
          className="w-full"
        >
          重新加载
        </Button>
      </Card>
    </div>
  )
}
