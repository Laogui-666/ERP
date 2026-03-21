'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { StatusBadge } from '@/components/orders/status-badge'
import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'
import { useToast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/utils'
import type { Order } from '@/types/order'

export default function PoolPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  const fetchPool = useCallback(async (p: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/orders/pool?page=${p}&pageSize=20`)
      const json = await res.json()
      if (json.success) {
        setOrders(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPool(1)
  }, [fetchPool])

  const handleClaim = async (orderId: string, orderNo: string) => {
    setClaiming(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/claim`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast('success', `已接单 ${orderNo}`)
        // 从列表中移除
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        setTotal((prev) => prev - 1)
      } else {
        toast('error', json.error?.message ?? '接单失败')
        // 刷新列表（可能被别人接走了）
        fetchPool(page)
      }
    } catch {
      toast('error', '接单失败，请重试')
    } finally {
      setClaiming(null)
    }
  }

  // 公共池标题
  const poolTitle = user?.role && ['DOC_COLLECTOR', 'VISA_ADMIN'].includes(user.role)
    ? '待对接订单'
    : '待审核订单'

  return (
    <div className="space-y-6">
      <PageHeader
        title="公共池"
        description={`${poolTitle} · 共 ${total} 条`}
      />

      {isLoading ? (
        <GlassCard className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
        </GlassCard>
      ) : orders.length === 0 ? (
        <GlassCard className="p-12 text-center animate-fade-in-up">
          <svg className="w-16 h-16 mx-auto text-[var(--color-text-placeholder)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <p className="text-lg text-[var(--color-text-primary)] font-medium">暂无待接单订单</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">当前公共池没有需要处理的订单</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order, i) => (
            <GlassCard
              key={order.id}
              className="p-5 animate-fade-in-up hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
              hover
            >
              {/* 订单头部 */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-mono text-[var(--color-primary-light)]">{order.orderNo}</span>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-1">
                    {order.customerName}
                  </h3>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* 信息 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-[var(--color-text-placeholder)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <span className="text-[var(--color-text-primary)]">{order.targetCountry}</span>
                  <span className="text-[var(--color-text-placeholder)]">·</span>
                  <span className="text-[var(--color-text-secondary)]">{order.visaType}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-[var(--color-text-placeholder)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[var(--color-text-primary)]">¥{Number(order.amount).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--color-text-placeholder)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDateTime(order.createdAt)}
                </div>
              </div>

              {/* 接单按钮 */}
              <button
                onClick={() => handleClaim(order.id, order.orderNo)}
                disabled={claiming === order.id}
                className="w-full glass-btn-primary py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {claiming === order.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    接单中...
                  </span>
                ) : (
                  '立即接单'
                )}
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => { setPage(page - 1); fetchPool(page - 1) }}
            className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-[var(--color-text-secondary)]">
            第 {page} 页
          </span>
          <button
            disabled={page * 20 >= total}
            onClick={() => { setPage(page + 1); fetchPool(page + 1) }}
            className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
