'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  fileName: string
  fileType: string
  ossUrl: string
  fileSize: number
  /** 缩略展示模式 */
  compact?: boolean
}

/**
 * 文件预览组件
 * 支持：图片内嵌预览、PDF 内嵌预览、文本内嵌预览、其他类型下载
 */
export function FilePreview({ fileName, fileType, ossUrl, fileSize, compact = false }: FilePreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false)

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isText = fileType === 'text/plain'

  // 文件类型图标
  const getFileIcon = () => {
    if (isImage) return '🖼️'
    if (isPdf) return '📄'
    if (isText) return '📝'
    if (fileType.includes('word') || fileType.includes('document')) return '📃'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦'
    return '📎'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const canPreview = isImage || isPdf || isText

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
        </div>

        {showLightbox && typeof document !== 'undefined' && (
          <FileLightbox
            fileName={fileName}
            fileType={fileType}
            ossUrl={ossUrl}
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
        </div>
      </div>

      {showLightbox && typeof document !== 'undefined' && (
        <FileLightbox
          fileName={fileName}
          fileType={fileType}
          ossUrl={ossUrl}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  )
}

// 全屏预览灯箱
function FileLightbox({
  fileName,
  fileType,
  ossUrl,
  onClose,
}: {
  fileName: string
  fileType: string
  ossUrl: string
  onClose: () => void
}) {
  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isText = fileType === 'text/plain'

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
              href={ossUrl}
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

        {/* 预览内容 */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-[#1a1f2e] border border-white/10 shadow-2xl min-h-[300px]">
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <Image
                src={ossUrl}
                alt={fileName}
                width={1200}
                height={900}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={ossUrl}
              className="w-full h-[75vh] border-0"
              title={fileName}
            />
          )}

          {isText && (
            <iframe
              src={ossUrl}
              className="w-full h-[75vh] border-0"
              title={fileName}
            />
          )}

          {!isImage && !isPdf && !isText && (
            <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4 text-white/60">
              <span className="text-5xl">📎</span>
              <p className="text-sm">此文件类型不支持在线预览</p>
              <a
                href={ossUrl}
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
