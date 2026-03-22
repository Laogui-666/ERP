'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/customer/orders', label: '订单', icon: '📋' },
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      {/* 客户端顶部导航 */}
      <header className="glass-topbar sticky top-0 z-50 px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            沐海旅行
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-secondary)]">
              {user?.realName ?? ''}
            </span>
            <button
              onClick={() => { void logout() }}
              className="text-xs text-[var(--color-text-placeholder)] hover:text-[var(--color-error)] transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="mx-auto max-w-lg px-4 py-4 pb-20">
        {children}
      </main>

      {/* 底部Tab栏（已路由化的Tab + 待M3实现的Tab） */}
      <nav className="glass-topbar fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1 transition-colors',
                  isActive
                    ? 'text-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-placeholder)]',
                )}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-[var(--color-primary)]" />}
              </Link>
            )
          })}
          {/* 待 M3 实现的 Tab（暂为静态占位） */}
          {[
            { icon: '💬', label: '消息' },
            { icon: '👤', label: '我的' },
          ].map((tab) => (
            <button
              key={tab.label}
              className="flex flex-col items-center gap-1 px-4 py-1 opacity-40 cursor-not-allowed"
              disabled
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs text-[var(--color-text-placeholder)]">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
