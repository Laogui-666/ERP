'use client'

import { useEffect, useRef, useState } from 'react'

interface WordPreviewProps {
  url: string
}

/**
 * Word (.docx) 在线预览
 * 基于 docx-preview 库，将 docx 渲染为 HTML
 */
export function WordPreview({ url }: WordPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        setLoading(true)
        setError(null)

        // 动态加载 docx-preview（避免 SSR 问题）
        const { renderAsync } = await import('docx-preview')

        // 获取文件数据
        const res = await fetch(url)
        if (!res.ok) throw new Error(`获取文件失败 (${res.status})`)
        const buffer = await res.arrayBuffer()

        if (cancelled || !containerRef.current) return

        // 渲染 docx 到容器
        await renderAsync(buffer, containerRef.current, undefined, {
          className: 'docx-preview-content',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: false,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
        })

        if (!cancelled) setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '文档渲染失败')
          setLoading(false)
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="relative w-full h-[75vh] overflow-auto bg-white rounded-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">正在渲染文档...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
          <span className="text-4xl">📃</span>
          <p className="text-sm">{error}</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
            下载文件
          </a>
        </div>
      )}
      <div ref={containerRef} className="docx-preview-wrapper p-6" />
      <style jsx global>{`
        .docx-preview-wrapper .docx-preview-content {
          max-width: 100% !important;
        }
        .docx-preview-wrapper .docx-preview-content > div {
          padding: 20px !important;
        }
      `}</style>
    </div>
  )
}
