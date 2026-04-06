'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PdfPreviewProps {
  url: string
}

/**
 * PDF 在线预览
 * 基于 pdfjs-dist，支持翻页、缩放
 */
export function PdfPreview({ url }: PdfPreviewProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const renderTaskRef = useRef<any>(null)

  // 加载 PDF 文档
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        setLoading(true)
        setError(null)

        const pdfjsLib = await import('pdfjs-dist')

        // 配置 worker
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

        // 加载 PDF
        const loadingTask = pdfjsLib.getDocument(url)
        const doc = await loadingTask.promise

        if (!cancelled) {
          setPdfDoc(doc)
          setTotalPages(doc.numPages)
          setCurrentPage(1)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'PDF 加载失败')
          setLoading(false)
        }
      }
    }

    loadPdf()
    return () => {
      cancelled = true
      if (pdfDoc) pdfDoc.destroy()
    }
  }, [url])

  // 渲染当前页
  const renderPage = useCallback(async (pageNum: number, currentScale: number) => {
    if (!pdfDoc || !canvasContainerRef.current) return

    // 取消之前的渲染
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    setRendering(true)

    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: currentScale })

      // 创建 canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.style.width = '100%'
      canvas.style.maxWidth = `${viewport.width}px`
      canvas.style.height = 'auto'

      // 清空容器并添加新 canvas
      const container = canvasContainerRef.current
      container.innerHTML = ''
      container.appendChild(canvas)

      // 渲染页面
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }
      const task = page.render(renderContext)
      renderTaskRef.current = task
      await task.promise
      renderTaskRef.current = null

      setRendering(false)
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') return
      setRendering(false)
    }
  }, [pdfDoc])

  // 页面或缩放变化时重新渲染
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage, scale)
    }
  }, [pdfDoc, currentPage, scale, renderPage])

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(p)
  }

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))
  const resetZoom = () => setScale(1.2)

  return (
    <div className="relative w-full h-[75vh] flex flex-col bg-[#525659] rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-sm text-white/50">正在加载 PDF...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-white/60">
          <span className="text-4xl">📄</span>
          <p className="text-sm">{error}</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/80 transition-colors">
            下载文件
          </a>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 工具栏 */}
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-[#323639] shrink-0">
            {/* 翻页控件 */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 text-white/80 transition-colors"
              title="上一页"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 text-sm text-white/80">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={e => goToPage(parseInt(e.target.value) || 1)}
                className="w-12 px-2 py-1 text-center bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-blue-400"
              />
              <span>/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 text-white/80 transition-colors"
              title="下一页"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 分隔线 */}
            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* 缩放控件 */}
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 text-white/80 transition-colors"
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>

            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs text-white/70 hover:bg-white/10 rounded transition-colors min-w-[48px]"
              title="重置缩放"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 text-white/80 transition-colors"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* PDF 渲染区域 */}
          <div className="flex-1 overflow-auto flex justify-center py-4">
            <div ref={canvasContainerRef} className="shadow-2xl" />
          </div>

          {/* 渲染中指示器 */}
          {rendering && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 rounded-full text-xs text-white/70">
              渲染中...
            </div>
          )}
        </>
      )}
    </div>
  )
}
