'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@shared/hooks/use-auth'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { LiquidPoolCard } from '@design-system/components/liquid-pool-card'
import { LiquidCard } from '@design-system/components/liquid-card'
import { useToast } from '@shared/ui/toast'
import { formatDateTime } from '@shared/lib/utils'
import { liquidSpringConfig } from '@design-system/theme/animations'
import type { Order } from '@erp/types/order'

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
      const res = await apiFetch(`/api/orders/pool?page=${p}&pageSize=20`)
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
      const res = await apiFetch(`/api/orders/${orderId}/claim`, { method: 'POST' })
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
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
      >
        <h1 className="text-2xl font-bold text-liquid-deep tracking-tight">
          公共池
        </h1>
        <p className="mt-1 text-sm text-liquid-mist">
          {poolTitle} · 共 {total} 条
        </p>
      </motion.div>

      {/* 加载状态 */}
      {isLoading ? (
        <LiquidCard padding="xl" variant="liquid" className="text-center">
          <motion.div
            className="inline-block w-6 h-6 border-2 border-liquid-ocean/30 border-t-liquid-ocean rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="mt-3 text-sm text-liquid-mist">加载中...</p>
        </LiquidCard>
      ) : orders.length === 0 ? (
        /* 空状态 */
        <LiquidCard padding="xl" variant="liquid" className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={liquidSpringConfig.bouncy}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-liquid-ocean/10 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-8 h-8 text-liquid-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </motion.div>
            <p className="text-lg text-liquid-deep font-semibold">暂无待接单订单</p>
            <p className="text-sm text-liquid-mist mt-1">当前公共池没有需要处理的订单</p>
          </motion.div>
        </LiquidCard>
      ) : (
        /* 订单卡片网格 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order, i) => (
            <LiquidPoolCard
              key={order.id}
              orderNo={order.orderNo}
              customerName={order.customerName}
              status={<StatusBadge status={order.status} />}
              country={order.targetCountry}
              visaType={order.visaType}
              amount={Number(order.amount)}
              createdAt={formatDateTime(order.createdAt)}
              isClaiming={claiming === order.id}
              onClaim={() => handleClaim(order.id, order.orderNo)}
              delay={i}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <motion.div 
          className="flex justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.3 }}
        >
          <motion.button
            disabled={page <= 1}
            onClick={() => { setPage(page - 1); fetchPool(page - 1) }}
            whileHover={page > 1 ? { scale: 1.05 } : {}}
            whileTap={page > 1 ? { scale: 0.95 } : {}}
            className="px-4 py-2.5 text-sm rounded-xl bg-white/60 backdrop-blur-xl text-liquid-mist hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/40 shadow-liquid-soft"
          >
            上一页
          </motion.button>
          <span className="px-4 py-2.5 text-sm text-liquid-mist bg-white/40 backdrop-blur-xl rounded-xl border border-white/30">
            第 {page} 页
          </span>
          <motion.button
            disabled={page * 20 >= total}
            onClick={() => { setPage(page + 1); fetchPool(page + 1) }}
            whileHover={page * 20 < total ? { scale: 1.05 } : {}}
            whileTap={page * 20 < total ? { scale: 0.95 } : {}}
            className="px-4 py-2.5 text-sm rounded-xl bg-white/60 backdrop-blur-xl text-liquid-mist hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/40 shadow-liquid-soft"
          >
            下一页
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
