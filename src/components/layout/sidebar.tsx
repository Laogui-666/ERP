'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: '工作台', icon: '📊' },
  { href: '/orders', label: '订单管理', icon: '📋' },
  { href: '/pool', label: '公共池', icon: '🏊' },
  { href: '/users', label: '员工管理', icon: '👥' },
  { href: '/departments', label: '部门管理', icon: '🏢' },
  { href: '/templates', label: '签证模板', icon: '📝' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-black/30 backdrop-blur-xl border-r border-white/10 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <span className="text-xl font-bold text-morandi-cream tracking-wide">Visa ERP</span>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(`/admin${item.href}`)
          return (
            <Link
              key={item.href}
              href={`/admin${item.href}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-morandi-blue/30 text-morandi-cream shadow-md'
                  : 'text-morandi-gray hover:text-morandi-cream hover:bg-white/5',
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="text-xs text-morandi-gray text-center">
          Visa ERP v0.1.0
        </div>
      </div>
    </aside>
  )
}
