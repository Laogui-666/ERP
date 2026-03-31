'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@shared/hooks/use-auth'
import { NotificationBell } from '@shared/components/layout/notification-bell'
import { ChatRoomList } from '@erp/components/chat/chat-room-list'
import { USER_ROLE_LABELS } from '@shared/types/user'

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

function getBreadcrumb(pathname: string): string {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  const parentRoute = Object.keys(BREADCRUMB_MAP)
    .filter((route) => pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0]
  if (parentRoute) {
    const suffix = pathname.slice(parentRoute.length + 1)
    if (parentRoute === '/admin/orders' && suffix) return '订单详情'
    return BREADCRUMB_MAP[parentRoute]
  }
  return '页面'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="glass-topbar h-[60px] flex items-center justify-between px-6 ml-64">
      {/* 左侧：面包屑 */}
      <div className="flex items-center gap-2.5">
        <svg className="w-[15px] h-[15px] text-[var(--color-text-placeholder)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[var(--color-text-placeholder)] text-[13px] opacity-40">/</span>
        <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-wide">{breadcrumb}</span>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-4">
        {user?.role !== 'OUTSOURCE' && <ChatRoomList />}
        <NotificationBell />

        <div className="h-7 w-px bg-white/[0.06]" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-medium text-[var(--color-text-primary)] leading-tight">{user?.realName}</div>
            <div className="text-[11px] text-[var(--color-text-placeholder)] mt-0.5">
              {user?.role ? USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] ?? user.role : ''}
            </div>
          </div>

          <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/12 flex items-center justify-center text-[13px] font-semibold text-[var(--color-primary-light)] border border-white/[0.06]">
            {user?.realName?.[0] ?? '?'}
          </div>

          <button
            onClick={() => { void logout() }}
            className="p-2 rounded-lg text-[var(--color-text-placeholder)] transition-all duration-200 hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 active:scale-90"
            title="退出登录"
          >
            <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
