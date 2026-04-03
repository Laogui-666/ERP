'use client'

interface ToolPageHeaderProps {
  icon: string
  title: string
  description: string
}

export function ToolPageHeader({ icon, title, description }: ToolPageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="mb-2 text-[22px] font-bold text-[var(--color-text-primary)]">
        {icon} {title}
      </h1>
      <p className="text-[13px] text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  )
}
