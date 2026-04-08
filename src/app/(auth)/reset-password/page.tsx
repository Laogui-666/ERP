'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LiquidCard, LiquidCardContent } from '@design-system/components/liquid-card'
import { LiquidInput } from '@design-system/components/liquid-input'
import { LiquidButton } from '@design-system/components/liquid-button'

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
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-liquid">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/50 shadow-liquid-medium">
            <svg className="w-7 h-7 text-liquid-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-liquid-deep tracking-tight">
            首次登录 · 设置密码
          </h1>
          <p className="mt-2 text-liquid-mist text-sm">
            验证身份后设置您的登录密码
          </p>
        </div>

        <LiquidCard padding="lg" variant="liquid-elevated">
          <LiquidCardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-liquid-deep">
                用户名
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="flex-1 w-full px-5 py-4 md:py-3.5 rounded-3xl transition-all duration-300 focus:outline-none text-base md:text-sm bg-white/55 backdrop-blur-xl border border-white/50 focus:bg-white/70 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium"
                  placeholder="请输入用户名（客服已创建）"
                  required
                  readOnly={usernameLocked}
                />
                {usernameLocked && (
                  <button
                    type="button"
                    onClick={() => setUsernameLocked(false)}
                    className="shrink-0 px-3 py-3 rounded-2xl text-sm text-liquid-ocean bg-liquid-ocean/10 hover:bg-liquid-ocean/20 transition-colors"
                  >
                    修改
                  </button>
                )}
              </div>
            </div>

            {/* 手机号 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-liquid-deep">
                手机号
                {fetchingUser && (
                  <span className="ml-2 text-liquid-mist normal-case font-normal">加载中...</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="flex-1 w-full px-5 py-4 md:py-3.5 rounded-3xl transition-all duration-300 focus:outline-none text-base md:text-sm bg-white/55 backdrop-blur-xl border border-white/50 focus:bg-white/70 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium"
                  placeholder="请输入注册时的手机号"
                  required
                  readOnly={phoneLocked}
                />
                {phoneLocked && (
                  <button
                    type="button"
                    onClick={() => setPhoneLocked(false)}
                    className="shrink-0 px-3 py-3 rounded-2xl text-sm text-liquid-ocean bg-liquid-ocean/10 hover:bg-liquid-ocean/20 transition-colors"
                  >
                    修改
                  </button>
                )}
              </div>
            </div>

            {/* 新密码 */}
            <LiquidInput
              label="新密码"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="至少8位，含大小写+数字"
              required
              minLength={8}
            />

            {/* 确认密码 */}
            <LiquidInput
              label="确认密码"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="再次输入新密码"
              required
            />

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-400/30 px-4 py-3 text-sm text-red-500 animate-shake">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <LiquidButton
              type="submit"
              disabled={loading}
              isLoading={loading}
              width="full"
              size="lg"
              variant="primary"
              className="mt-2"
            >
              {loading ? '设置中...' : '设置密码并登录'}
            </LiquidButton>
          </form>

          <p className="mt-6 text-center text-sm text-liquid-mist">
            已有密码？
            <Link href="/login" className="ml-1.5 text-liquid-ocean hover:text-liquid-oceanLight transition-colors duration-200 font-medium">
              直接登录
            </Link>
          </p>
          </LiquidCardContent>
        </LiquidCard>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-liquid-mist/60 text-[13px] animate-pulse">加载中...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
