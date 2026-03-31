'use client'

interface ApplicantFormItem {
  name: string
  phone: string
  passportNo: string
}

interface ApplicantFormItemProps {
  index: number
  applicant: ApplicantFormItem
  onChange: (index: number, field: keyof ApplicantFormItem, value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export function ApplicantFormItem({ index, applicant, onChange, onRemove, canRemove }: ApplicantFormItemProps) {
  const inputClass = 'glass-input w-full text-sm'
  const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'

  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--color-primary-light)]">
          申请人 {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)]/80 transition-colors"
          >
            移除
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass}>姓名 *</label>
          <input
            className={inputClass}
            placeholder="申请人姓名"
            value={applicant.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>手机号</label>
          <input
            className={inputClass}
            placeholder="138xxxxxxxx"
            value={applicant.phone}
            onChange={(e) => onChange(index, 'phone', e.target.value)}
            maxLength={11}
          />
        </div>
        <div>
          <label className={labelClass}>护照号</label>
          <input
            className={inputClass}
            placeholder="E12345678"
            value={applicant.passportNo}
            onChange={(e) => onChange(index, 'passportNo', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
