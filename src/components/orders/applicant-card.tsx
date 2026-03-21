'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Applicant, VisaResult } from '@/types/order'

interface ApplicantCardProps {
  applicant: Applicant
  canMarkResult: boolean
  onResultChange?: (id: string, result: VisaResult, note?: string) => void
  onDocumentsChange?: (id: string, complete: boolean) => void
}

export function ApplicantCard({
  applicant,
  canMarkResult,
  onResultChange,
  onDocumentsChange,
}: ApplicantCardProps) {
  const [showResultForm, setShowResultForm] = useState(false)
  const [resultNote, setResultNote] = useState('')
  const [pendingResult, setPendingResult] = useState<VisaResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirmResult = async () => {
    if (!pendingResult) return
    setIsSubmitting(true)
    try {
      await onResultChange?.(applicant.id, pendingResult, resultNote || undefined)
      setShowResultForm(false)
      setPendingResult(null)
      setResultNote('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xs font-medium text-[var(--color-primary-light)]">
            {applicant.name[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">{applicant.name}</div>
            <div className="text-xs text-[var(--color-text-placeholder)]">
              {applicant.phone || '无手机号'}
              {applicant.passportNo && ` · 护照 ${applicant.passportNo}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* 资料状态 */}
          <Badge variant={applicant.documentsComplete ? 'success' : 'warning'} size="sm">
            {applicant.documentsComplete ? '资料齐全' : '收集中'}
          </Badge>

          {/* 出签结果 */}
          {applicant.visaResult === 'APPROVED' && (
            <Badge variant="success" size="sm">出签 ✅</Badge>
          )}
          {applicant.visaResult === 'REJECTED' && (
            <Badge variant="danger" size="sm">拒签 ❌</Badge>
          )}
        </div>
      </div>

      {/* 拒签备注 */}
      {applicant.visaResultNote && (
        <div className="text-xs text-[var(--color-text-secondary)] pl-11">
          备注：{applicant.visaResultNote}
        </div>
      )}

      {/* 出签时间 */}
      {applicant.visaResultAt && (
        <div className="text-xs text-[var(--color-text-placeholder)] pl-11">
          结果时间：{new Date(applicant.visaResultAt).toLocaleString('zh-CN')}
        </div>
      )}

      {/* 操作按钮 */}
      {!applicant.visaResult && canMarkResult && (
        <div className="flex items-center gap-2 pl-11 mt-1">
          <button
            onClick={() => { setPendingResult('APPROVED'); setShowResultForm(true) }}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 hover:bg-[var(--color-success)]/20 transition-all"
          >
            出签
          </button>
          <button
            onClick={() => { setPendingResult('REJECTED'); setShowResultForm(true) }}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 hover:bg-[var(--color-error)]/20 transition-all"
          >
            拒签
          </button>
          {/* 资料状态切换 */}
          <button
            onClick={() => onDocumentsChange?.(applicant.id, !applicant.documentsComplete)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[var(--color-text-secondary)] border border-white/5 hover:bg-white/10 transition-all"
          >
            {applicant.documentsComplete ? '标为待补' : '标为齐全'}
          </button>
        </div>
      )}

      {/* 出签/拒签确认表单 */}
      {showResultForm && (
        <div className="pl-11 mt-1 space-y-2">
          <textarea
            className="glass-input w-full text-xs resize-none"
            rows={2}
            placeholder={pendingResult === 'REJECTED' ? '拒签原因（可选）...' : '备注（可选）...'}
            value={resultNote}
            onChange={(e) => setResultNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleConfirmResult}
              disabled={isSubmitting}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50 ${
                pendingResult === 'APPROVED'
                  ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30'
                  : 'bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30'
              }`}
            >
              {isSubmitting ? '提交中...' : `确认${pendingResult === 'APPROVED' ? '出签' : '拒签'}`}
            </button>
            <button
              onClick={() => { setShowResultForm(false); setPendingResult(null); setResultNote('') }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
