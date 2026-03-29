'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ChatRoomList } from '@/components/chat/chat-room-list'
import { USER_ROLE_LABELS } from '@/types/user'

// 面包屑映射
const BREADCRUMB_MAP: Record<string, string> = {
  '/admin/dashboard': '工作台',
  '/admin/orders': '订单管理',
  '/admin/pool': '公共池',
  '/admin/workspace': '我的工作台',
  '/admin/templates': '签证模板',
  '/admin/team': '团队管理',
  '/admin/analytics': '数据统计',
  '/admin/settings': '系统设置',
}

/**
 * 获取面包屑文本
 * 支持子路由：/admin/orders/abc123 → 订单管理 / 订单详情
 */
function getBreadcrumb(pathname: string): string {
  // 精确匹配
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]

  // 子路由匹配：取最长前缀
  const parentRoute = Object.keys(BREADCRUMB_MAP)
    .filter((route) => pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0]

  if (parentRoute) {
    const suffix = pathname.slice(parentRoute.length + 1)
    // /admin/orders/[id] → 订单详情
    if (parentRoute === '/admin/orders' && suffix) return '订单详情'
    return BREADCRUMB_MAP[parentRoute]
  }

  return '页面'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // 面包屑
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="glass-topbar h-16 flex items-center justify-between px-6 ml-64">
      {/* 左侧：面包屑 */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[var(--color-text-placeholder)] text-sm">/</span>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{breadcrumb}</span>
      </div>

      {/* 右侧：通知 + 用户 */}
      <div className="flex items-center gap-5">
        {user?.role !== 'OUTSOURCE' && <ChatRoomList />}
        <NotificationBell />

        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">{user?.realName}</div>
            <div className="text-xs text-[var(--color-text-placeholder)]">
              {user?.role ? USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] ?? user.role : ''}
            </div>
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 flex items-center justify-center text-sm font-medium text-[var(--color-primary-light)] border border-white/5">
            {user?.realName?.[0] ?? '?'}
          </div>

          <button
            onClick={() => { void logout() }}
            className="p-2 rounded-lg text-[var(--color-text-placeholder)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-200"
            title="退出登录"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
