'use client'

interface ApplicantFormItemData {
  name: string
  phone: string
  passportNo: string
}

interface ApplicantFormItemProps {
  index: number
  applicant: ApplicantFormItemData
  canRemove: boolean
  onChange: (index: number, field: keyof ApplicantFormItemData, value: string) => void
  onRemove: (index: number) => void
}

export function ApplicantFormItem({
  index,
  applicant,
  canRemove,
  onChange,
  onRemove,
}: ApplicantFormItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-medium text-[var(--color-primary-light)] mt-1">
        {index + 1}
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[var(--color-text-placeholder)] mb-1">姓名 *</label>
          <input
            className="glass-input w-full text-sm"
            placeholder="申请人姓名"
            value={applicant.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-placeholder)] mb-1">手机号</label>
          <input
            className="glass-input w-full text-sm"
            placeholder="手机号"
            value={applicant.phone}
            onChange={(e) => onChange(index, 'phone', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-placeholder)] mb-1">护照号</label>
          <input
            className="glass-input w-full text-sm"
            placeholder="护照号"
            value={applicant.passportNo}
            onChange={(e) => onChange(index, 'passportNo', e.target.value)}
          />
        </div>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex-shrink-0 mt-1 w-7 h-7 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center hover:bg-[var(--color-error)]/20 transition-all"
          title="删除申请人"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export type { ApplicantFormItemData }
