'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'
import { GlassCard } from '@shared/ui/glass-card'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { USER_ROLE_LABELS } from '@shared/types/user'

export default function CustomerProfilePage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()

  // 修改密码
  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})

  // 密码可见性
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validateNewPassword = (pw: string): string | null => {
    if (pw.length < 8) return '至少8位'
    if (!/[a-z]/.test(pw)) return '需包含小写字母'
    if (!/[A-Z]/.test(pw)) return '需包含大写字母'
    if (!/\d/.test(pw)) return '需包含数字'
    return null
  }

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value)
    if (value) {
      const err = validateNewPassword(value)
      setPwErrors((prev) => ({ ...prev, newPassword: err ?? '' }))
    } else {
      setPwErrors((prev) => ({ ...prev, newPassword: '' }))
    }
    if (confirmPw && value !== confirmPw) {
      setPwErrors((prev) => ({ ...prev, confirmPw: '两次输入不一致' }))
    } else if (confirmPw) {
      setPwErrors((prev) => ({ ...prev, confirmPw: '' }))
    }
  }

  const handleConfirmChange = (value: string) => {
    setConfirmPw(value)
    if (value && value !== newPassword) {
      setPwErrors((prev) => ({ ...prev, confirmPw: '两次输入不一致' }))
    } else {
      setPwErrors((prev) => ({ ...prev, confirmPw: '' }))
    }
  }

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {}
    if (!oldPassword) errors.oldPassword = '请输入当前密码'
    const newErr = validateNewPassword(newPassword)
    if (newErr) errors.newPassword = newErr
    if (newPassword !== confirmPw) errors.confirmPw = '两次输入不一致'

    if (Object.keys(errors).length > 0) {
      setPwErrors(errors)
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '密码修改成功')
        setShowPwForm(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmPw('')
        setPwErrors({})
      } else {
        toast('error', json.error?.message ?? '修改失败')
      }
    } catch {
      toast('error', '修改失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('确定退出登录？')) return
    await logout()
  }

  if (!user) return null

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">我的</h2>

      {/* 用户信息卡 */}
      <GlassCard className="p-5 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xl font-bold text-[var(--color-primary)]">
            {user.realName?.[0] ?? user.username[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {user.realName ?? user.username}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-placeholder)]">
              {user.phone}
            </p>
            {user.email && (
              <p className="text-xs text-[var(--color-text-placeholder)]">{user.email}</p>
            )}
            <p className="mt-1 text-[10px] text-[var(--color-accent)]">
              {USER_ROLE_LABELS[user.role]}
              {user.department?.name && ` · ${user.department.name}`}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 菜单 */}
      <GlassCard className="animate-fade-in-up divide-y divide-white/[0.06]" style={{ animationDelay: '50ms' }}>
        <Link
          href="/customer/orders"
          className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <span className="text-sm text-[var(--color-text-primary)]">我的订单</span>
          </div>
          <svg className="h-4 w-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <button
          onClick={() => setShowPwForm(!showPwForm)}
          className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🔒</span>
            <span className="text-sm text-[var(--color-text-primary)]">修改密码</span>
          </div>
          <svg
            className={`h-4 w-4 text-[var(--color-text-placeholder)] transition-transform ${showPwForm ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </GlassCard>

      {/* 修改密码表单 */}
      {showPwForm && (
        <GlassCard className="animate-fade-in-up space-y-3 p-5" style={{ animationDelay: '100ms' }}>
          <PasswordInput
            label="当前密码"
            value={oldPassword}
            onChange={setOldPassword}
            show={showOld}
            onToggle={() => setShowOld(!showOld)}
            error={pwErrors.oldPassword}
            placeholder="请输入当前密码"
          />
          <PasswordInput
            label="新密码"
            value={newPassword}
            onChange={handleNewPasswordChange}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            error={pwErrors.newPassword}
            placeholder="至少8位，含大小写+数字"
          />
          {newPassword && !pwErrors.newPassword && (
            <PasswordStrength password={newPassword} />
          )}
          <PasswordInput
            label="确认新密码"
            value={confirmPw}
            onChange={handleConfirmChange}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            error={pwErrors.confirmPw}
            placeholder="再次输入新密码"
          />
          <button
            onClick={handleChangePassword}
            disabled={isSaving}
            className="w-full rounded-xl bg-gradient-to-r from-[rgba(124,141,166,0.4)] to-[rgba(124,141,166,0.2)] py-2.5 text-sm font-medium text-[var(--color-text-primary)] backdrop-blur-sm transition-all hover:from-[rgba(124,141,166,0.55)] hover:to-[rgba(124,141,166,0.35)] disabled:opacity-50"
          >
            {isSaving ? '提交中...' : '确认修改'}
          </button>
        </GlassCard>
      )}

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-[var(--color-error)]/30 py-3 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
      >
        退出登录
      </button>
    </div>
  )
}

// ==================== 子组件 ====================

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  error?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white/[0.05] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] backdrop-blur-sm transition-all placeholder:text-[var(--color-text-placeholder)] focus:outline-none ${
            error
              ? 'border-[var(--color-error)]/50 focus:shadow-[0_0_0_3px_rgba(184,124,124,0.15)]'
              : 'border-white/[0.08] focus:border-[var(--color-primary)]/50 focus:shadow-[0_0_0_3px_rgba(124,141,166,0.15)]'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          {show ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-[10px] text-[var(--color-error)]">{error}</p>}
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const labels = ['弱', '弱', '中等', '强', '很强']
  const colors = ['#B87C7C', '#B87C7C', '#C4A97D', '#7FA87A', '#7FA87A']

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 w-6 rounded-full transition-colors"
            style={{
              backgroundColor: i < score ? colors[score] : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
      <span className="text-[10px]" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  )
}
