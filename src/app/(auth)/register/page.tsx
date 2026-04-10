'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DynamicBackground } from '@shared/ui/dynamic-bg'

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
    <div className="flex min-h-screen items-center justify-center px-4 glass-background">
      <DynamicBackground />
      <div className="relative z-10 w-full max-w-[420px]">
        {/* 标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-glass-text-primary tracking-tight glass-text-gradient glass-text-animate">
            公司入驻
          </h1>
          <p className="mt-2 text-glass-text-muted text-sm glass-text-animate">
            注册账号，开启便捷签证之旅
          </p>
        </div>

        {/* 注册表单 */}
        <div className="glass-card p-6 rounded-glass-lg shadow-glass-medium glass-card-animate">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-glass-text-secondary">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-glass-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={field.icon} />
                      </svg>
                    </div>
                    <input
                      type={field.type}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      required
                      minLength={field.key === 'username' ? 3 : field.key === 'password' ? 8 : undefined}
                      pattern={field.pattern}
                      maxLength={field.key === 'phone' ? 11 : undefined}
                      className="glass-input w-full pl-10"
                    />
                  </div>
                </div>
              ))}

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
                className="glass-button-primary w-full py-3 rounded-glass-sm font-medium transition-all duration-300 hover:shadow-glass-medium hover:-translate-y-0.5 active:shadow-glass-soft active:translate-y-0 glass-button-animate mt-2"
              >
                {loading ? '注册中...' : '立即入驻'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-glass-text-muted">
              已有账号？
              <Link href="/login" className="ml-1.5 text-glass-primary hover:text-glass-primaryLight transition-colors duration-200 font-medium">
                直接登录
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-glass-text-muted opacity-60 tracking-wide glass-text-animate">
          华夏签证 v0.1.0 · 华夏签证 © 2026
        </p>
      </div>
    </div>
  )
}
