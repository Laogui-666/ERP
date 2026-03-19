import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/glassmorphism.css'

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
        <div className="bg-decoration" />
        {children}
      </body>
    </html>
  )
}
