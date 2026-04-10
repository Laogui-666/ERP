'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LiquidCard, LiquidCardContent } from '@design-system/components/liquid-card'
import { LiquidInput } from '@design-system/components/liquid-input'
import { LiquidButton } from '@design-system/components/liquid-button'

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
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-liquid-light to-liquid-cream">
      <div className="w-full max-w-[400px]">
        {/* Logo 区域 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-3xl bg-liquid-surface/80 backdrop-blur-2xl border border-liquid-border/50 shadow-liquid-medium">
            <svg className="w-8 h-8 text-liquid-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-liquid-deep tracking-tight">
            华夏签证
          </h1>
          <p className="mt-2 text-liquid-mist text-sm tracking-wide">
            一站式签证服务平台
          </p>
        </div>

        {/* 登录表单 */}
        <LiquidCard padding="lg" variant="liquid-elevated">
          <LiquidCardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
            <LiquidInput
              label="用户名"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              leftIcon={
                <svg className="w-4 h-4 text-liquid-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <LiquidInput
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（首次登录可留空）"
              leftIcon={
                <svg className="w-4 h-4 text-liquid-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
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
            >
              {loading ? '登录中...' : '登 录'}
            </LiquidButton>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-liquid-mist">
              还没有账号？
              <Link href="/register" className="ml-1.5 text-liquid-ocean hover:text-liquid-oceanLight transition-colors duration-200 font-medium">
                注册入驻
              </Link>
            </span>
          </div>
          </LiquidCardContent>
        </LiquidCard>

        {/* 底部 */}
        <p className="mt-8 text-center text-xs text-liquid-mist opacity-60 tracking-wide">
          华夏签证 v0.1.0 · 华夏签证 © 2026
        </p>
      </div>
    </div>
  )
}
