'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'
import { StatusBadge } from '@/components/orders/status-badge'
import { ApplicantCard } from '@/components/orders/applicant-card'
import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'
import { DocumentPanel } from '@/components/documents/document-panel'
import { MaterialPanel } from '@/components/documents/material-panel'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatDateTime, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types/order'
import type { OrderStatus } from '@/types/order'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { currentOrder, isLoading, fetchOrder, changeStatus } = useOrders()
  const { user } = useAuth()
  const { toast } = useToast()
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [transitionDetail, setTransitionDetail] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [preselectedStatus, setPreselectedStatus] = useState<OrderStatus | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    fetchOrder(orderId)
  }, [orderId, fetchOrder])

  // 可执行的状态流转
  const getAvailableActions = useCallback((): { toStatus: OrderStatus; label: string }[] => {
    if (!currentOrder || !user) return []

    const actions: { toStatus: OrderStatus; label: string }[] = []
    const { status } = currentOrder
    const role = user.role

    switch (status) {
      case 'PENDING_CONNECTION':
        if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'CONNECTED', label: '接单' })
        }
        break
      case 'CONNECTED':
        if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'COLLECTING_DOCS', label: '开始收集资料' })
        }
        break
      case 'COLLECTING_DOCS':
        if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(role)) {
          // 检查是否为复审场景（操作员曾打回过）
          const wasRejected = order.orderLogs?.some(
            (l) => l.fromStatus === 'UNDER_REVIEW' && l.toStatus === 'COLLECTING_DOCS'
          )
          actions.push({ toStatus: 'PENDING_REVIEW', label: wasRejected ? '提交复审' : '提交审核' })
        }
        break
      case 'PENDING_REVIEW':
        if (['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'UNDER_REVIEW', label: '操作员接单' })
        }
        break
      case 'UNDER_REVIEW':
        if (['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'COLLECTING_DOCS', label: '打回补充资料' })
          actions.push({ toStatus: 'MAKING_MATERIALS', label: '开始制作签证材料' })
        }
        break
      case 'MAKING_MATERIALS':
        if (['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'PENDING_DELIVERY', label: '发送资料' })
        }
        break
      case 'PENDING_DELIVERY':
        if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'MAKING_MATERIALS', label: '反馈操作员' })
          actions.push({ toStatus: 'DELIVERED', label: '材料交付' })
        }
        break
      case 'DELIVERED':
        if (['OPERATOR', 'DOC_COLLECTOR', 'CUSTOMER', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'APPROVED', label: '出签' })
          actions.push({ toStatus: 'REJECTED', label: '拒签' })
        }
        break
      case 'PARTIAL':
        if (['COMPANY_OWNER', 'VISA_ADMIN'].includes(role)) {
          actions.push({ toStatus: 'APPROVED', label: '确认全部出签' })
          actions.push({ toStatus: 'REJECTED', label: '确认全部拒签' })
        }
        break
    }

    return actions
  }, [currentOrder, user])

  // 判断当前流转是否必须填写备注
  const requiresDetail = (toStatus: OrderStatus): boolean => {
    if (!currentOrder) return false
    // 打回修改材料 → 必须说明哪里需要改
    if (currentOrder.status === 'PENDING_DELIVERY' && toStatus === 'MAKING_MATERIALS') return true
    // 打回补充资料 → 建议填写但非强制
    return false
  }

  const handleTransition = async (toStatus: OrderStatus) => {
    if (requiresDetail(toStatus) && !transitionDetail.trim()) {
      toast('error', '请填写修改意见')
      return
    }
    setIsTransitioning(true)
    try {
      await changeStatus(orderId, toStatus, transitionDetail || undefined)
      toast('success', `状态已更新为 ${ORDER_STATUS_LABELS[toStatus]}`)
      setShowStatusModal(false)
      setTransitionDetail('')
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : '操作失败')
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast('error', '请输入取消原因')
      return
    }
    setIsTransitioning(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '订单已取消')
        setShowCancelConfirm(false)
        setCancelReason('')
        fetchOrder(orderId)
      } else {
        toast('error', json.error?.message ?? '取消失败')
      }
    } catch {
      toast('error', '取消失败')
    } finally {
      setIsTransitioning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="p-12 text-center">
        <p className="text-[var(--color-text-secondary)]">订单不存在</p>
        <button onClick={() => router.push('/admin/orders')} className="mt-4 text-sm text-[var(--color-info)] hover:underline">
          返回订单列表
        </button>
      </div>
    )
  }

  const order = currentOrder
  const availableActions = getAvailableActions()
  const canCancel = user?.role && ['COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN', 'SUPER_ADMIN'].includes(user.role)
    && !['APPROVED', 'REJECTED'].includes(order.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`订单 ${order.orderNo}`}
        description={
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={order.status} />
            <span className="text-xs text-[var(--color-text-placeholder)]">
              创建于 {formatDateTime(order.createdAt)}
            </span>
          </div>
        }
        backLink="/admin/orders"
        action={
          (availableActions.length > 0 || canCancel) ? (
            <div className="flex gap-2">
              {availableActions.map((action) => (
                <button
                  key={action.toStatus}
                  onClick={() => { setPreselectedStatus(action.toStatus); setShowStatusModal(true) }}
                  className="glass-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                >
                  {action.label}
                </button>
              ))}
              {canCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-[var(--color-error)]/30 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
                >
                  取消订单
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：客户信息 + 签证信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 客户信息 */}
          <GlassCard className="p-5 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              客户信息
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="联系人" value={order.contactName ?? order.customerName} />
              <InfoField label="手机号" value={order.customerPhone} />
              <InfoField label="邮箱" value={order.customerEmail} />
              <InfoField label="护照号" value={order.passportNo} />
              <InfoField label="护照签发日" value={formatDate(order.passportIssue)} />
              <InfoField label="护照有效期" value={formatDate(order.passportExpiry)} />
            </div>
          </GlassCard>

          {/* M5：申请人卡片 */}
          {order.applicants && order.applicants.length > 0 && (
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '25ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  申请人 ({order.applicants.length}人)
                </h3>
                {/* 进度统计 */}
                <span className="text-xs text-[var(--color-text-secondary)]">
                  资料齐全: {order.applicants.filter(a => a.documentsComplete).length}/{order.applicants.length}
                  {order.applicants.some(a => a.visaResult) && (
                    <> · 已出结果: {order.applicants.filter(a => a.visaResult).length}/{order.applicants.length}</>
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {order.applicants.map((applicant) => (
                  <ApplicantCard
                    key={applicant.id}
                    applicant={applicant}
                    canMarkResult={['DELIVERED', 'APPROVED', 'REJECTED', 'PARTIAL'].includes(order.status)
                      && ['OPERATOR', 'DOC_COLLECTOR', 'VISA_ADMIN'].includes(user?.role ?? '')}
                    canMarkDocs={['COLLECTING_DOCS', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(order.status)
                      && ['DOC_COLLECTOR', 'VISA_ADMIN'].includes(user?.role ?? '')}
                    onRefresh={() => fetchOrder(orderId)}
                  />
                ))}
              </div>
            </GlassCard>
          )}

          {/* 签证信息 */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              签证信息
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="申请国家" value={order.targetCountry} />
              <InfoField label="签证类型" value={order.visaType} />
              <InfoField label="签证类别" value={order.visaCategory} />
              <InfoField label="出行日期" value={formatDate(order.travelDate)} />
              <InfoField label="预约日期" value={formatDate(order.appointmentDate)} />
              <InfoField label="需录指纹" value={order.fingerprintRequired ? '是' : '否'} />
            </div>
          </GlassCard>

          {/* 订单信息 */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              订单信息
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="订单号" value={order.orderNo} highlight />
              <InfoField label="外部订单号" value={order.externalOrderNo} />
              <InfoField label="金额" value={`¥${Number(order.amount).toLocaleString()}`} highlight />
              <InfoField label="支付方式" value={order.paymentMethod} />
              <InfoField label="来源渠道" value={order.sourceChannel} />
              <InfoField label="创建者" value={order.customer?.realName ?? order.createdBy} />
              <InfoField label="送签城市" value={order.targetCity} />
              <InfoField label="递交日期" value={formatDate(order.submittedAt)} />
            </div>

            {/* 财务明细 */}
            {(order.platformFee || order.visaFee || order.grossProfit) && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">财务明细</span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--color-text-placeholder)]">平台扣点</span>
                    <p className="text-[var(--color-text-primary)]">
                      {order.platformFeeRate ? `${(Number(order.platformFeeRate) * 100).toFixed(1)}%` : '-'}
                      {order.platformFee && <span className="text-[var(--color-text-secondary)]"> (¥{Number(order.platformFee).toFixed(2)})</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-placeholder)]">签证费</span>
                    <p className="text-[var(--color-text-primary)]">{order.visaFee ? `¥${Number(order.visaFee).toFixed(2)}` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-placeholder)]">保险费</span>
                    <p className="text-[var(--color-text-primary)]">{order.insuranceFee ? `¥${Number(order.insuranceFee).toFixed(2)}` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-placeholder)]">拒签保险</span>
                    <p className="text-[var(--color-text-primary)]">{order.rejectionInsurance ? `¥${Number(order.rejectionInsurance).toFixed(2)}` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-placeholder)]">好评返现</span>
                    <p className="text-[var(--color-text-primary)]">{order.reviewBonus ? `¥${Number(order.reviewBonus).toFixed(2)}` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-placeholder)]">毛利</span>
                    <p className={`font-medium ${Number(order.grossProfit ?? 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                      {order.grossProfit ? `¥${Number(order.grossProfit).toFixed(2)}` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {order.remark && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-xs text-[var(--color-text-placeholder)]">备注</span>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{order.remark}</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* 右侧：操作日志 + 关联人员 */}
        <div className="space-y-6">
          {/* 关联人员 */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">关联人员</h3>
            <div className="space-y-3 text-sm">
              <PersonField label="资料员" person={order.collector} />
              <PersonField label="操作员" person={order.operator} />
              <PersonField label="客户" person={order.customer} />
            </div>
          </GlassCard>

          {/* 操作日志 */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">操作日志</h3>
            {order.orderLogs.length === 0 ? (
              <p className="text-xs text-[var(--color-text-placeholder)]">暂无日志</p>
            ) : (
              <div className="space-y-3">
                {order.orderLogs.map((log, i) => (
                  <div key={log.id} className="relative pl-4">
                    <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-[var(--color-primary)]/50" />
                    {i < order.orderLogs.length - 1 && (
                      <div className="absolute left-[3px] top-4 w-px h-full bg-white/5" />
                    )}
                    <div className="text-xs">
                      <span className="text-[var(--color-text-primary)] font-medium">{log.user.realName}</span>
                      <span className="text-[var(--color-text-secondary)]"> {log.action}</span>
                      {log.fromStatus && log.toStatus && (
                        <span className="text-[var(--color-text-placeholder)]">
                          {' '}({ORDER_STATUS_LABELS[log.fromStatus as OrderStatus] ?? log.fromStatus} → {ORDER_STATUS_LABELS[log.toStatus as OrderStatus] ?? log.toStatus})
                        </span>
                      )}
                      {log.detail && (
                        <p className="text-[var(--color-text-secondary)] mt-0.5">{log.detail}</p>
                      )}
                      <p className="text-[var(--color-text-placeholder)] mt-0.5">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* 资料面板 */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <DocumentPanel
              orderId={order.id}
              requirements={order.documentRequirements}
              userRole={user?.role ?? 'CUSTOMER'}
              orderStatus={order.status}
              applicantCount={order.applicantCount}
              applicants={order.applicants.map(a => ({ id: a.id, name: a.name }))}
              onRefresh={() => fetchOrder(orderId)}
            />
          </GlassCard>

          {/* 签证材料面板 */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <MaterialPanel
              orderId={order.id}
              materials={order.visaMaterials}
              userRole={user?.role ?? 'CUSTOMER'}
              orderStatus={order.status}
              onRefresh={() => fetchOrder(orderId)}
            />
          </GlassCard>
        </div>
      </div>

      {/* 状态流转弹窗 */}
      {showStatusModal && (
        <StatusTransitionModal
          actions={availableActions}
          detail={transitionDetail}
          onDetailChange={setTransitionDetail}
          onSubmit={handleTransition}
          onClose={() => { setShowStatusModal(false); setTransitionDetail('') }}
          isSubmitting={isTransitioning}
          initialStatus={preselectedStatus}
          detailRequired={preselectedStatus ? requiresDetail(preselectedStatus) : false}
        />
      )}

      {/* 取消订单确认弹窗 */}
      {showCancelConfirm && (
        <Modal isOpen onClose={() => { setShowCancelConfirm(false); setCancelReason('') }} title="确认取消订单" size="md">
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              取消后订单将标记为「拒签」终态，此操作不可撤销。
            </p>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                取消原因 *
              </label>
              <textarea
                className="glass-input w-full text-sm resize-none"
                rows={3}
                placeholder="请输入取消原因..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelReason('') }}
                className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
              >
                返回
              </button>
              <button
                onClick={handleCancel}
                disabled={isTransitioning || !cancelReason.trim()}
                className="px-6 py-2 text-sm font-medium rounded-xl bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/30 transition-all disabled:opacity-50"
              >
                {isTransitioning ? '处理中...' : '确认取消'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// 辅助组件
function InfoField({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) {
  return (
    <div>
      <span className="text-xs text-[var(--color-text-placeholder)]">{label}</span>
      <p className={`mt-0.5 ${highlight ? 'text-[var(--color-primary-light)] font-medium' : 'text-[var(--color-text-primary)]'}`}>
        {value || '-'}
      </p>
    </div>
  )
}

function PersonField({ label, person }: { label: string; person: { id: string; realName: string } | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--color-text-placeholder)]">{label}</span>
      {person ? (
        <span className="text-sm text-[var(--color-text-primary)]">{person.realName}</span>
      ) : (
        <span className="text-xs text-[var(--color-text-placeholder)]">未分配</span>
      )}
    </div>
  )
}

function StatusTransitionModal({
  actions,
  detail,
  onDetailChange,
  onSubmit,
  onClose,
  isSubmitting,
  initialStatus,
  detailRequired,
}: {
  actions: { toStatus: OrderStatus; label: string }[]
  detail: string
  onDetailChange: (v: string) => void
  onSubmit: (toStatus: OrderStatus) => void
  onClose: () => void
  isSubmitting: boolean
  initialStatus?: OrderStatus | null
  detailRequired?: boolean
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialStatus ?? actions[0]?.toStatus ?? 'CONNECTED')

  // 根据选中操作动态生成 placeholder
  const getDetailPlaceholder = (): string => {
    const action = actions.find(a => a.toStatus === selectedStatus)
    if (!action) return '操作说明...'
    if (selectedStatus === 'MAKING_MATERIALS') return '确认资料达标，开始制作...'
    if (selectedStatus === 'COLLECTING_DOCS') return '请说明需要补充哪些资料...'
    if (selectedStatus === 'PENDING_DELIVERY') return '材料说明...'
    return `${action.label}的备注说明...`
  }

  // 当前选中操作是否需要必填备注
  const currentRequired = detailRequired || selectedStatus === 'MAKING_MATERIALS'

  return (
    <Modal isOpen onClose={onClose} title="状态流转" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">选择操作</label>
          <div className="space-y-2">
            {actions.map((action) => (
              <label
                key={action.toStatus}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  selectedStatus === action.toStatus
                    ? 'bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30'
                    : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={action.toStatus}
                  checked={selectedStatus === action.toStatus}
                  onChange={() => setSelectedStatus(action.toStatus)}
                  className="accent-[var(--color-primary)]"
                />
                <div>
                  <span className="text-sm text-[var(--color-text-primary)] font-medium">{action.label}</span>
                  <span className="text-xs text-[var(--color-text-placeholder)] ml-2">→ {ORDER_STATUS_LABELS[action.toStatus]}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
            备注{currentRequired ? ' *' : '（可选）'}
          </label>
          <textarea
            className="glass-input w-full text-sm resize-none"
            rows={2}
            placeholder={getDetailPlaceholder()}
            value={detail}
            onChange={(e) => onDetailChange(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit(selectedStatus)}
            disabled={isSubmitting}
            className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? '处理中...' : '确认'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
