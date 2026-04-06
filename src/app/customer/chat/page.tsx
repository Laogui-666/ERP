'use client'

/**
 * 客户端消息页 — 订单会话列表
 *
 * 展示客户所有订单的聊天会话，点击卡片弹出全屏站内会话窗口
 */

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@shared/lib/api-client'
import { GlassCard } from '@shared/ui/glass-card'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { formatDate } from '@shared/lib/utils'
import { ChatPanel } from '@erp/components/chat/chat-panel'
import { useChatStore } from '@erp/stores/chat-store'
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
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          消息
        </h2>
        <p className="text-xs text-[var(--color-text-placeholder)]">
          点击订单卡片，与工作人员在线沟通
        </p>

        {isLoading ? (
          <GlassCard className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
          </GlassCard>
        ) : chatSummaries.length === 0 ? (
          <GlassCard className="p-8 text-center animate-fade-in-up">
            <span className="text-4xl block mb-3">💬</span>
            <p className="text-[var(--color-text-secondary)]">暂无会话</p>
            <p className="text-xs text-[var(--color-text-placeholder)] mt-1">有订单后即可与工作人员沟通</p>
          </GlassCard>
        ) : (
          chatSummaries.map((chat, i) => (
            <div key={chat.orderId} onClick={() => setActiveOrderId(chat.orderId)}>
              <GlassCard
                className="p-4 animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-sm">
                    🎫
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {chat.orderNo}
                        </span>
                        <StatusBadge status={chat.status} />
                      </div>
                      {chat.lastMessageAt && (
                        <span className="text-[10px] text-[var(--color-text-placeholder)] flex-shrink-0 ml-2">
                          {formatDate(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-1.5">
                      <span>🌍</span>
                      <span>{chat.targetCountry}</span>
                      <span className="text-[var(--color-text-placeholder)]">·</span>
                      <span>{chat.visaType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--color-text-placeholder)] truncate max-w-[200px]">
                        {chat.lastMessage || '点击进入会话'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center px-1 font-medium">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          ))
        )}
      </div>

      {/* 全屏会话窗口 */}
      {activeOrderId && (
        <div
          className="fixed inset-0 z-[60] bg-[rgba(10,13,20,0.98)] animate-fade-in"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* 会话顶栏 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <button
              onClick={() => setActiveOrderId(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-secondary)] hover:bg-white/[0.06] active:scale-90 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {chatSummaries.find(c => c.orderId === activeOrderId)?.orderNo ?? '会话'}
              </p>
              <p className="text-[10px] text-[var(--color-text-placeholder)]">
                {chatSummaries.find(c => c.orderId === activeOrderId)?.targetCountry} · {chatSummaries.find(c => c.orderId === activeOrderId)?.visaType}
              </p>
            </div>
          </div>

          {/* 聊天面板 — 填满剩余空间 */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ChatPanel
              key={activeOrderId}
              orderId={activeOrderId}
              compact
              onClose={() => setActiveOrderId(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
