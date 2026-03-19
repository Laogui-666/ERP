'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message || '登录失败')
        return
      }

      const user = data.data.user
      if (user.role === 'CUSTOMER') {
        router.push('/customer/orders')
      } else {
        router.push('/admin/dashboard')
      }
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {/* 背景装饰 */}
      <div className="bg-decoration" />

      <div className="w-full max-w-md">
        {/* Logo 区域 */}
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-accent)]/20 backdrop-blur-xl border border-white/10">
            <svg className="w-8 h-8 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            沐海旅行
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
            签证行业 ERP 管理系统
          </p>
        </div>

        {/* 登录表单 */}
        <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
              <div className="rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-4 py-3 text-sm text-[var(--color-error)] animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary w-full py-3 text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : '登 录'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-placeholder)]">
              还没有账号？
              <a href="/register" className="ml-1 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">
                注册入驻
              </a>
            </span>
          </div>
        </div>

        {/* 底部 */}
        <p className="mt-8 text-center text-xs text-[var(--color-text-placeholder)] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Visa ERP v0.1.0 · 沐海旅行 © 2026
        </p>
      </div>
    </div>
  )
}
