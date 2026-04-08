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
  const labelClass = 'block text-xs font-medium text-liquid-mist mb-1'

  return (
    <div className="p-3 rounded-xl bg-liquid-ocean/5 border border-liquid-ocean/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-liquid-oceanLight">
          申请人 {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-xs text-liquid-ruby hover:text-liquid-ruby/80 transition-colors"
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
