'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  backLink?: string
}

export function PageHeader({ title, description, action, backLink }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between anim-initial animate-fade-in-up">
      <div className="flex items-center gap-4">
        {backLink && (
          <Link
            href={backLink}
            className="p-2 rounded-xl bg-liquid-ocean/5 border border-liquid-ocean/10 text-liquid-mist hover:text-liquid-deep hover:bg-liquid-ocean/10 hover:border-liquid-ocean/20 active:scale-90 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div>
          <h1 className="text-[20px] font-bold text-liquid-deep tracking-tight">{title}</h1>
          {description && (
            <div className="mt-1 text-[13px] text-liquid-mist">{description}</div>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  )
}
