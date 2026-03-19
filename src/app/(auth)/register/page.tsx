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
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            公司入驻
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            注册账号，开始使用签证ERP系统
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              公司名称
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="glass-input w-full"
              placeholder="请输入公司名称"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              管理员姓名
            </label>
            <input
              type="text"
              value={form.realName}
              onChange={(e) => setForm({ ...form, realName: e.target.value })}
              className="glass-input w-full"
              placeholder="请输入姓名"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              手机号
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="glass-input w-full"
              placeholder="请输入手机号"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              登录用户名
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="glass-input w-full"
              placeholder="至少3个字符"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="glass-input w-full"
              placeholder="至少8位，含大小写+数字"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-btn-primary w-full py-3 text-center font-medium disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-placeholder)]">
          已有账号？
          <a href="/login" className="ml-1 text-[var(--color-primary)] hover:underline">
            直接登录
          </a>
        </p>
      </div>
    </div>
  )
}
