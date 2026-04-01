'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@shared/hooks/use-auth'

/**
 * 消息 Tab — 按角色分流
 * CUSTOMER → /customer/notifications
 * 员工 → /admin/dashboard（管理端通过顶栏铃铛查看通知）
 */
export default function PortalNotificationsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (user?.role === 'CUSTOMER') {
      router.replace('/customer/notifications')
    } else {
      router.replace('/admin/dashboard')
    }
  }, [user, isLoading, router])

  return (
    <div className="flex items-center justify-center py-20">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]" />
    </div>
  )
}
