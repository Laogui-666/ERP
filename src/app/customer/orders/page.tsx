'use client'

/**
 * 客户端订单页
 *
 * 对接 API：
 * - GET /api/orders (CUSTOMER 角色自动过滤为自己订单)
 * - GET /api/orders/[id] (订单详情含资料/材料)
 * - POST /api/documents/upload (客户上传资料)
 */

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api-client'
import { GlassCard } from '@/components/layout/glass-card'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types/order'
import type { Order } from '@/types/order'

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/orders?page=1&pageSize=50')
      const json = await res.json()
      if (json.success) {
        setOrders(json.data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        我的订单
      </h2>

      {isLoading ? (
        <GlassCard className="p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
        </GlassCard>
      ) : orders.length === 0 ? (
        <GlassCard className="p-8 text-center animate-fade-in-up">
          <svg className="w-12 h-12 mx-auto text-[var(--color-text-placeholder)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-[var(--color-text-secondary)]">暂无订单</p>
          <p className="text-xs text-[var(--color-text-placeholder)] mt-1">客服录入后会自动显示在这里</p>
        </GlassCard>
      ) : (
        orders.map((order, i) => (
          <GlassCard key={order.id} className="p-5 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-mono text-[var(--color-primary-light)]">{order.orderNo}</span>
              <StatusBadge status={order.status} />
            </div>

            <div className="space-y-1.5 mb-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <span>🌍</span>
                <span>{order.targetCountry}</span>
                <span className="text-[var(--color-text-placeholder)]">·</span>
                <span>{order.visaType}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-placeholder)] text-xs">
                <span>创建于 {formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* 状态流程指示 */}
            <div className="flex items-center gap-1 text-xs">
              {['待对接', '已对接', '资料收集', '审核', '制作', '交付'].map((step, i) => {
                const statusMap = ['PENDING_CONNECTION', 'CONNECTED', 'COLLECTING_DOCS', 'UNDER_REVIEW', 'MAKING_MATERIALS', 'DELIVERED']
                const statusIndex = statusMap.indexOf(order.status)
                const isDone = i <= statusIndex || ['APPROVED', 'REJECTED', 'PARTIAL'].includes(order.status)
                return (
                  <div key={step} className="flex items-center gap-1">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      isDone ? 'bg-[var(--color-primary)] text-white' : 'bg-white/10 text-[var(--color-text-placeholder)]'
                    }`}>
                      {i + 1}
                    </span>
                    {i < 5 && (
                      <div className={`h-px w-5 ${i < statusIndex ? 'bg-[var(--color-primary)]' : 'bg-white/10'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 当前状态说明 */}
            <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
              当前状态：{ORDER_STATUS_LABELS[order.status]}
            </p>
          </GlassCard>
        ))
      )}
    </div>
  )
}
