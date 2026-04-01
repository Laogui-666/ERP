'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'
import { PortalTopbar } from '@/components/portal/portal-topbar'

const TABS = [
  { href: '/', label: '首页', icon: HomeIcon },
  { href: '/portal/orders', label: '订单', icon: OrderIcon },
  { href: '/portal/notifications', label: '消息', icon: BellIcon },
  { href: '/portal/profile', label: '我的', icon: UserIcon },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      <PortalTopbar />

      {/* 内容区（顶栏 56px + 底部 Tab 68px） */}
      <main className="flex-1 pb-[68px] pt-14">{children}</main>

      {/* 底部 Tab 导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[rgba(22,27,41,0.92)] backdrop-blur-xl safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {TABS.map((tab) => {
            const isActive =
              tab.href === '/'
                ? pathname === '/'
                : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1 transition-colors duration-200',
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                <tab.icon active={isActive} />
                <span className="text-[11px] font-medium">{tab.label}</span>
                {isActive && (
                  <div className="h-[2px] w-5 rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

// Tab 图标组件
function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function OrderIcon({ active }: { active?: boolean }) {
  return (
    <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function BellIcon({ active }: { active?: boolean }) {
  return (
    <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function UserIcon({ active }: { active?: boolean }) {
  return (
    <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}
