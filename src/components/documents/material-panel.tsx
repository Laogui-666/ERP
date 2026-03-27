'use client'
import { apiFetch } from '@/lib/api-client'

import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/toast'
import { FilePreview } from '@/components/ui/file-preview'
import { formatDateTime } from '@/lib/utils'
import type { VisaMaterial } from '@/types/order'
import type { UserRole } from '@/types/user'

interface MaterialPanelProps {
  orderId: string
  materials: VisaMaterial[]
  userRole: UserRole
  orderStatus: string
  onRefresh: () => void
}

export function MaterialPanel({ orderId, materials, userRole, orderStatus, onRefresh }: MaterialPanelProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [remark, setRemark] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUpload = ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'].includes(userRole)
    && ['MAKING_MATERIALS', 'PENDING_DELIVERY'].includes(orderStatus)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (remark.trim()) formData.append('remark', remark.trim())

      const res = await apiFetch(`/api/orders/${orderId}/materials`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '材料上传成功')
        setRemark('')
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '上传失败')
      }
    } catch {
      toast('error', '上传失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 按版本分组
  const groupedByVersion = materials.reduce<Record<number, VisaMaterial[]>>((acc, mat) => {
    const v = mat.version
    if (!acc[v]) acc[v] = []
    acc[v].push(mat)
    return acc
  }, {})

  const versions = Object.keys(groupedByVersion).map(Number).sort((a, b) => b - a)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          签证材料
          {materials.length > 0 && (
            <span className="text-xs text-[var(--color-text-placeholder)] font-normal">
              (最新 v{Math.max(...materials.map((m) => m.version))})
            </span>
          )}
        </h3>
      </div>

      {/* 上传表单 */}
      {canUpload && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <textarea
            className="glass-input w-full text-xs resize-none"
            rows={1}
            placeholder="备注（可选）"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full glass-btn-primary py-2 text-xs font-medium disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                上传中...
              </span>
            ) : '发送资料'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.zip,.rar,.7z,.txt,image/*,.heic,.heif"
          />
        </div>
      )}

      {/* 材料列表 — 按版本分组 */}
      {materials.length === 0 ? (
        <p className="text-xs text-[var(--color-text-placeholder)] py-2">暂无签证材料</p>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div key={version}>
              {versions.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-medium">
                    v{version}
                  </span>
                  {version === Math.max(...versions) && (
                    <span className="text-[10px] text-[var(--color-success)]">最新</span>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {groupedByVersion[version]!.map((mat) => (
                  <div key={mat.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <FilePreview
                      fileName={mat.fileName}
                      fileType={mat.fileType}
                      ossUrl={mat.ossUrl}
                      fileSize={mat.fileSize}
                      compact
                    />
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--color-text-placeholder)] pl-5">
                      <span>{formatDateTime(mat.createdAt)}</span>
                    </div>
                    {mat.remark && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1 pl-5">{mat.remark}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
