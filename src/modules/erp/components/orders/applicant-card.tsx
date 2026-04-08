'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useState } from 'react'
import { Badge } from '@shared/ui/badge'
import { useToast } from '@shared/ui/toast'
import type { Applicant, VisaResult } from '@erp/types/order'

interface ApplicantCardProps {
  applicant: Applicant
  canMarkResult: boolean
  canMarkDocs: boolean
  canEdit?: boolean
  isEditing?: boolean
  editValues?: { name: string; phone: string; passportNo: string }
  onEdit?: () => void
  onEditChange?: (vals: { name: string; phone: string; passportNo: string }) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  isSaving?: boolean
  onRefresh: () => void
}

export function ApplicantCard({ applicant, canMarkResult, canMarkDocs, canEdit, isEditing, editValues, onEdit, onEditChange, onSaveEdit, onCancelEdit, isSaving, onRefresh }: ApplicantCardProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showRejectNote, setShowRejectNote] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const handleResult = async (result: VisaResult) => {
    if (result === 'REJECTED' && !showRejectNote) {
      setShowRejectNote(true)
      return
    }

    setIsUpdating(true)
    try {
      const res = await apiFetch(`/api/applicants/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visaResult: result,
          visaResultNote: result === 'REJECTED' ? (rejectNote || null) : null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', `${applicant.name} 已标记为${result === 'APPROVED' ? '出签' : '拒签'}`)
        if (json.data?.orderStatus) {
          toast('info', `订单状态已更新为 ${json.data.orderStatus}`)
        }
        setShowRejectNote(false)
        setRejectNote('')
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '操作失败')
      }
    } catch {
      toast('error', '操作失败，请重试')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDocsComplete = async (complete: boolean) => {
    setIsUpdating(true)
    try {
      const res = await apiFetch(`/api/applicants/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentsComplete: complete }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', `${applicant.name} 资料已标记为${complete ? '齐全' : '待补充'}`)
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '操作失败')
      }
    } catch {
      toast('error', '操作失败，请重试')
    } finally {
      setIsUpdating(false)
    }
  }

  const resultBadge = () => {
    if (applicant.visaResult === 'APPROVED') {
      return <Badge variant="success" size="sm">出签 ✅</Badge>
    }
    if (applicant.visaResult === 'REJECTED') {
      return <Badge variant="danger" size="sm">拒签 ❌</Badge>
    }
    return null
  }

  // 编辑模式
  if (isEditing && editValues && onEditChange) {
    return (
      <div className="relative flex items-center justify-between p-3 rounded-xl bg-liquid-ocean/5 border border-liquid-ocean/20 transition-all">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-liquid-ocean/15 flex items-center justify-center text-xs font-medium text-liquid-oceanLight shrink-0">
            {editValues.name[0] || '?'}
          </div>
          <div className="grid grid-cols-3 gap-2 flex-1">
            <input
              className="glass-input text-xs py-1 px-2"
              placeholder="姓名"
              value={editValues.name}
              onChange={(e) => onEditChange({ ...editValues, name: e.target.value })}
              autoFocus
            />
            <input
              className="glass-input text-xs py-1 px-2"
              placeholder="手机号"
              value={editValues.phone}
              onChange={(e) => onEditChange({ ...editValues, phone: e.target.value })}
            />
            <input
              className="glass-input text-xs py-1 px-2"
              placeholder="护照号"
              value={editValues.passportNo}
              onChange={(e) => onEditChange({ ...editValues, passportNo: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={onCancelEdit}
            className="text-[10px] px-2 py-1 rounded bg-liquid-ocean/5 text-liquid-mist hover:bg-liquid-ocean/10 transition-all"
          >
            取消
          </button>
          <button
            onClick={onSaveEdit}
            disabled={isSaving}
            className="text-[10px] px-2 py-1 rounded bg-liquid-ocean/15 text-liquid-oceanLight hover:bg-liquid-ocean/25 transition-all disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    )
  }

  // 正常模式
  return (
    <div className="relative flex items-center justify-between p-3 rounded-xl bg-liquid-ocean/5 border border-liquid-ocean/10 hover:bg-liquid-ocean/10 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* 头像 */}
        <div className="w-8 h-8 rounded-full bg-liquid-ocean/15 flex items-center justify-center text-xs font-medium text-liquid-oceanLight shrink-0">
          {applicant.name[0]}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-liquid-deep truncate">{applicant.name}</div>
          <div className="text-xs text-liquid-mist/60 truncate">
            {applicant.phone ?? '无手机号'}
            {applicant.passportNo && ` · ${applicant.passportNo}`}
          </div>
          {applicant.visaResultNote && (
            <div className="text-xs text-liquid-ruby mt-0.5 truncate">备注: {applicant.visaResultNote}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* 编辑按钮 */}
        {canEdit && !applicant.visaResult && (
          <button
            onClick={onEdit}
            className="text-[10px] px-1.5 py-0.5 rounded bg-liquid-ocean/5 text-liquid-mist hover:bg-liquid-ocean/10 transition-all"
          >
            编辑
          </button>
        )}

        {/* 资料状态 */}
        <Badge variant={applicant.documentsComplete ? 'success' : 'warning'} size="sm">
          {applicant.documentsComplete ? '资料齐全' : '收集中'}
        </Badge>

        {/* 资料标记按钮 */}
        {canMarkDocs && !applicant.visaResult && (
          <button
            onClick={() => handleDocsComplete(!applicant.documentsComplete)}
            disabled={isUpdating}
            className="text-[10px] px-1.5 py-0.5 rounded bg-liquid-ocean/5 text-liquid-mist hover:bg-liquid-ocean/10 transition-all disabled:opacity-50"
          >
            {applicant.documentsComplete ? '撤销' : '标记齐全'}
          </button>
        )}

        {/* 出签结果 */}
        {resultBadge()}

        {/* 标记结果按钮 */}
        {canMarkResult && !applicant.visaResult && (
          <div className="flex gap-1">
            <button
              onClick={() => handleResult('APPROVED')}
              disabled={isUpdating}
              className="text-[10px] px-2 py-1 rounded bg-liquid-emerald/15 text-liquid-emerald hover:bg-liquid-emerald/25 transition-all disabled:opacity-50"
            >
              出签
            </button>
            <button
              onClick={() => handleResult('REJECTED')}
              disabled={isUpdating}
              className="text-[10px] px-2 py-1 rounded bg-liquid-ruby/15 text-liquid-ruby hover:bg-liquid-ruby/25 transition-all disabled:opacity-50"
            >
              拒签
            </button>
          </div>
        )}
      </div>

      {/* 拒签备注弹出 */}
      {showRejectNote && (
        <div className="absolute mt-1 right-0 w-64 p-3 rounded-xl bg-liquid-cream border border-liquid-ocean/10 shadow-xl z-10">
          <label className="block text-xs text-liquid-mist mb-1.5">拒签原因（可选）</label>
          <textarea
            className="glass-input w-full text-xs resize-none"
            rows={2}
            placeholder="请输入拒签原因..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setShowRejectNote(false); setRejectNote('') }}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-liquid-ocean/5 text-liquid-mist hover:bg-liquid-ocean/10"
            >
              取消
            </button>
            <button
              onClick={() => handleResult('REJECTED')}
              disabled={isUpdating}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-liquid-ruby/20 text-liquid-ruby hover:bg-liquid-ruby/30 disabled:opacity-50"
            >
              {isUpdating ? '处理中...' : '确认拒签'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
