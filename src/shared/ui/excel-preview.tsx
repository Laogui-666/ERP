'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

interface ExcelPreviewProps {
  url: string
}

interface SheetData {
  name: string
  html: string
  rows: number
  cols: number
}

/**
 * Excel (.xlsx/.xls) 在线预览
 * 基于 xlsx (SheetJS) 库，将 Excel 渲染为 HTML 表格
 */
export function ExcelPreview({ url }: ExcelPreviewProps) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function parse() {
      try {
        setLoading(true)
        setError(null)

        // 动态加载 xlsx
        const XLSX = await import('xlsx')

        // 获取文件数据
        const res = await fetch(url)
        if (!res.ok) throw new Error(`获取文件失败 (${res.status})`)
        const buffer = await res.arrayBuffer()

        if (cancelled) return

        // 解析工作簿
        const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true })

        const parsedSheets: SheetData[] = []

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          if (!sheet || !sheet['!ref']) continue

          // 获取范围
          const range = XLSX.utils.decode_range(sheet['!ref'])
          const rows = range.e.r - range.s.r + 1
          const cols = range.e.c - range.s.c + 1

          // 转换为 HTML 表格并消毒（防 XSS）
          const rawHtml = XLSX.utils.sheet_to_html(sheet, {
            editable: false,
          })
          const html = DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'colgroup', 'col', 'caption', 'b', 'i', 'u', 'br', 'span', 'div', 'p', 'font'],
            ALLOWED_ATTR: ['style', 'class', 'colspan', 'rowspan', 'bgcolor', 'color', 'width', 'height', 'align', 'valign'],
          })

          parsedSheets.push({
            name: sheetName,
            html,
            rows,
            cols,
          })
        }

        if (!cancelled) {
          setSheets(parsedSheets)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Excel 解析失败')
          setLoading(false)
        }
      }
    }

    parse()
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="relative w-full h-[75vh] flex flex-col bg-[#f5f5f5] rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1f2e] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-sm text-white/50">正在解析表格...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500 bg-white">
          <span className="text-4xl">📊</span>
          <p className="text-sm">{error}</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
            下载文件
          </a>
        </div>
      )}
      {!loading && !error && sheets.length > 0 && (
        <>
          {/* Sheet 标签栏 */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
              {sheets.map((sheet, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSheet(idx)}
                  className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-all ${
                    activeSheet === idx
                      ? 'bg-blue-500 text-white font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {sheet.name}
                  <span className="ml-1 text-[10px] opacity-60">
                    ({sheet.rows}×{sheet.cols})
                  </span>
                </button>
              ))}
            </div>
          )}
          {/* 表格内容 */}
          <div className="flex-1 overflow-auto">
            <div
              className="excel-table-wrapper"
              dangerouslySetInnerHTML={{ __html: sheets[activeSheet]?.html ?? '' }}
            />
          </div>
          <style jsx global>{`
            .excel-table-wrapper table {
              border-collapse: collapse !important;
              font-size: 13px !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              width: auto !important;
              min-width: 100% !important;
            }
            .excel-table-wrapper td,
            .excel-table-wrapper th {
              border: 1px solid #e5e7eb !important;
              padding: 6px 10px !important;
              white-space: nowrap !important;
              max-width: 300px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              background: white !important;
              color: #1f2937 !important;
            }
            .excel-table-wrapper th {
              background: #f9fafb !important;
              font-weight: 600 !important;
              position: sticky !important;
              top: 0 !important;
              z-index: 1 !important;
            }
            .excel-table-wrapper tr:hover td {
              background: #f0f7ff !important;
            }
          `}</style>
        </>
      )}
    </div>
  )
}
