'use client'

/**
 * 客户端消息页 — 液体玻璃设计版
 *
 * 展示客户所有订单的聊天会话，点击卡片弹出全屏站内会话窗口
 */

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '@shared/lib/api-client'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { LiquidChatCard } from '@design-system/components/liquid-chat-card'
import { LiquidCard } from '@design-system/components/liquid-card'
import { ChatPanel } from '@erp/components/chat/chat-panel'
import { useChatStore } from '@erp/stores/chat-store'
import { formatDate } from '@shared/lib/utils'
import { liquidSpringConfig } from '@design-system/theme/animations'
import type { Order, OrderStatus } from '@erp/types/order'

interface ChatSummary {
  orderId: string
  orderNo: string
  targetCountry: string
  visaType: string
  status: OrderStatus
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export default function CustomerChatPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const { rooms, fetchRooms } = useChatStore()

  const fetchData = useCallback(async () => {
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
    fetchData()
    fetchRooms()
  }, [fetchData, fetchRooms])

  // 合并订单和聊天房间数据
  const chatSummaries: ChatSummary[] = orders.map((order) => {
    const room = rooms.find((r) => r.orderId === order.id)
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      targetCountry: order.targetCountry,
      visaType: order.visaType,
      status: order.status as OrderStatus,
      lastMessage: room?.lastMessage ?? null,
      lastMessageAt: room?.lastMessageAt ?? null,
      unreadCount: room?.unreadCount ?? 0,
    }
  })

  // 有消息的排前面，再按最后消息时间倒序
  chatSummaries.sort((a, b) => {
    if (a.lastMessageAt && !b.lastMessageAt) return -1
    if (!a.lastMessageAt && b.lastMessageAt) return 1
    if (a.lastMessageAt && b.lastMessageAt) {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    }
    return 0
  })

  return (
    <>
      <div className="space-y-4 pb-20">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={liquidSpringConfig.gentle}
        >
          <h2 className="text-lg font-semibold text-liquid-deep">
            消息
          </h2>
          <p className="text-xs text-liquid-mist mt-1">
            点击订单卡片，与工作人员在线沟通
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
        ) : chatSummaries.length === 0 ? (
          /* 空状态 */
          <LiquidCard padding="xl" variant="liquid" className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={liquidSpringConfig.bouncy}
            >
              <span className="text-4xl block mb-3">💬</span>
              <p className="text-liquid-mist">暂无会话</p>
              <p className="text-xs text-liquid-silver mt-1">有订单后即可与工作人员沟通</p>
            </motion.div>
          </LiquidCard>
        ) : (
          /* 聊天列表 */
          <div className="space-y-3">
            {chatSummaries.map((chat, i) => (
              <div key={chat.orderId} onClick={() => setActiveOrderId(chat.orderId)}>
                <LiquidChatCard
                  orderNo={chat.orderNo}
                  status={<StatusBadge status={chat.status} />}
                  country={chat.targetCountry}
                  visaType={chat.visaType}
                  lastMessage={chat.lastMessage}
                  lastMessageAt={chat.lastMessageAt ? formatDate(chat.lastMessageAt) : null}
                  unreadCount={chat.unreadCount}
                  delay={i}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 全屏会话窗口 */}
      {activeOrderId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-liquid-deep/98"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* 会话顶栏 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <motion.button
              onClick={() => setActiveOrderId(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-liquid-mist hover:bg-white/[0.06] active:scale-90 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {chatSummaries.find(c => c.orderId === activeOrderId)?.orderNo ?? '会话'}
              </p>
              <p className="text-[10px] text-liquid-silver">
                {chatSummaries.find(c => c.orderId === activeOrderId)?.targetCountry} · {chatSummaries.find(c => c.orderId === activeOrderId)?.visaType}
              </p>
            </div>
          </div>

          {/* 聊天面板 */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ChatPanel
              key={activeOrderId}
              orderId={activeOrderId}
              compact
              onClose={() => setActiveOrderId(null)}
            />
          </div>
        </motion.div>
      )}
    </>
  )
}
