'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'
import { useToast } from '@/components/ui/toast'
import type { SendMessagePayload } from '@/types/chat'

const MAX_LENGTH = 2000
const WARN_LENGTH = 1800

interface ChatInputProps {
  orderId: string
  isSending: boolean
  onSend: (payload: SendMessagePayload) => Promise<void>
  onTyping: () => void
}

export function ChatInput({ orderId, isSending, onSend, onTyping }: ChatInputProps) {
  const { toast } = useToast()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // 发送文本消息
  const handleSendText = async () => {
    const content = text.trim()
    if (!content || content.length > MAX_LENGTH) return

    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await onSend({ type: 'TEXT', content })
    } catch {
      toast('error', '发送失败')
      setText(content) // 恢复输入
    }
  }

  // Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  // 输入变化 + 自动高度 + typing 通知
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_LENGTH) {
      setText(value)
      onTyping()
    }

    // 自动高度
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }

  // 文件/图片上传
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 重置 input
    e.target.value = ''

    const isImage = file.type.startsWith('image/')
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast('error', '文件大小不能超过 10MB')
      return
    }

    // MIME type 兜底：部分浏览器对 .heic 等格式返回空字符串
    let fileType = file.type
    if (!fileType) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const extMap: Record<string, string> = {
        heic: 'image/heic', heif: 'image/heif',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
        pdf: 'application/pdf',
      }
      fileType = extMap[ext ?? ''] ?? 'application/octet-stream'
    }

    setIsUploading(true)
    try {
      // 1. 获取预签名 URL
      const presignRes = await apiFetch('/api/documents/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'chat',
          orderId,
          fileName: file.name,
          fileType,
        }),
      })
      const presignJson = await presignRes.json()
      if (!presignJson.success) {
        throw new Error(presignJson.error?.message ?? '获取上传链接失败')
      }
      const { presignedUrl, ossKey } = presignJson.data

      // 2. 直传 OSS
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: file,
      })
      if (!putRes.ok) throw new Error('上传失败')

      // 3. 确认写库
      const confirmRes = await apiFetch('/api/documents/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'chat',
          orderId,
          ossKey,
          fileName: file.name,
          fileSize: file.size,
          fileType,
        }),
      })
      const confirmJson = await confirmRes.json()
      if (!confirmJson.success) {
        throw new Error(confirmJson.error?.message ?? '确认失败')
      }

      // 4. 发送消息
      await onSend({
        type: isImage ? 'IMAGE' : 'FILE',
        content: confirmJson.data.ossUrl,
        fileName: file.name,
        fileSize: file.size,
      })
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '上传失败')
    } finally {
      setIsUploading(false)
    }
  }, [orderId, onSend, toast])

  const charCount = text.length
  const isOverLimit = charCount > MAX_LENGTH
  const isNearLimit = charCount > WARN_LENGTH

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[rgba(26,31,46,0.9)] backdrop-blur-xl">
      <div className="flex items-end gap-2 p-3">
        {/* 文件按钮 */}
        <button
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = ''
              fileInputRef.current.click()
            }
          }}
          disabled={isSending || isUploading}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          title="发送文件"
        >
          {isUploading ? (
            <span className="w-4 h-4 border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          )}
        </button>

        {/* 图片按钮 */}
        <button
          onClick={() => {
            const input = fileInputRef.current
            if (input) {
              input.accept = 'image/*'
              input.click()
            }
          }}
          disabled={isSending || isUploading}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          title="发送图片"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </button>

        {/* 输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl px-3.5 py-2.5 text-sm',
              'bg-white/[0.05] border border-white/[0.08]',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)]',
              'focus:outline-none focus:border-[var(--color-primary)]/40 focus:bg-white/[0.07]',
              'transition-all duration-200',
              'scrollbar-thin',
              isNearLimit && !isOverLimit && 'border-[var(--color-warning)]/30',
              isOverLimit && 'border-[var(--color-error)]/40'
            )}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          {/* 字数提示 */}
          {isNearLimit && (
            <span
              className={cn(
                'absolute right-2 bottom-1.5 text-[10px]',
                isOverLimit ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]'
              )}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          )}
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSendText}
          disabled={!text.trim() || isSending || isOverLimit || isUploading}
          className={cn(
            'shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
            text.trim() && !isOverLimit
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-lg shadow-[var(--color-primary)]/20'
              : 'bg-white/[0.05] text-[var(--color-text-placeholder)]'
          )}
          title="发送"
        >
          {isSending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
