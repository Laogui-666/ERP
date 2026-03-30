'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/user'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: '工作台',
    roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: '订单管理',
    roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: '/admin/pool',
    label: '公共池',
    roles: ['VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: '/admin/workspace',
    label: '我的工作台',
    roles: ['CUSTOMER_SERVICE', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/templates',
    label: '签证模板',
    roles: ['COMPANY_OWNER', 'VISA_ADMIN', 'DOC_COLLECTOR'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/team',
    label: '团队管理',
    roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/analytics',
    label: '数据统计',
    roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role as UserRole)
  )

  return (
    <aside className="glass-sidebar fixed left-0 top-0 h-full w-64 z-40 flex flex-col">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 flex items-center justify-center border border-white/[0.06]">
            <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold text-[var(--color-text-primary)] tracking-tight">Visa ERP</span>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 mt-5 px-3 space-y-[2px] overflow-y-auto">
        {visibleItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item flex items-center gap-3 px-3 py-[10px] text-[13px] font-medium anim-initial animate-fade-in-left',
                isActive
                  ? 'nav-item-active text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)]',
              )}
              style={{ animationDelay: `${30 + index * 40}ms` }}
            >
              <span className={cn(
                'transition-colors duration-300',
                isActive ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-placeholder)]'
              )}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-[5px] h-[5px] rounded-full bg-[var(--color-primary)] animate-pulse-glow" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 底部用户信息 */}
      <div className="p-4 border-t border-white/[0.04]">
        <div className="glass-card-light px-3.5 py-3 rounded-xl">
          <div className="text-[11px] text-[var(--color-text-placeholder)] mb-2 tracking-wide uppercase">
            {user?.company?.name ?? '未关联公司'}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/10 flex items-center justify-center text-xs text-[var(--color-primary-light)] font-semibold border border-white/[0.06]">
              {user?.realName?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--color-text-primary)] font-medium truncate">{user?.realName ?? '未知'}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
