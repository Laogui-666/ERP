'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { StatusBadge } from '@/components/orders/status-badge'
import { StatusTimeline } from '@/components/orders/status-timeline'
import { CustomerUpload } from '@/components/documents/customer-upload'
import { MaterialChecklist } from '@/components/orders/material-checklist'
import { GlassCard } from '@/components/layout/glass-card'
import { useToast } from '@/components/ui/toast'
import { formatDateTime, formatDate } from '@/lib/utils'
import type { OrderDetail } from '@/types/order'

export default function CustomerOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}`)
      const json = await res.json()
      if (json.success) {
        setOrder(json.data)
      } else {
        toast('error', json.error?.message ?? '加载失败')
      }
    } catch {
      toast('error', '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // 确认提交资料
  const handleSubmit = async () => {
    if (!order) return
    const hasFiles = order.documentRequirements.some((r) => r.files.length > 0)
    if (!hasFiles) {
      toast('error', '请至少上传一份资料后再提交')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/submit`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast('success', json.data?.message ?? '提交成功')
        fetchOrder()
      } else {
        toast('error', json.error?.message ?? '提交失败')
      }
    } catch {
      toast('error', '提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 出签反馈
  const handleFeedback = async (result: 'APPROVED' | 'REJECTED') => {
    if (!order) return
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: result }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', result === 'APPROVED' ? '已确认出签' : '已确认拒签')
        setShowFeedback(false)
        fetchOrder()
      } else {
        toast('error', json.error?.message ?? '操作失败')
      }
    } catch {
      toast('error', '操作失败')
    }
  }

  // --- 加载态 ---
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/10" />
            <div className="w-32 h-5 rounded bg-white/10" />
          </div>
          <div className="w-16 h-5 rounded-full bg-white/10" />
        </div>
        <GlassCard className="p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="w-20 h-4 rounded bg-white/10" />
                <div className="w-16 h-3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </GlassCard>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <p className="text-[var(--color-text-secondary)]">订单不存在</p>
        <button
          onClick={() => router.push('/customer/orders')}
          className="mt-4 text-sm text-[var(--color-info)] hover:underline"
        >
          返回订单列表
        </button>
      </div>
    )
  }

  // --- 状态判断 ---
  const canSubmit = order.status === 'COLLECTING_DOCS' &&
    order.documentRequirements.some((r) => r.files.length > 0)
  const canFeedback = order.status === 'DELIVERED'
  const showMaterials = ['MAKING_MATERIALS', 'PENDING_DELIVERY', 'DELIVERED', 'APPROVED', 'REJECTED', 'PARTIAL'].includes(order.status)
  const showDocuments = order.documentRequirements.length > 0

  // 资料审核统计
  const approvedCount = order.documentRequirements.filter((r) => r.status === 'APPROVED').length
  const totalCount = order.documentRequirements.length

  return (
    <div className="space-y-5 pb-4">
      {/* ===== 头部 ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/customer/orders')}
            className="text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-mono text-sm text-[var(--color-primary-light)]">
            {order.orderNo}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* 签证概要 */}
      <div className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
        <span>🌍</span>
        <span>{order.targetCountry}</span>
        <span className="text-[var(--color-text-placeholder)]">·</span>
        <span>{order.visaType}</span>
        {order.applicantCount > 1 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            👥 {order.applicantCount}人
          </span>
        )}
      </div>

      {/* ===== 申请人列表（多人订单） ===== */}
      {order.applicantCount > 1 && order.applicants.length > 0 && (
        <GlassCard className="p-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
            <span>👥</span>
            <span>申请人</span>
            <span className="text-[10px] text-[var(--color-text-placeholder)] font-normal">
              {order.applicants.filter((a) => a.documentsComplete).length}/{order.applicants.length} 资料齐全
            </span>
          </h3>
          <div className="space-y-2">
            {order.applicants.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-[11px] font-medium text-[var(--color-primary-light)] shrink-0">
                    {a.name[0]}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-[var(--color-text-primary)] truncate block">{a.name}</span>
                    {a.passportNo && (
                      <span className="text-[10px] text-[var(--color-text-placeholder)]">护照 {a.passportNo}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.documentsComplete ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-success)]/10 text-[var(--color-success)]">资料齐全 ✓</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--color-text-placeholder)]">收集中</span>
                  )}
                  {a.visaResult === 'APPROVED' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-success)]/15 text-[var(--color-success)]">出签 ✅</span>
                  )}
                  {a.visaResult === 'REJECTED' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-error)]/15 text-[var(--color-error)]">拒签 ❌</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ===== 状态时间线 ===== */}
      <GlassCard className="p-5">
        <StatusTimeline
          currentStatus={order.status}
          orderLogs={order.orderLogs}
        />
      </GlassCard>

      {/* ===== A类资料上传 ===== */}
      {showDocuments && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <CustomerUpload
            orderId={orderId}
            requirements={order.documentRequirements}
            applicantCount={order.applicantCount}
            applicants={order.applicants}
            onRefresh={fetchOrder}
          />

          {/* 确认提交按钮 */}
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>确认提交资料</span>
                  <span className="text-xs opacity-70">({approvedCount + '/' + totalCount} 已合格)</span>
                </>
              )}
            </button>
          )}

          {/* 已提交提示 */}
          {order.status === 'COLLECTING_DOCS' && !canSubmit && totalCount > 0 && (
            <div className="text-center text-xs text-[var(--color-text-placeholder)] py-2">
              {order.documentRequirements.every((r) => r.status === 'REVIEWING' || r.status === 'APPROVED')
                ? '✅ 资料已提交，正在审核中'
                : '请先上传资料后再提交'}
            </div>
          )}
        </>
      )}

      {/* ===== B类材料 ===== */}
      {showMaterials && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <MaterialChecklist status={order.status} materials={order.visaMaterials} />
        </>
      )}

      {/* ===== 出签反馈 ===== */}
      {canFeedback && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <span>🎫</span>
              <span>签证结果</span>
            </h3>
            {showFeedback ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  请确认您的签证结果：
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedback('APPROVED')}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-success)]/15 text-[var(--color-success)] text-sm font-medium hover:bg-[var(--color-success)]/25 transition-colors"
                  >
                    ✅ 已出签
                  </button>
                  <button
                    onClick={() => handleFeedback('REJECTED')}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-error)]/15 text-[var(--color-error)] text-sm font-medium hover:bg-[var(--color-error)]/25 transition-colors"
                  >
                    ❌ 被拒签
                  </button>
                </div>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="w-full text-xs text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full py-3 rounded-xl border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary)]/10 transition-colors"
              >
                确认签证结果
              </button>
            )}
          </div>
        </>
      )}

      {/* ===== 订单信息 ===== */}
      <div className="h-px bg-white/[0.06]" />
      <GlassCard className="p-5 space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-3">
          <span>📋</span>
          <span>订单信息</span>
        </h3>
        <InfoRow label="目标国家" value={order.targetCountry} />
        <InfoRow label="签证类型" value={order.visaType} />
        {order.visaCategory && <InfoRow label="签证类别" value={order.visaCategory} />}
        {order.travelDate && <InfoRow label="出行日期" value={formatDate(order.travelDate)} />}
        <InfoRow label="订单金额" value={`¥${Number(order.amount).toFixed(2)}`} />
        {order.paymentMethod && <InfoRow label="支付方式" value={order.paymentMethod} />}
        {order.appointmentDate && <InfoRow label="预约日期" value={formatDate(order.appointmentDate)} />}
        {order.fingerprintRequired && <InfoRow label="指纹采集" value="需要" />}
        {order.targetCity && <InfoRow label="送签城市" value={order.targetCity} />}
        <InfoRow label="创建时间" value={formatDateTime(order.createdAt)} />
      </GlassCard>

      {/* ===== 操作记录 ===== */}
      {order.orderLogs.length > 0 && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
              <span>📜</span>
              <span>操作记录</span>
            </h3>
            <div className="space-y-3">
              {order.orderLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]/40 shrink-0 mt-1" />
                    <div className="w-px flex-1 bg-white/[0.06]" />
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {log.user.realName}
                      </span>
                      <span className="text-[var(--color-text-placeholder)]">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] mt-0.5">{log.action}</p>
                    {log.detail && (
                      <p className="text-[var(--color-text-placeholder)] mt-0.5">{log.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}

// 辅助组件：信息行
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[var(--color-text-placeholder)]">{label}</span>
      <span className="text-xs text-[var(--color-text-secondary)]">{value}</span>
    </div>
  )
}
