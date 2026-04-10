'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DynamicBackground } from '@shared/ui/dynamic-bg'

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
    <div className="flex min-h-screen items-center justify-center px-4 glass-background">
      <DynamicBackground />
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo 区域 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-glass-lg bg-glass-bg-card backdrop-blur-glass border border-glass-border-light shadow-glass-medium glass-card-animate">
            <svg className="w-8 h-8 text-glass-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-glass-text-primary tracking-tight glass-text-gradient glass-text-animate">
            华夏签证
          </h1>
          <p className="mt-2 text-glass-text-muted text-sm tracking-wide glass-text-animate">
            一站式签证服务平台
          </p>
        </div>

        {/* 登录表单 */}
        <div className="glass-card p-6 rounded-glass-lg shadow-glass-medium glass-card-animate">
          <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-glass-text-secondary">用户名</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-glass-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    required
                    className="glass-input w-full pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-glass-text-secondary">密码</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-glass-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码（首次登录可留空）"
                    className="glass-input w-full pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="glass-error p-4 rounded-glass-sm shadow-glass-soft glass-fade-in">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0 text-glass-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary w-full py-3 rounded-glass-sm font-medium transition-all duration-300 hover:shadow-glass-medium hover:-translate-y-0.5 active:shadow-glass-soft active:translate-y-0 glass-button-animate"
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-glass-text-muted">
                还没有账号？
                <Link href="/register" className="ml-1.5 text-glass-primary hover:text-glass-primaryLight transition-colors duration-200 font-medium">
                  注册入驻
                </Link>
              </span>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <p className="mt-8 text-center text-xs text-glass-text-muted opacity-60 tracking-wide glass-text-animate">
          华夏签证 v0.1.0 · 华夏签证 © 2026
        </p>
      </div>
    </div>
  )
}
