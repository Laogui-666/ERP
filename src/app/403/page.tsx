'use client'

import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'

export default function ForbiddenPage() {
  const { user } = useAuth()
  const homeHref = user?.role === 'CUSTOMER' ? '/' : '/admin/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-error)]/20 to-[var(--color-error)]/5 border border-[var(--color-error)]/20">
          <svg className="w-10 h-10 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 00-8 0v4h8zm-8 0H4a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">403</h1>
        <p className="text-lg text-[var(--color-text-secondary)] mb-6">无权访问此页面</p>
        <p className="text-sm text-[var(--color-text-placeholder)] mb-8">
          您的角色权限不足，无法访问该资源。<br />
          如需帮助，请联系管理员。
        </p>
        <Link
          href={homeHref}
          className="glass-btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  )
}
