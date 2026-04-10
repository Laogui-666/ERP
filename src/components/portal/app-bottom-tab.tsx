'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'
import { motion } from 'framer-motion'

const TABS = [
  { href: '/', label: '首页', icon: HomeIcon },
  { href: '/services', label: '服务', icon: ServiceIcon },
  { href: '/tools', label: '工具', icon: ToolIcon },
  { href: '/portal/orders', label: '订单', icon: OrderIcon },
  { href: '/portal/profile', label: '我的', icon: UserIcon },
]

export function AppBottomTab() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-glass-border-light glass-navbar safe-area-bottom md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname === tab.href || pathname.startsWith(tab.href + '/')

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-4 py-1 transition-colors duration-200 glass-hover',
                isActive
                  ? 'text-glass-primary'
                  : 'text-glass-text-muted hover:text-glass-text-primary'
              )}
            >
              <tab.icon active={isActive} />
              <span className="text-[11px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="bottomTab"
                  className="absolute -bottom-0.5 h-[2px] w-5 rounded-full bg-glass-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ==================== Tab 图标 ====================

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-glass-primary' : 'text-glass-text-muted'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function ServiceIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-glass-primary' : 'text-glass-text-muted'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}

function ToolIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-glass-primary' : 'text-glass-text-muted'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-3.73m0 0l-1.92 5.27m1.92-5.27l5.27 1.92M17.7 15.17l5.1-3.73m0 0l1.92 5.27m-1.92-5.27l-5.27 1.92M6.78 8.83l5.1 3.73m0 0l1.92-5.27M11.88 12.56l-5.27-1.92M17.7 8.83l-5.1 3.73m0 0l-1.92-5.27m1.92 5.27l5.27-1.92" />
    </svg>
  )
}

function OrderIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-glass-primary' : 'text-glass-text-muted'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function UserIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-glass-primary' : 'text-glass-text-muted'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}
