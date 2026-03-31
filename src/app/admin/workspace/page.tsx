'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { GlassCard } from '@shared/ui/glass-card'
import { PageHeader } from '@shared/components/layout/page-header'
import { formatDateTime } from '@shared/lib/utils'
import { USER_ROLE_LABELS } from '@shared/types/user'
import type { Order } from '@erp/types/order'

export default function WorkspacePage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<{ total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ todayCount: 0, pending: 0, inProgress: 0 })

  const fetchMyOrders = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // 获取我的订单
      const res = await apiFetch('/api/orders?page=1&pageSize=50')
      const json = await res.json()
      if (json.success) {
        setOrders(json.data)
        setMeta(json.meta ?? null)

        // 统计
        const today = new Date().toISOString().split('T')[0]
        const todayOrders = json.data.filter((o: Order) => o.createdAt.startsWith(today))
        const pending = json.data.filter((o: Order) =>
          ['PENDING_CONNECTION', 'PENDING_REVIEW', 'PENDING_DELIVERY'].includes(o.status)
        )
        const inProgress = json.data.filter((o: Order) =>
          ['CONNECTED', 'COLLECTING_DOCS', 'UNDER_REVIEW', 'MAKING_MATERIALS'].includes(o.status)
        )
        setStats({
          todayCount: todayOrders.length,
          pending: pending.length,
          inProgress: inProgress.length,
        })
      }
    } catch {
      // 网络错误静默处理（页面会显示空状态）
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMyOrders()
  }, [fetchMyOrders])

  const roleLabel = user?.role ? USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] ?? user.role : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的工作台"
        description={`${roleLabel} · ${user?.realName ?? ''}`}
      />

      {/* 快捷统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">今日录入/接单</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-info)]/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.todayCount}</div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">待处理</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.pending}</div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">处理中</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.inProgress}</div>
        </GlassCard>
      </div>

      {/* 我的订单列表 */}
      <GlassCard className="overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            我的订单 {meta ? `(${meta.total})` : ''}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">暂无订单</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map((order, i) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors animate-fade-in-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* 状态指示点 */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: order.status === 'APPROVED' || order.status === 'DELIVERED'
                      ? 'var(--color-success)'
                      : order.status === 'REJECTED'
                        ? 'var(--color-error)'
                        : 'var(--color-primary)',
                  }}
                />

                {/* 订单信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[var(--color-primary-light)]">{order.orderNo}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-secondary)]">
                    <span>{order.customerName}</span>
                    <span className="text-[var(--color-text-placeholder)]">·</span>
                    <span>{order.targetCountry} {order.visaType}</span>
                    <span className="text-[var(--color-text-placeholder)]">·</span>
                    <span>¥{Number(order.amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* 时间 */}
                <span className="text-xs text-[var(--color-text-placeholder)] shrink-0">
                  {formatDateTime(order.updatedAt)}
                </span>

                {/* 箭头 */}
                <svg className="w-4 h-4 text-[var(--color-text-placeholder)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
