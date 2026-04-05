'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? '登录失败')

      const user = json.data.user
      // 按角色智能跳转到对应工作台
      const roleRedirect: Record<string, string> = {
        SUPER_ADMIN: '/admin/dashboard',
        COMPANY_OWNER: '/admin/dashboard',
        CS_ADMIN: '/admin/dashboard',
        CUSTOMER_SERVICE: '/admin/workspace',
        VISA_ADMIN: '/admin/dashboard',
        DOC_COLLECTOR: '/admin/workspace',
        OPERATOR: '/admin/workspace',
        OUTSOURCE: '/admin/workspace',
        CUSTOMER: '/customer/orders',
      }
      const target = roleRedirect[user.role] ?? '/'
      router.push(target)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败'
      // 客户首次登录 → 跳转重置密码
      if (msg.includes('首次登录') || msg.includes('RESET_REQUIRED')) {
        router.push(`/reset-password?username=${encodeURIComponent(username)}`)
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo 区域 */}
        <div className="mb-10 text-center anim-initial animate-spring-in">
          <div className="mx-auto mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-[20px] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 backdrop-blur-xl border border-white/[0.08] shadow-lg shadow-[var(--color-primary)]/5">
            <svg className="w-8 h-8 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
            华夏签证
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] text-[13px] tracking-wide">
            一站式签证服务平台
          </p>
        </div>

        {/* 登录表单 */}
        <div className="glass-card p-7 md:p-8 anim-initial animate-fade-in-up delay-150">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-[12px] font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-[16px] h-[16px] text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full pl-10"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-[16px] h-[16px] text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/15 px-4 py-3 text-[13px] text-[var(--color-error)] animate-shake">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary w-full py-3 text-center text-[14px] font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : '登 录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[13px] text-[var(--color-text-placeholder)]">
              还没有账号？
              <Link href="/register" className="ml-1.5 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors duration-200 font-medium">
                注册入驻
              </Link>
            </span>
          </div>
        </div>

        {/* 底部 */}
        <p className="mt-8 text-center text-[11px] text-[var(--color-text-placeholder)] opacity-50 anim-initial animate-fade-in delay-300 tracking-wide">
          华夏签证 v0.1.0 · 华夏签证 © 2026
        </p>
      </div>
    </div>
  )
}
