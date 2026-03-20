'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/toast'
import { DOC_REQ_STATUS_LABELS } from '@/types/order'
import type { DocumentRequirement, DocReqStatus } from '@/types/order'
import type { UserRole } from '@/types/user'

interface DocumentPanelProps {
  orderId: string
  requirements: DocumentRequirement[]
  userRole: UserRole
  orderStatus: string
  onRefresh: () => void
}

export function DocumentPanel({ orderId, requirements, userRole, orderStatus: _orderStatus, onRefresh }: DocumentPanelProps) {
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewReason, setReviewReason] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetReqId, setTargetReqId] = useState<string | null>(null)

  // 角色权限判断
  const canEdit = ['DOC_COLLECTOR', 'VISA_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'].includes(userRole)
  const canReview = ['DOC_COLLECTOR', 'VISA_ADMIN', 'OPERATOR', 'OUTSOURCE'].includes(userRole)
  const canUpload = ['CUSTOMER', 'DOC_COLLECTOR', 'VISA_ADMIN'].includes(userRole)

  // 添加资料需求项
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast('error', '请输入资料名称')
      return
    }
    setIsAdding(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: newItemName.trim(),
            description: newItemDesc.trim() || undefined,
            isRequired: newItemRequired,
          }],
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '已添加')
        setNewItemName('')
        setNewItemDesc('')
        setShowAddForm(false)
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch {
      toast('error', '添加失败')
    } finally {
      setIsAdding(false)
    }
  }

  // 上传文件
  const handleUploadClick = (requirementId: string) => {
    setTargetReqId(requirementId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !targetReqId) return

    setUploadingId(targetReqId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('requirementId', targetReqId)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        toast('success', `文件 ${file.name} 上传成功`)
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '上传失败')
      }
    } catch {
      toast('error', '上传失败')
    } finally {
      setUploadingId(null)
      setTargetReqId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 审核资料
  const handleReview = async (reqId: string, status: DocReqStatus) => {
    setReviewingId(reqId)
    try {
      const res = await fetch(`/api/documents/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectReason: (status === 'REJECTED' || status === 'SUPPLEMENT') ? reviewReason : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '审核完成')
        setReviewingId(null)
        setReviewReason('')
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '审核失败')
      }
    } catch {
      toast('error', '审核失败')
    } finally {
      setReviewingId(null)
    }
  }

  // 统计
  const approved = requirements.filter((r) => r.status === 'APPROVED').length
  const total = requirements.length

  return (
    <div className="space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          资料清单
          {total > 0 && (
            <span className="text-xs text-[var(--color-text-placeholder)] font-normal">
              ({approved}/{total} 已合格)
            </span>
          )}
        </h3>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors"
          >
            {showAddForm ? '取消' : '+ 添加'}
          </button>
        )}
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <input
            className="glass-input w-full text-sm"
            placeholder="资料名称（如：护照、照片）"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            className="glass-input w-full text-sm"
            placeholder="说明（可选，如：有效期6个月以上）"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={newItemRequired}
                onChange={(e) => setNewItemRequired(e.target.checked)}
                className="accent-[var(--color-primary)]"
              />
              必填项
            </label>
            <button
              onClick={handleAddItem}
              disabled={isAdding}
              className="glass-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {isAdding ? '添加中...' : '确定'}
            </button>
          </div>
        </div>
      )}

      {/* 资料列表 */}
      {requirements.length === 0 ? (
        <p className="text-xs text-[var(--color-text-placeholder)] py-2">暂无资料需求</p>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => (
            <DocumentItem
              key={req.id}
              req={req}
              canUpload={canUpload && ['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(req.status)}
              canReview={canReview && req.status === 'UPLOADED'}
              isUploading={uploadingId === req.id}
              isReviewing={reviewingId === req.id}
              reviewReason={reviewReason}
              onReviewReasonChange={setReviewReason}
              onUpload={() => handleUploadClick(req.id)}
              onApprove={() => handleReview(req.id, 'APPROVED')}
              onReject={(status) => handleReview(req.id, status)}
            />
          ))}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt"
      />
    </div>
  )
}

// 单条资料需求
function DocumentItem({
  req, canUpload, canReview, isUploading, isReviewing,
  reviewReason, onReviewReasonChange, onUpload, onApprove, onReject,
}: {
  req: DocumentRequirement
  canUpload: boolean
  canReview: boolean
  isUploading: boolean
  isReviewing: boolean
  reviewReason: string
  onReviewReasonChange: (v: string) => void
  onUpload: () => void
  onApprove: () => void
  onReject: (status: 'REJECTED' | 'SUPPLEMENT') => void
}) {
  const [showReviewForm, setShowReviewForm] = useState(false)

  const statusColor: Record<DocReqStatus, string> = {
    PENDING: 'bg-[var(--color-text-placeholder)]',
    UPLOADED: 'bg-[var(--color-info)]',
    REVIEWING: 'bg-[var(--color-accent)]',
    APPROVED: 'bg-[var(--color-success)]',
    REJECTED: 'bg-[var(--color-error)]',
    SUPPLEMENT: 'bg-[var(--color-warning)]',
  }

  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-start gap-3">
        {/* 状态点 */}
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusColor[req.status]}`} />

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-primary)] font-medium">{req.name}</span>
            {req.isRequired && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-error)]/15 text-[var(--color-error)]">必填</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--color-text-placeholder)]">
              {DOC_REQ_STATUS_LABELS[req.status]}
            </span>
          </div>
          {req.description && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{req.description}</p>
          )}
          {req.rejectReason && (
            <p className="text-xs text-[var(--color-error)] mt-1">驳回原因：{req.rejectReason}</p>
          )}

          {/* 已上传文件 */}
          {req.files.length > 0 && (
            <div className="mt-2 space-y-1">
              {req.files.map((file) => (
                <div key={file.id} className="flex items-center gap-2 text-xs">
                  <svg className="w-3.5 h-3.5 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <a
                    href={file.ossUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-info)] hover:text-[var(--color-primary-light)] truncate max-w-[200px]"
                  >
                    {file.fileName}
                  </a>
                  <span className="text-[var(--color-text-placeholder)] shrink-0">
                    ({(file.fileSize / 1024).toFixed(1)}KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 mt-2">
            {canUpload && (
              <button
                onClick={onUpload}
                disabled={isUploading}
                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-info)]/15 text-[var(--color-info)] hover:bg-[var(--color-info)]/25 transition-colors disabled:opacity-50"
              >
                {isUploading ? '上传中...' : '上传文件'}
              </button>
            )}
            {canReview && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors"
              >
                审核
              </button>
            )}
          </div>

          {/* 审核表单 */}
          {showReviewForm && (
            <div className="mt-2 p-2 rounded-lg bg-white/[0.03] space-y-2">
              <textarea
                className="glass-input w-full text-xs resize-none"
                rows={2}
                placeholder="审核意见（驳回时必填）"
                value={reviewReason}
                onChange={(e) => onReviewReasonChange(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onApprove(); setShowReviewForm(false) }}
                  disabled={isReviewing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-success)]/15 text-[var(--color-success)] hover:bg-[var(--color-success)]/25 transition-colors disabled:opacity-50"
                >
                  合格
                </button>
                <button
                  onClick={() => { onReject('REJECTED'); setShowReviewForm(false) }}
                  disabled={isReviewing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-error)]/15 text-[var(--color-error)] hover:bg-[var(--color-error)]/25 transition-colors disabled:opacity-50"
                >
                  需修改
                </button>
                <button
                  onClick={() => { onReject('SUPPLEMENT'); setShowReviewForm(false) }}
                  disabled={isReviewing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-warning)]/15 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/25 transition-colors disabled:opacity-50"
                >
                  需补充
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-xs px-3 py-1.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)]"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
