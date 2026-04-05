'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialUsername = searchParams.get('username') ?? ''

  const [form, setForm] = useState({
    username: initialUsername,
    phone: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingUser, setFetchingUser] = useState(false)

  // 编辑锁定状态：默认不可编辑，点击"修改"才可编辑
  const [usernameLocked, setUsernameLocked] = useState(!!initialUsername)
  const [phoneLocked, setPhoneLocked] = useState(true)

  // 根据用户名拉取用户信息，预填手机号
  const fetchUserInfo = useCallback(async (username: string) => {
    if (!username) return
    setFetchingUser(true)
    try {
      const res = await fetch(`/api/auth/user-info?username=${encodeURIComponent(username)}`)
      const json = await res.json()
      if (json.success) {
        const { phone, isFirstLogin } = json.data
        if (phone) {
          setForm(prev => ({ ...prev, phone }))
        }
        if (!isFirstLogin) {
          setError('该账号已设置密码，请直接登录')
        }
      }
    } catch {
      // 静默失败，用户可手动填写
    } finally {
      setFetchingUser(false)
    }
  }, [])

  // 页面加载时如果有 username 参数，自动拉取用户信息
  useEffect(() => {
    if (initialUsername) {
      fetchUserInfo(initialUsername)
    }
  }, [initialUsername, fetchUserInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    if (form.newPassword.length < 8) {
      setError('密码至少8位')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          phone: form.phone,
          newPassword: form.newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message || '重置失败')
        return
      }

      router.push('/customer/orders')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center anim-initial animate-spring-in">
          <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[var(--color-warning)]/25 to-[var(--color-primary)]/15 backdrop-blur-xl border border-white/[0.08] shadow-lg shadow-[var(--color-warning)]/5">
            <svg className="w-7 h-7 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] tracking-tight">
            首次登录 · 设置密码
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] text-[13px]">
            验证身份后设置您的登录密码
          </p>
        </div>

        <div className="glass-card p-7 md:p-8 anim-initial animate-fade-in-up delay-150">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
                用户名
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="glass-input flex-1"
                  placeholder="请输入用户名（客服已创建）"
                  required
                  readOnly={usernameLocked}
                />
                {usernameLocked && (
                  <button
                    type="button"
                    onClick={() => setUsernameLocked(false)}
                    className="shrink-0 px-3 rounded-xl text-[12px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors"
                  >
                    修改
                  </button>
                )}
              </div>
            </div>

            {/* 手机号 */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
                手机号
                {fetchingUser && (
                  <span className="ml-2 text-[var(--color-text-placeholder)] normal-case font-normal">加载中...</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="glass-input flex-1"
                  placeholder="请输入注册时的手机号"
                  required
                  readOnly={phoneLocked}
                />
                {phoneLocked && (
                  <button
                    type="button"
                    onClick={() => setPhoneLocked(false)}
                    className="shrink-0 px-3 rounded-xl text-[12px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors"
                  >
                    修改
                  </button>
                )}
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
                新密码
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="glass-input w-full"
                placeholder="至少8位，含大小写+数字"
                required
                minLength={8}
              />
            </div>

            {/* 确认密码 */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
                确认密码
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="glass-input w-full"
                placeholder="再次输入新密码"
                required
              />
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
              className="glass-btn-primary w-full py-3 text-center text-[14px] font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  设置中...
                </span>
              ) : '设置密码并登录'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[var(--color-text-placeholder)]">
            已有密码？
            <Link href="/login" className="ml-1.5 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors duration-200 font-medium">
              直接登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[var(--color-text-placeholder)] text-[13px] animate-pulse">加载中...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
