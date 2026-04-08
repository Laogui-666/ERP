'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { ChatMessage } from './chat-message'
import type { ChatMessageItem } from '@erp/types/chat'

interface ChatMessageListProps {
  messages: ChatMessageItem[]
  userId: string | undefined
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => Promise<{ hasMore: boolean }>
  typingUsers: Array<{ userId: string; realName: string }>
  onImageClick?: (url: string) => void
}

export function ChatMessageList({
  messages,
  userId,
  hasMore,
  isLoading,
  onLoadMore,
  typingUsers,
  onImageClick,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  // 自动滚到底部（新消息时）
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, autoScroll])

  // 检测用户是否在底部
  const handleScroll = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAutoScroll(isAtBottom)

    // 到顶加载更多
    if (el.scrollTop < 20 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      const prevScrollHeight = el.scrollHeight
      await onLoadMore()
      setIsLoadingMore(false)

      // 保持滚动位置
      requestAnimationFrame(() => {
        if (el) {
          const newScrollHeight = el.scrollHeight
          el.scrollTop = newScrollHeight - prevScrollHeight
        }
      })
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  // 判断是否显示头像（同一个人连续消息只显示第一个）
  const shouldShowAvatar = (msg: ChatMessageItem, index: number): boolean => {
    if (msg.type === 'SYSTEM') return false
    if (index === 0) return true
    const prev = messages[index - 1]
    if (prev.type === 'SYSTEM') return true
    if (prev.senderId !== msg.senderId) return true
    // 间隔超过 2 分钟
    const timeDiff = new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()
    return timeDiff > 2 * 60 * 1000
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin"
    >
      {/* 加载更多指示器 */}
      {(isLoading || isLoadingMore) && (
        <div className="flex justify-center py-3">
          <div className="flex items-center gap-2 text-xs text-liquid-mist/60">
            <span className="w-4 h-4 border-2 border-liquid-ocean/20 border-t-liquid-ocean rounded-full animate-spin" />
            加载中...
          </div>
        </div>
      )}

      {/* 无更多消息提示 */}
      {!hasMore && messages.length > 0 && (
        <div className="flex justify-center py-3">
          <span className="text-[10px] text-liquid-mist/60 bg-liquid-ocean/5 px-3 py-1 rounded-full">
            — 以上是历史消息 —
          </span>
        </div>
      )}

      {/* 空态 */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-liquid-mist/60">
          <span className="text-3xl">💬</span>
          <span className="text-sm">暂无消息</span>
          <span className="text-xs">发送第一条消息开始沟通</span>
        </div>
      )}

      {/* 消息列表 */}
      {messages.map((msg, index) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === userId}
          showAvatar={shouldShowAvatar(msg, index)}
          {...(onImageClick ? { onImageClick } : {})}
        />
      ))}

      {/* 输入指示器 */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-1 py-1" style={{ animationDuration: '150ms' }}>
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-liquid-mist/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-liquid-mist/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-liquid-mist/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] text-liquid-mist/60">
            {typingUsers.map((u) => u.realName).join('、')}正在输入...
          </span>
        </div>
      )}

      {/* 底部锚点 */}
      <div ref={bottomRef} />
    </div>
  )
}
