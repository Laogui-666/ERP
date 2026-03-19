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
            沐海旅行
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            签证ERP系统
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full"
              placeholder="请输入密码"
              required
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
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-placeholder)]">
          还没有账号？
          <a href="/register" className="ml-1 text-[var(--color-primary)] hover:underline">
            注册入驻
          </a>
        </p>
      </div>
    </div>
  )
}
