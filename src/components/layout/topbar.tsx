'use client'

import { useAuth } from '@/hooks/use-auth'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-morandi-cream font-medium">
          欢迎回来，{user?.realName ?? '用户'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-morandi-blue/30 flex items-center justify-center text-morandi-cream text-sm font-medium">
            {user?.realName?.[0] ?? '?'}
          </div>
          <div className="text-sm">
            <div className="text-morandi-cream font-medium">{user?.realName}</div>
            <div className="text-morandi-gray text-xs">{user?.role}</div>
          </div>
          <button
            onClick={() => { void logout() }}
            className="ml-2 text-morandi-gray hover:text-morandi-cream text-sm transition-colors"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  )
}
