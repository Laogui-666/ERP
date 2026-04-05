'use client'

import { useState } from 'react'
import { Sidebar } from '@erp/components/layout/sidebar'
import { Topbar } from '@erp/components/layout/topbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* 桌面端侧边栏 */}
      <Sidebar />

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 移动端侧边栏抽屉 */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* 移动端顶栏 */}
      <header className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 z-30 md:hidden bg-background/80 backdrop-blur-md border-b border-border">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-bold text-foreground tracking-tight">Visa ERP</span>
      </header>

      {/* 桌面端顶栏 */}
      <div className="hidden md:block">
        <Topbar />
      </div>

      {/* 主内容区 */}
      <main className="pt-14 md:ml-64 md:pt-16 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
