import type { Metadata } from 'next'
import '@shared/styles/globals.css'
import '@shared/styles/glassmorphism.css'
import '@shared/styles/liquid-globals.css'
import '@shared/styles/glass-morphism.css'
import { ToastProvider } from '@shared/ui/toast'


export const metadata: Metadata = {
  title: '华夏签证 - 一站式签证服务平台',
  description: '专业签证办理 · 智能工具 · 一站式服务',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased glass-background">
        <div className="relative z-10">
          <ToastProvider>
            {children}
          </ToastProvider>
        </div>
      </body>
    </html>
  )
}
