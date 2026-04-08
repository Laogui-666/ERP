'use client'

import { memo } from 'react'
import Image from 'next/image'
import { cn } from '@shared/lib/utils'
import { formatMessageTime } from '@shared/lib/utils'
import type { ChatMessageItem } from '@erp/types/chat'

interface ChatMessageProps {
  message: ChatMessageItem
  isOwn: boolean
  showAvatar: boolean
  onImageClick?: (url: string) => void
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isOwn,
  showAvatar,
  onImageClick,
}: ChatMessageProps) {
  // ===== 系统消息 =====
  if (message.type === 'SYSTEM') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-[11px] text-liquid-mist/60 bg-liquid-ocean/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex gap-2.5 max-w-[90%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* 头像 */}
      {showAvatar ? (
        <div
          className={cn(
            'w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-medium',
            isOwn
              ? 'bg-liquid-ocean/20 text-liquid-oceanLight'
              : 'bg-liquid-ocean/10 text-liquid-mist'
          )}
        >
          {message.senderName?.[0] ?? '?'}
        </div>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {/* 发送者名称 + 时间 */}
        {showAvatar && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-liquid-mist/60">
              {message.senderName}
              {message.senderRole && message.senderRole !== 'CUSTOMER' && (
                <span className="ml-1 text-liquid-sand">
                  ({getRoleShortLabel(message.senderRole)})
                </span>
              )}
            </span>
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-[14px] max-w-full break-words',
            isOwn
              ? 'bg-liquid-ocean/15 border border-liquid-ocean/10 text-liquid-deep'
              : 'bg-liquid-ocean/5 border border-liquid-ocean/5 text-liquid-deep'
          )}
        >
          {message.type === 'TEXT' && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}

          {message.type === 'IMAGE' && (
            <button
              onClick={() => onImageClick?.(message.content)}
              className="block max-w-[260px] rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            >
              <Image
                src={message.content}
                alt={message.fileName ?? '图片'}
                width={260}
                height={240}
                className="w-full h-auto max-h-[240px] object-cover rounded-lg"
                loading="lazy"
                unoptimized
              />
            </button>
          )}

          {message.type === 'FILE' && (
            <a
              href={message.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-liquid-ocean/5 hover:bg-liquid-ocean/10 transition-colors group"
            >
              <span className="text-2xl shrink-0">📄</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-liquid-deep truncate">
                  {message.fileName ?? '文件'}
                </p>
                {message.fileSize != null && (
                  <p className="text-xs text-liquid-mist/60">
                    {formatFileSize(message.fileSize)}
                  </p>
                )}
              </div>
              <svg className="w-5 h-5 text-liquid-mist/60 group-hover:text-liquid-oceanLight shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}
        </div>

        {/* 时间 */}
        <span className="text-[11px] text-liquid-mist/60 px-1">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getRoleShortLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: '管理员',
    COMPANY_OWNER: '负责人',
    CS_ADMIN: '客服主管',
    CUSTOMER_SERVICE: '客服',
    VISA_ADMIN: '签证主管',
    DOC_COLLECTOR: '资料员',
    OPERATOR: '操作员',
    OUTSOURCE: '外包',
    CUSTOMER: '客户',
  }
  return labels[role] ?? role
}
