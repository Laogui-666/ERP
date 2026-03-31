'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'
import { GlassCard } from '@shared/ui/glass-card'
import { apiFetch } from '@shared/lib/api-client'

export default function PortalProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    )
  }

  const isEmployee = user.role !== 'CUSTOMER'

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    COMPANY_OWNER: '公司负责人',
    CS_ADMIN: '客服部管理员',
    CUSTOMER_SERVICE: '客服',
    VISA_ADMIN: '签证部管理员',
    DOC_COLLECTOR: '资料员',
    OPERATOR: '签证操作员',
    OUTSOURCE: '外包业务员',
    CUSTOMER: '客户',
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* 用户信息卡片 */}
      <GlassCard intensity="medium" className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 border border-white/10">
            <span className="text-xl">{isEmployee ? '👤' : '🙋'}</span>
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
              {user.realName}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
              {ROLE_LABELS[user.role] || user.role}
              {user.company?.name && ` · ${user.company.name}`}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 菜单列表 */}
      <div className="mt-4 space-y-2">
        {/* ERP 管理入口（仅员工可见） */}
        {isEmployee && (
          <Link href="/admin/dashboard">
            <GlassCard intensity="light" hover className="flex items-center gap-3 p-4">
              <span className="text-lg">🖥️</span>
              <span className="text-[14px] text-[var(--color-text-primary)]">进入 ERP 管理后台</span>
              <svg className="ml-auto h-4 w-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </GlassCard>
          </Link>
        )}

        <Link href="/portal/orders">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4">
            <span className="text-lg">📋</span>
            <span className="text-[14px] text-[var(--color-text-primary)]">我的订单</span>
            <svg className="ml-auto h-4 w-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </GlassCard>
        </Link>

        <Link href="/portal/notifications">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4">
            <span className="text-lg">💬</span>
            <span className="text-[14px] text-[var(--color-text-primary)]">消息中心</span>
            <svg className="ml-auto h-4 w-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </GlassCard>
        </Link>

        {/* 退出登录 */}
        <button onClick={handleLogout} className="w-full">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4">
            <span className="text-lg">🚪</span>
            <span className="text-[14px] text-[var(--color-error)]">退出登录</span>
          </GlassCard>
        </button>
      </div>
    </div>
  )
}
