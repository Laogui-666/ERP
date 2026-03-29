'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@/hooks/use-chat'
import { registerChatTypingHandler } from '@/hooks/use-socket-client'
import { ChatMessageList } from './chat-message-list'
import { ChatInput } from './chat-input'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  orderId: string
  /** compact 模式用于浮动面板，更紧凑 */
  compact?: boolean
  /** 关闭按钮回调 */
  onClose?: () => void
}

export function ChatPanel({ orderId, compact = false, onClose }: ChatPanelProps) {
  const {
    messages,
    hasMore,
    isLoading,
    isSending,
    userId,
    sendMessage,
    loadMore,
    handleTyping,
    markRead,
  } = useChat({ orderId })

  // typing 用户状态
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; realName: string }>>([])
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // 注册 typing 回调
  useEffect(() => {
    const handlerId = `typing-panel-${orderId}`
    const unregister = registerChatTypingHandler(handlerId, (data) => {
      if (data.orderId !== orderId || data.userId === userId) return

      // 清除之前的 timer
      const existing = typingTimersRef.current.get(data.userId)
      if (existing) clearTimeout(existing)

      // 添加用户到 typing 列表
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev
        return [...prev, { userId: data.userId, realName: data.realName }]
      })

      // 3s 后自动移除
      const timer = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
        typingTimersRef.current.delete(data.userId)
      }, 3000)

      typingTimersRef.current.set(data.userId, timer)
    })

    return () => {
      unregister()
      // 清理所有 timer
      for (const timer of typingTimersRef.current.values()) {
        clearTimeout(timer)
      }
      typingTimersRef.current.clear()
    }
  }, [orderId, userId])

  // 自动标记已读（查看最新消息时）
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.senderId !== userId) {
        markRead(lastMsg.id)
      }
    }
  }, [messages.length, messages, userId, markRead])

  // 图片灯箱
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const handleImageClick = useCallback((url: string) => {
    setLightboxUrl(url)
  }, [])

  return (
    <div className={cn(
      'flex flex-col h-full bg-[rgba(22,27,42,0.98)]',
      compact ? 'rounded-xl' : 'rounded-2xl'
    )}>
      {/* 头部 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            订单沟通
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <ChatMessageList
        messages={messages}
        userId={userId}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
        typingUsers={typingUsers}
        onImageClick={handleImageClick}
      />

      {/* 输入区 */}
      <ChatInput
        orderId={orderId}
        isSending={isSending}
        onSend={sendMessage}
        onTyping={handleTyping}
      />

      {/* 图片灯箱 */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in-up cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="预览"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
