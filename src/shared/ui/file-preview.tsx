'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { cn } from '@shared/lib/utils'
import { WordPreview } from './word-preview'
import { ExcelPreview } from './excel-preview'
import { PdfPreview } from './pdf-preview'

interface FilePreviewProps {
  fileName: string
  fileType: string
  ossUrl: string
  fileSize: number
  /** 文件 ID（用于获取新鲜预览签名 URL） */
  fileId?: string
  /** 缩略展示模式 */
  compact?: boolean
  /** 删除回调（传入时显示删除按钮） */
  onDelete?: () => void
  /** 驳回原因（点击文件名时显示） */
  rejectReason?: string | null
}

/**
 * 文件预览组件
 * 支持：图片内嵌预览、PDF 内嵌预览、文本内嵌预览、其他类型下载
 */
export function FilePreview({ fileName, fileType, ossUrl, fileSize, fileId, compact = false, onDelete, rejectReason }: FilePreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false)
  const [showRejectPopup, setShowRejectPopup] = useState(false)

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isText = fileType === 'text/plain'
  const isWord = fileType.includes('word') || fileType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx')
  const isExcel = fileType.includes('excel') || fileType.includes('sheet') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')

  // 文件类型图标
  const getFileIcon = () => {
    if (isImage) return '🖼️'
    if (isPdf) return '📄'
    if (isText) return '📝'
    if (isWord) return '📃'
    if (isExcel) return '📊'
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦'
    if (fileType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return '📑'
    return '📎'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const canPreview = isImage || isPdf || isText || isWord || isExcel

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2 text-xs group">
          <span className="shrink-0">{getFileIcon()}</span>
          {canPreview ? (
            <button
              onClick={() => setShowLightbox(true)}
              className="text-[var(--color-info)] hover:text-[var(--color-primary-light)] truncate max-w-[200px] text-left transition-colors"
            >
              {fileName}
            </button>
          ) : (
            <a
              href={ossUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-info)] hover:text-[var(--color-primary-light)] truncate max-w-[200px] transition-colors"
            >
              {fileName}
            </a>
          )}
          <span className="text-[var(--color-text-placeholder)] shrink-0">
            ({formatSize(fileSize)})
          </span>
          {/* 驳回原因指示 */}
          {rejectReason && (
            <button
              onClick={() => setShowRejectPopup(!showRejectPopup)}
              className="text-[var(--color-error)] shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-error)]/10 hover:bg-[var(--color-error)]/20 transition-all"
              title="查看驳回原因"
            >
              驳回原因
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-[var(--color-error)]/60 hover:text-[var(--color-error)] shrink-0 transition-colors"
              title="删除文件"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* 驳回原因弹出 */}
        {showRejectPopup && rejectReason && (
          <div className="mt-1 ml-6 p-2.5 rounded-lg bg-[var(--color-error)]/8 border border-[var(--color-error)]/15 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[var(--color-error)] font-medium">❌ 驳回原因</span>
              <button onClick={() => setShowRejectPopup(false)} className="text-[var(--color-text-placeholder)] hover:text-white">✕</button>
            </div>
            <p className="text-[var(--color-text-primary)] leading-relaxed">{rejectReason}</p>
          </div>
        )}

        {showLightbox && typeof document !== 'undefined' && (
          <FileLightbox
            fileId={fileId}
            fileName={fileName}
            fileType={fileType}
            ossUrl={ossUrl}
            rejectReason={rejectReason}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </>
    )
  }

  // 卡片模式
  return (
    <>
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
        {/* 图片缩略图 */}
        {isImage ? (
          <button
            onClick={() => setShowLightbox(true)}
            className="w-full"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 mb-2">
              <Image
                src={ossUrl}
                alt={fileName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => canPreview && setShowLightbox(true)}
            className={cn(
              'w-full aspect-video rounded-lg flex items-center justify-center mb-2',
              'bg-white/5 hover:bg-white/[0.08] transition-colors',
              !canPreview && 'cursor-default',
            )}
          >
            <span className="text-4xl">{getFileIcon()}</span>
          </button>
        )}

        {/* 文件信息 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            {canPreview ? (
              <button
                onClick={() => setShowLightbox(true)}
                className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-info)] truncate block w-full text-left transition-colors"
              >
                {fileName}
              </button>
            ) : (
              <a
                href={ossUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-info)] truncate block transition-colors"
              >
                {fileName}
              </a>
            )}
            <span className="text-xs text-[var(--color-text-placeholder)]">{formatSize(fileSize)}</span>
          </div>
          <a
            href={ossUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] transition-all shrink-0"
            title="下载"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-[var(--color-error)]/10 text-[var(--color-text-placeholder)] hover:text-[var(--color-error)] transition-all shrink-0"
              title="删除文件"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showLightbox && typeof document !== 'undefined' && (
        <FileLightbox
          fileId={fileId}
          fileName={fileName}
          fileType={fileType}
          ossUrl={ossUrl}
          rejectReason={rejectReason}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  )
}

// 全屏预览灯箱
function FileLightbox({
  fileId,
  fileName,
  fileType,
  ossUrl,
  rejectReason,
  onClose,
}: {
  fileId?: string | undefined
  fileName: string
  fileType: string
  ossUrl: string
  rejectReason?: string | null | undefined
  onClose: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!fileId)

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isText = fileType === 'text/plain'
  const isWord = fileType.includes('word') || fileType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx')
  const isExcel = fileType.includes('excel') || fileType.includes('sheet') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')

  // 通过预览 API 获取带 inline disposition 的新鲜签名 URL
  useEffect(() => {
    if (!fileId) {
      setPreviewUrl(ossUrl)
      setLoading(false)
      return
    }
    let cancelled = false
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/documents/files/${fileId}/preview`)
        const json = await res.json()
        if (!cancelled && json.success) {
          setPreviewUrl(json.data.url)
        } else if (!cancelled) {
          setPreviewUrl(ossUrl)
        }
      } catch {
        if (!cancelled) setPreviewUrl(ossUrl)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchUrl()
    return () => { cancelled = true }
  }, [fileId, ossUrl])

  const url = previewUrl || ossUrl

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 内容区 */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 顶栏 */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm text-white/80 truncate max-w-[60vw]">{fileName}</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              title="新窗口打开"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 驳回原因提示条 */}
        {rejectReason && (
          <div className="mb-3 p-3 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">❌</span>
              <div>
                <span className="text-xs font-medium text-[var(--color-error)]">驳回原因</span>
                <p className="text-xs text-[var(--color-text-primary)] mt-0.5 leading-relaxed">{rejectReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* 预览内容 */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-[#1a1f2e] border border-white/10 shadow-2xl min-h-[300px]">
          {loading ? (
            <div className="w-full h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <Image
                src={url}
                alt={fileName}
                width={1200}
                height={900}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          ) : isPdf ? (
            <PdfPreview url={url} />
          ) : isText ? (
            <iframe src={url} className="w-full h-[75vh] border-0" title={fileName} />
          ) : isWord ? (
            <WordPreview url={url} />
          ) : isExcel ? (
            <ExcelPreview url={url} />
          ) : (
            <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4 text-white/60">
              <span className="text-5xl">📎</span>
              <p className="text-sm">此文件类型不支持在线预览</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn-primary px-4 py-2 text-sm"
              >
                下载文件
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
