'use client'

/**
 * 客户端订单页 - 液体玻璃设计版
 *
 * 对接 API：
 * - GET /api/orders (CUSTOMER 角色自动过滤为自己订单)
 */

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiFetch } from '@shared/lib/api-client'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { Card } from '@shared/ui/card'
import { formatDate } from '@shared/lib/utils'
import { liquidSpringConfig } from '@design-system/theme/animations'
import type { Order } from '@erp/types/order'

// 状态 → 待办提示
const STATUS_HINTS: Record<string, string> = {
  COLLECTING_DOCS: '📤 有资料待上传',
  PENDING_DELIVERY: '📥 签证材料已制作完成，请下载查看',
  DELIVERED: '📥 签证材料已交付，请确认出签结果',
}



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
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
      >
        <h2 className="text-lg font-semibold text-glass-primary">
          我的订单
        </h2>
        <p className="mt-1 text-xs text-glass-muted">
          查看您的签证订单状态
        </p>
      </motion.div>

      {/* 加载状态 */}
      {isLoading ? (
        <Card padding="lg" className="text-center">
          <motion.div
            className="inline-block w-6 h-6 border-2 border-glass-primary/30 border-t-glass-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="mt-3 text-sm text-glass-muted">加载中...</p>
        </Card>
      ) : orders.length === 0 ? (
        /* 空状态 */
        <Card padding="lg" className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={liquidSpringConfig.bouncy}
          >
            <svg className="w-12 h-12 mx-auto text-glass-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-glass-muted">暂无订单</p>
            <p className="text-xs text-glass-muted/60 mt-1">客服录入后会自动显示在这里</p>
          </motion.div>
        </Card>
      ) : (
        /* 订单列表 */
        <div className="space-y-3">
          {orders.map((order, i) => {
            const hint = STATUS_HINTS[order.status]

            return (
              <Link key={order.id} href={`/customer/orders/${order.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...liquidSpringConfig.gentle, delay: i * 0.1 }}
                  className="glass-card glass-card-hover rounded-xl overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-glass-primary">{order.orderNo}</h3>
                        <p className="text-xs text-glass-muted mt-1">{order.customerName}</p>
                      </div>
                      {order.status && <StatusBadge status={order.status} />}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-glass-muted">国家</span>
                        <span className="text-glass-primary">{order.targetCountry}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-glass-muted">签证类型</span>
                        <span className="text-glass-primary">{order.visaType}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-glass-muted">金额</span>
                        <span className="text-glass-primary font-medium">¥{Number(order.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-glass-muted">创建时间</span>
                        <span className="text-glass-muted">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    {hint && (
                      <div className="text-xs text-glass-warning mb-2">{hint}</div>
                    )}
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
