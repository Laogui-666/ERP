'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: '',
    username: '',
    password: '',
    realName: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: { name: form.companyName },
          user: {
            username: form.username,
            password: form.password,
            realName: form.realName,
            phone: form.phone,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message || '注册失败')
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const fields: { key: string; label: string; placeholder: string; type: string; icon: string; pattern?: string }[] = [
    { key: 'companyName', label: '公司名称', placeholder: '请输入公司名称', type: 'text', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { key: 'realName', label: '管理员姓名', placeholder: '请输入姓名', type: 'text', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'phone', label: '手机号', placeholder: '请输入手机号', type: 'tel', pattern: '^1[3-9]\\d{9}$', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { key: 'username', label: '登录用户名', placeholder: '至少3个字符', type: 'text', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'password', label: '密码', placeholder: '至少8位，含大小写+数字', type: 'password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="bg-decoration" />

      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            公司入驻
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
            注册账号，开始使用签证 ERP 系统
          </p>
        </div>

        {/* 注册表单 */}
        <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={field.icon} />
                    </svg>
                  </div>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="glass-input w-full pl-10"
                    placeholder={field.placeholder}
                    required
                    minLength={field.key === 'username' ? 3 : field.key === 'password' ? 8 : undefined}
                    pattern={field.pattern}
                    maxLength={field.key === 'phone' ? 11 : undefined}
                  />
                </div>
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
                  注册中...
                </span>
              ) : '立即入驻'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-placeholder)]">
            已有账号？
            <a href="/login" className="ml-1 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">
              直接登录
            </a>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--color-text-placeholder)] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Visa ERP v0.1.0 · 沐海旅行 © 2026
        </p>
      </div>
    </div>
  )
}
