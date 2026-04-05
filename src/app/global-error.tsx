'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 全局错误日志（生产环境可替换为 Sentry 等）
    console.error('[GlobalError]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html lang="zh-CN">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A1F2E, #252B3B)',
          color: '#E8ECF1',
          fontFamily: 'Inter, Noto Sans SC, system-ui, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(184, 124, 124, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 28,
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              系统出了点问题
            </h2>
            <p style={{ fontSize: 14, color: '#8E99A8', marginBottom: 24 }}>
              页面加载时发生错误，请稍后重试。如果问题持续存在，请联系管理员。
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                border: '1px solid rgba(124, 141, 166, 0.3)',
                background: 'linear-gradient(135deg, rgba(124, 141, 166, 0.4), rgba(124, 141, 166, 0.2))',
                color: '#E8ECF1',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
