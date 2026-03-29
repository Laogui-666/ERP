'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chat-store'
import { registerChatMessageHandler } from '@/hooks/use-socket-client'
import { formatMessageTime } from '@/lib/utils'

export function ChatRoomList() {
  const router = useRouter()
  const { rooms, totalUnread, isLoadingRooms, fetchRooms } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  // 初始加载
  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // Socket 实时刷新
  useEffect(() => {
    const handlerId = 'chat-room-list'
    const unregister = registerChatMessageHandler(handlerId, () => {
      // 收到新消息 → 刷新会话列表
      fetchRooms()
    })
    return unregister
  }, [fetchRooms])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const handleClickRoom = useCallback(
    (orderId: string) => {
      setIsOpen(false)
      router.push(`/admin/orders/${orderId}`)
    },
    [router]
  )

  return (
    <div className="relative">
      {/* 按钮 */}
      <div
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchRooms()
        }}
        className="relative cursor-pointer p-2 rounded-lg text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.06] transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center px-1 font-medium">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>

      {/* 下拉面板 */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl bg-[rgba(22,27,42,0.98)] border border-white/[0.08] shadow-2xl animate-fade-in-up z-50"
          style={{ animationDuration: '150ms' }}
        >
          {/* 标题 */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">消息</span>
            {totalUnread > 0 && (
              <span className="text-[10px] text-[var(--color-text-placeholder)]">
                {totalUnread} 条未读
              </span>
            )}
          </div>

          {/* 会话列表 */}
          <div className="overflow-y-auto max-h-[320px] scrollbar-thin">
            {isLoadingRooms && rooms.length === 0 ? (
              <div className="flex justify-center py-8">
                <span className="w-5 h-5 border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-[var(--color-text-placeholder)]">
                <span className="text-2xl">💬</span>
                <span className="text-xs">暂无消息</span>
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.orderId}
                  onClick={() => handleClickRoom(room.orderId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.03] last:border-0"
                >
                  {/* 头像占位 */}
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-sm font-medium text-[var(--color-primary-light)] shrink-0">
                    💬
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                        {room.orderNo ?? room.title}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-placeholder)] shrink-0">
                        {formatMessageTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-placeholder)] truncate mt-0.5">
                      {room.lastMessage ?? '暂无消息'}
                    </p>
                  </div>

                  {/* 未读数 */}
                  {room.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center px-1 shrink-0">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
