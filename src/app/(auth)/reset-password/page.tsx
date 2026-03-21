'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

      // 重置成功，自动登录，跳转到客户订单页
      router.push('/customer/orders')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'username', label: '用户名', placeholder: '请输入用户名（客服已创建）', type: 'text' },
    { key: 'phone', label: '手机号', placeholder: '请输入注册时的手机号', type: 'tel' },
    { key: 'newPassword', label: '新密码', placeholder: '至少8位，含大小写+数字', type: 'password' },
    { key: 'confirmPassword', label: '确认密码', placeholder: '再次输入新密码', type: 'password' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="bg-decoration" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-warning)]/30 to-[var(--color-primary)]/20 backdrop-blur-xl border border-white/10">
            <svg className="w-7 h-7 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            首次登录 · 设置密码
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
            验证身份后设置您的登录密码
          </p>
        </div>

        <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="glass-input w-full"
                  placeholder={field.placeholder}
                  required
                  minLength={field.key === 'newPassword' ? 8 : undefined}
                />
              </div>
            ))}

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
                  设置中...
                </span>
              ) : '设置密码并登录'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-placeholder)]">
            已有密码？
            <a href="/login" className="ml-1 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">
              直接登录
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--color-text-placeholder)]">加载中...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
