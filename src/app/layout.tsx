import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/glassmorphism.css'
import { ToastProvider } from '@/components/ui/toast'
import { DynamicBackground } from '@/components/layout/dynamic-bg'

export const metadata: Metadata = {
  title: '沐海旅行 - 签证ERP系统',
  description: '签证办理行业专属 SaaS 多租户 ERP 系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <DynamicBackground />
        <div className="relative z-10">
          <ToastProvider>
            {children}
          </ToastProvider>
        </div>
      </body>
    </html>
  )
}
