'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'
import { GlassCard } from '@shared/ui/glass-card'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { cn } from '@shared/lib/utils'

// ==================== 类型 ====================

interface OrderStat {
  label: string
  status: string
  count: number
  color: string
  bgColor: string
}

interface NotificationItem {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  orderId?: string | null
}

// ==================== 常量 ====================

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '超级管理员',
  COMPANY_OWNER: '公司负责人',
  CS_ADMIN: '客服部管理员',
  CUSTOMER_SERVICE: '客服',
  VISA_ADMIN: '签证部管理员',
  DOC_COLLECTOR: '资料员',
  OPERATOR: '签证操作员',
  OUTSOURCE: '外包业务员',
  CUSTOMER: '普通用户',
}

const TOOL_SHORTCUTS = [
  {
    href: '/portal/tools/itinerary',
    label: '行程规划',
    icon: '🗺️',
    desc: 'AI 智能规划',
    gradient: 'from-green-400/20 to-emerald-400/10',
  },
  {
    href: '/portal/tools/form-helper',
    label: '申请表',
    icon: '📝',
    desc: '智能填写',
    gradient: 'from-amber-400/20 to-orange-400/10',
  },
  {
    href: '/portal/tools/translator',
    label: '翻译',
    icon: '🌐',
    desc: '多语言翻译',
    gradient: 'from-pink-400/20 to-rose-400/10',
  },
]

const NOTIFICATION_ICONS: Record<string, { emoji: string; color: string }> = {
  ORDER_NEW: { emoji: '📬', color: 'text-glass-primary' },
  ORDER_CREATED: { emoji: '📋', color: 'text-glass-primary' },
  STATUS_CHANGE: { emoji: '🔄', color: 'text-glass-warning' },
  DOC_REVIEWED: { emoji: '📄', color: 'text-glass-primary' },
  MATERIAL_UPLOADED: { emoji: '📎', color: 'text-glass-accent' },
  MATERIAL_FEEDBACK: { emoji: '💬', color: 'text-glass-primary' },
  APPOINTMENT_REMIND: { emoji: '⏰', color: 'text-glass-warning' },
  DOCS_SUBMITTED: { emoji: '✅', color: 'text-glass-accent' },
  CHAT_MESSAGE: { emoji: '💬', color: 'text-glass-primary' },
  SYSTEM: { emoji: '🔔', color: 'text-glass-muted' },
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// ==================== 主页面 ====================

export default function PortalProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { toast } = useToast()

  // 订单统计
  const [orderStats, setOrderStats] = useState<OrderStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // 通知预览
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifsLoading, setNotifsLoading] = useState(true)

  // 修改密码
  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ==================== 数据加载 ====================

  const fetchOrderStats = useCallback(async () => {
    if (!user) return
    try {
      // 客户看自己的订单，员工看分配给自己的订单
      // 并行请求3个关键状态的计数
      const statuses = user.role === 'CUSTOMER'
        ? [
            { label: '进行中', statuses: ['CONNECTED', 'COLLECTING_DOCS', 'PENDING_REVIEW', 'UNDER_REVIEW', 'MAKING_MATERIALS', 'PENDING_DELIVERY'], color: '#C4A97D', bgColor: 'rgba(196,169,125,0.12)' },
            { label: '已交付', statuses: ['DELIVERED'], color: '#7FA87A', bgColor: 'rgba(127,168,122,0.12)' },
            { label: '已完成', statuses: ['APPROVED', 'REJECTED', 'PARTIAL'], color: '#7C8DA6', bgColor: 'rgba(124,141,166,0.12)' },
          ]
        : [
            { label: '待处理', statuses: ['PENDING_CONNECTION', 'PENDING_REVIEW'], color: '#C4A97D', bgColor: 'rgba(196,169,125,0.12)' },
            { label: '进行中', statuses: ['CONNECTED', 'COLLECTING_DOCS', 'UNDER_REVIEW', 'MAKING_MATERIALS', 'PENDING_DELIVERY'], color: '#9B8EC4', bgColor: 'rgba(155,142,196,0.12)' },
            { label: '已完成', statuses: ['DELIVERED', 'APPROVED', 'REJECTED', 'PARTIAL'], color: '#7FA87A', bgColor: 'rgba(127,168,122,0.12)' },
          ]

      const results = await Promise.all(
        statuses.map(async (s) => {
          // 每个状态组用 OR 查询
          const statusParam = s.statuses.join(',')
          try {
            const res = await apiFetch(`/api/orders?pageSize=1&status=${statusParam}`)
            const json = await res.json()
            return {
              label: s.label,
              status: statusParam,
              count: json.meta?.total ?? 0,
              color: s.color,
              bgColor: s.bgColor,
            }
          } catch {
            return { label: s.label, status: statusParam, count: 0, color: s.color, bgColor: s.bgColor }
          }
        })
      )

      setOrderStats(results)
    } catch {
      // 静默失败，统计不是关键功能
    } finally {
      setStatsLoading(false)
    }
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await apiFetch('/api/notifications?pageSize=3')
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data ?? [])
        setUnreadCount(json.meta?.unreadCount ?? 0)
      }
    } catch {
      // 静默失败
    } finally {
      setNotifsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchOrderStats()
      fetchNotifications()
    }
  }, [user, fetchOrderStats, fetchNotifications])

  // ==================== 修改密码 ====================

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
    router.push('/login')
  }

  // ==================== 渲染 ====================

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="skeleton h-20 w-20 rounded-full" />
      </div>
    )
  }

  const isEmployee = user.role !== 'CUSTOMER'

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      {/* ====== 1. 用户信息卡片 ====== */}
      <GlassCard intensity="medium" className="p-6 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-glass-primary/25 to-glass-primary/15 border border-glass-primary/10">
            <span className="text-xl">{isEmployee ? '👤' : '🙋'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-semibold text-glass-primary truncate">
              {user.realName}
            </h2>
            <p className="mt-0.5 text-[13px] text-glass-muted truncate">
              {ROLE_LABELS[user.role] || user.role}
              {user.company?.name && ` · ${user.company.name}`}
            </p>
          </div>
          <Link
            href="/portal/profile"
            className="flex-shrink-0 glass-button-hover rounded-xl px-3 py-1.5 text-[12px] text-glass-muted hover:text-glass-primary"
          >
            编辑资料
          </Link>
        </div>
      </GlassCard>

      {/* ====== 2. 订单快捷统计 ====== */}
      <section className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-[13px] font-medium text-glass-muted">我的订单</h3>
          <Link
            href="/portal/orders"
            className="text-[12px] text-glass-primary hover:text-glass-primary/80 transition-colors"
          >
            全部订单 →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {statsLoading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="glass-card-light rounded-xl p-3">
                  <div className="skeleton mb-1 h-6 w-8 rounded" />
                  <div className="skeleton h-3 w-12 rounded" />
                </div>
              ))
            : orderStats.map((stat) => (
                <Link key={stat.label} href="/portal/orders">
                  <GlassCard
                    intensity="light"
                    hover
                    className="rounded-xl p-3 text-center transition-all active:scale-[0.97]"
                  >
                    <p
                      className="text-[22px] font-bold tabular-nums"
                      style={{ color: stat.color }}
                    >
                      {stat.count}
                    </p>
                    <p className="mt-0.5 text-[12px] text-glass-muted">
                      {stat.label}
                    </p>
                  </GlassCard>
                </Link>
              ))}
        </div>
      </section>

      {/* ====== 3. 常用工具快捷入口 ====== */}
      <section className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <div className="mb-2 px-1">
          <h3 className="text-[13px] font-medium text-glass-muted">常用工具</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TOOL_SHORTCUTS.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <GlassCard
                intensity="light"
                hover
                className="rounded-xl p-3 text-center transition-all active:scale-[0.97]"
              >
                <div
                  className={cn(
                    'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br',
                    tool.gradient
                  )}
                >
                  <span className="text-lg">{tool.icon}</span>
                </div>
                <p className="text-[13px] font-medium text-glass-primary">
                  {tool.label}
                </p>
                <p className="mt-0.5 text-[11px] text-glass-muted/60">
                  {tool.desc}
                </p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* ====== 4. 通知中心预览 ====== */}
      <section className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-medium text-glass-muted">通知中心</h3>
            {unreadCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-glass-danger px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <Link
            href="/portal/notifications"
            className="text-[12px] text-glass-primary hover:text-glass-primary/80 transition-colors"
          >
            查看全部 →
          </Link>
        </div>
        <GlassCard intensity="light" className="overflow-hidden rounded-xl">
          {notifsLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="skeleton h-8 w-8 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton mb-1 h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-2xl">🔔</span>
              <p className="text-[13px] text-glass-muted/60">暂无通知</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif, index) => {
                const iconInfo = NOTIFICATION_ICONS[notif.type] ?? NOTIFICATION_ICONS.SYSTEM
                return (
                  <Link
                    key={notif.id}
                    href={notif.orderId ? `/portal/orders` : '/portal/notifications'}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-glass-primary/3 active:bg-glass-primary/5',
                      index < notifications.length - 1 && 'border-b border-glass-primary/4',
                      !notif.isRead && 'bg-glass-primary/4'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                        !notif.isRead ? 'bg-glass-primary/15' : 'bg-glass-primary/5'
                      )}
                    >
                      <span className={cn('text-sm', iconInfo.color)}>{iconInfo.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-[13px] truncate',
                          !notif.isRead
                            ? 'font-medium text-glass-primary'
                            : 'text-glass-muted'
                        )}
                      >
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-glass-muted/60 truncate">
                        {notif.content}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-glass-muted/60">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                    {!notif.isRead && (
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-glass-primary" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </GlassCard>
      </section>

      {/* ====== 5. 菜单列表 ====== */}
      <section className="space-y-2 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        {/* ERP 管理入口（仅员工可见） */}
        {isEmployee && (
          <Link href="/admin/dashboard">
            <GlassCard intensity="light" hover className="flex items-center gap-3 p-4 rounded-xl">
              <span className="text-lg">🖥️</span>
              <span className="text-[14px] text-glass-primary">进入 ERP 管理后台</span>
              <svg className="ml-auto h-4 w-4 text-glass-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </GlassCard>
          </Link>
        )}

        <Link href="/portal/orders">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4 rounded-xl">
            <span className="text-lg">📋</span>
            <span className="text-[14px] text-glass-primary">我的订单</span>
            <svg className="ml-auto h-4 w-4 text-glass-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </GlassCard>
        </Link>

        <Link href="/portal/notifications">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4 rounded-xl">
            <span className="text-lg">💬</span>
            <span className="text-[14px] text-glass-primary">消息中心</span>
            {unreadCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-glass-danger px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <svg className="ml-auto h-4 w-4 text-glass-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </GlassCard>
        </Link>

        {/* 修改密码 */}
        <button onClick={() => setShowPwForm(!showPwForm)} className="w-full">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4 rounded-xl">
            <span className="text-lg">🔒</span>
            <span className="text-[14px] text-glass-primary">修改密码</span>
            <svg
              className={cn(
                'ml-auto h-4 w-4 text-glass-muted/60 transition-transform duration-200',
                showPwForm && 'rotate-90'
              )}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </GlassCard>
        </button>

        {/* 退出登录 */}
        <button onClick={handleLogout} className="w-full">
          <GlassCard intensity="light" hover className="flex items-center gap-3 p-4 rounded-xl">
            <span className="text-lg">🚪</span>
            <span className="text-[14px] text-glass-danger">退出登录</span>
          </GlassCard>
        </button>
      </section>

      {/* ====== 6. 修改密码表单 ====== */}
      {showPwForm && (
        <div className="animate-fade-in-up">
          <GlassCard intensity="medium" className="space-y-3 p-5 rounded-xl">
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
              className="w-full glass-button glass-button-hover py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSaving ? '提交中...' : '确认修改'}
            </button>
          </GlassCard>
        </div>
      )}

      {/* 底部安全留白 */}
      <div className="h-4" />
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
      <label className="mb-1 block text-xs text-glass-muted">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'glass-input w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-glass-primary transition-all placeholder:text-glass-muted/60 focus:outline-none',
            error
              ? 'border-glass-danger focus:shadow-[0_0_0_3px_rgba(184,124,124,0.15)]'
              : 'border-glass-border focus:border-glass-primary focus:shadow-[0_0_0_3px_rgba(168,184,200,0.15)]'
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-glass-muted/60 transition-colors hover:text-glass-muted"
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
      {error && <p className="mt-1 text-[10px] text-glass-danger">{error}</p>}
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
