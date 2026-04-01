'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@shared/hooks/use-auth'

/**
 * 订单 Tab — 按角色分流
 * CUSTOMER → /customer/orders
 * 员工 → /admin/workspace
 */
export default function PortalOrdersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (user?.role === 'CUSTOMER') {
      router.replace('/customer/orders')
    } else {
      router.replace('/admin/workspace')
    }
  }, [user, isLoading, router])

  return (
    <div className="flex items-center justify-center py-20">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]" />
    </div>
  )
}
