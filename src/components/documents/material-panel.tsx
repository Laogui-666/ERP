'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/toast'
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

      const res = await fetch(`/api/orders/${orderId}/materials`, {
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
              (v{materials[0]?.version ?? 1})
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
            {isUploading ? '上传中...' : '上传签证材料'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.zip,image/*"
          />
        </div>
      )}

      {/* 材料列表 */}
      {materials.length === 0 ? (
        <p className="text-xs text-[var(--color-text-placeholder)] py-2">暂无签证材料</p>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div key={mat.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <a
                    href={mat.ossUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-info)] hover:text-[var(--color-primary-light)] truncate block"
                  >
                    {mat.fileName}
                  </a>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-placeholder)]">
                    <span>v{mat.version}</span>
                    <span>·</span>
                    <span>{(mat.fileSize / 1024).toFixed(1)}KB</span>
                    <span>·</span>
                    <span>{new Date(mat.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  {mat.remark && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{mat.remark}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
