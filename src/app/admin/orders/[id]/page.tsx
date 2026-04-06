'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrders } from '@erp/hooks/use-orders'
import { useAuth } from '@shared/hooks/use-auth'
import { useChatStore } from '@erp/stores/chat-store'
import { registerNotificationHandler } from '@shared/hooks/use-socket-client'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { ApplicantCard } from '@erp/components/orders/applicant-card'
import { GlassCard } from '@shared/ui/glass-card'
import { PageHeader } from '@shared/components/layout/page-header'
import { DocumentPanel } from '@erp/components/documents/document-panel'
import { MaterialPanel } from '@erp/components/documents/material-panel'
import { ChatPanel } from '@erp/components/chat/chat-panel'
import { Modal } from '@shared/ui/modal'
import { useToast } from '@shared/ui/toast'
import { formatDateTime, formatDate } from '@shared/lib/utils'
import { ORDER_STATUS_LABELS } from '@erp/types/order'
import type { OrderStatus } from '@erp/types/order'

// 可编辑的角色
const EDIT_ROLES = ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 'VISA_ADMIN', 'DOC_COLLECTOR']

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
  // 智能检查
  const [checkWarnings, setCheckWarnings] = useState<Array<{level:string;message:string;field?:string}>>([])
  const [showCheck, setShowCheck] = useState(false)

  // 编辑模式
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // 备注系统
  const [showRemarkModal, setShowRemarkModal] = useState(false)
  const [newRemark, setNewRemark] = useState('')
  const [isAddingRemark, setIsAddingRemark] = useState(false)
  const [remarks, setRemarks] = useState<Array<{ content: string; author: string; time: string }>>([])

  // 添加申请人
  const [showAddApplicant, setShowAddApplicant] = useState(false)
  const [newApplicant, setNewApplicant] = useState({ name: '', phone: '', passportNo: '' })
  const [isAddingApplicant, setIsAddingApplicant] = useState(false)

  // 编辑申请人
  const [editingApplicantId, setEditingApplicantId] = useState<string | null>(null)
  const [applicantEditValues, setApplicantEditValues] = useState({ name: '', phone: '', passportNo: '' })
  const [isSavingApplicant, setIsSavingApplicant] = useState(false)

  // 多人标签页
  const [activeTab, setActiveTab] = useState(0)

  // 解析备注 JSON
  const parseRemarks = useCallback((remarkStr: string | null | undefined): Array<{ content: string; author: string; time: string }> => {
    if (!remarkStr) return []
    try {
      const parsed = JSON.parse(remarkStr)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // 兼容旧格式：纯文本备注
      if (remarkStr.trim()) return [{ content: remarkStr, author: '系统', time: '' }]
    }
    return []
  }, [])

  // 进入编辑模式
  const startEdit = (section: string, initial: Record<string, string>) => {
    setEditingSection(section)
    setEditValues(initial)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingSection(null)
    setEditValues({})
  }

  // 保存编辑
  const saveEdit = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '保存成功')
        setEditingSection(null)
        setEditValues({})
        fetchOrder(orderId)
      } else {
        toast('error', json.error?.message ?? '保存失败')
      }
    } catch {
      toast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 添加备注
  const handleAddRemark = async () => {
    if (!newRemark.trim()) {
      toast('error', '请输入备注内容')
      return
    }
    setIsAddingRemark(true)
    try {
      const newEntry = {
        content: newRemark.trim(),
        author: user?.realName ?? '未知',
        time: new Date().toISOString(),
      }
      const updatedRemarks = [...remarks, newEntry]
      const res = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: JSON.stringify(updatedRemarks) }),
      })
      const json = await res.json()
      if (json.success) {
        setRemarks(updatedRemarks)
        setNewRemark('')
        setShowRemarkModal(false)
        toast('success', '备注已添加')
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch {
      toast('error', '添加失败')
    } finally {
      setIsAddingRemark(false)
    }
  }

  // 添加申请人
  const handleAddApplicant = async () => {
    if (!newApplicant.name.trim()) {
      toast('error', '请输入申请人姓名')
      return
    }
    setIsAddingApplicant(true)
    try {
      const res = await apiFetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          name: newApplicant.name.trim(),
          phone: newApplicant.phone.trim() || undefined,
          passportNo: newApplicant.passportNo.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '申请人已添加')
        setNewApplicant({ name: '', phone: '', passportNo: '' })
        setShowAddApplicant(false)
        fetchOrder(orderId)
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch {
      toast('error', '添加失败')
    } finally {
      setIsAddingApplicant(false)
    }
  }

  // 保存申请人编辑
  const handleSaveApplicant = async (applicantId: string) => {
    if (!applicantEditValues.name.trim()) {
      toast('error', '请输入申请人姓名')
      return
    }
    setIsSavingApplicant(true)
    try {
      const res = await apiFetch(`/api/applicants/${applicantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: applicantEditValues.name.trim(),
          phone: applicantEditValues.phone.trim() || undefined,
          passportNo: applicantEditValues.passportNo.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '申请人信息已更新')
        setEditingApplicantId(null)
        fetchOrder(orderId)
      } else {
        toast('error', json.error?.message ?? '保存失败')
      }
    } catch {
      toast('error', '保存失败')
    } finally {
      setIsSavingApplicant(false)
    }
  }

  useEffect(() => {
    fetchOrder(orderId)
  }, [orderId, fetchOrder])

  // Socket 监听：收到此订单的通知时自动刷新资料/材料列表
  useEffect(() => {
    const handlerId = `admin-order-${orderId}`
    const unregister = registerNotificationHandler(handlerId, (data) => {
      if (data.orderId === orderId) {
        fetchOrder(orderId)
      }
    })
    return unregister
  }, [orderId, fetchOrder])

  // 智能资料检查
  const runSmartCheck = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/check`)
      const json = await res.json()
      if (json.success && json.data.warnings.length > 0) {
        setCheckWarnings(json.data.warnings)
        setShowCheck(true)
      } else {
        setCheckWarnings([])
        setShowCheck(false)
      }
    } catch {}
  }, [orderId])

  useEffect(() => {
    if (currentOrder) {
      runSmartCheck()
      setRemarks(parseRemarks(currentOrder.remark))
    }
  }, [currentOrder, runSmartCheck, parseRemarks])

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
          const wasRejected = currentOrder.orderLogs?.some(
            (l) => l.fromStatus === 'UNDER_REVIEW' && l.toStatus === 'COLLECTING_DOCS'
          )
          if (wasRejected && currentOrder.operatorId) {
            actions.push({ toStatus: 'UNDER_REVIEW', label: '提交复审' })
          } else {
            actions.push({ toStatus: 'PENDING_REVIEW', label: '提交审核' })
          }
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
    if (currentOrder.status === 'PENDING_DELIVERY' && toStatus === 'MAKING_MATERIALS') return true
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
  const canEdit = user?.role && EDIT_ROLES.includes(user.role)
    && !['APPROVED', 'REJECTED', 'PARTIAL'].includes(order.status)
  const isMultiApplicant = order.applicants.length > 1

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

      {/* 智能检查警告 */}
      {showCheck && checkWarnings.length > 0 && (
        <GlassCard className="p-4 animate-fade-in-up border-l-2" style={{ borderLeftColor: checkWarnings.some(w => w.level === 'error') ? 'var(--color-error)' : 'var(--color-warning)' }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">⚠️ 智能检查</h4>
            <button onClick={() => setShowCheck(false)} className="text-xs text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)]">忽略</button>
          </div>
          <div className="space-y-1.5">
            {checkWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${w.level === 'error' ? 'bg-[var(--color-error)]' : w.level === 'warning' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-info)]'}`} />
                <span className="text-[var(--color-text-primary)]">{w.message}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ===================== 单人订单布局 ===================== */}
      {!isMultiApplicant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：全部信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 客户信息 */}
            <GlassCard className="p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  客户信息
                </h3>
                {canEdit && editingSection !== 'customer' && (
                  <button
                    onClick={() => startEdit('customer', {
                      contactName: order.contactName ?? order.customerName,
                      customerPhone: order.customerPhone,
                      customerEmail: order.customerEmail ?? '',
                      passportNo: order.passportNo ?? '',
                    })}
                    className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    编辑
                  </button>
                )}
              </div>
              {editingSection === 'customer' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="联系人" value={editValues.contactName} onChange={(v) => setEditValues(p => ({...p, contactName: v}))} />
                    <EditField label="手机号" value={editValues.customerPhone} onChange={(v) => setEditValues(p => ({...p, customerPhone: v}))} />
                    <EditField label="邮箱" value={editValues.customerEmail} onChange={(v) => setEditValues(p => ({...p, customerEmail: v}))} />
                    <EditField label="护照号" value={editValues.passportNo} onChange={(v) => setEditValues(p => ({...p, passportNo: v}))} />
                  </div>
                  <EditActions onSave={saveEdit} onCancel={cancelEdit} isSaving={isSaving} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoField label="联系人" value={order.contactName ?? order.customerName} />
                  <InfoField label="手机号" value={order.customerPhone} />
                  <InfoField label="邮箱" value={order.customerEmail} />
                  <InfoField label="护照号" value={order.passportNo} />
                  <InfoField label="护照签发日" value={formatDate(order.passportIssue)} />
                  <InfoField label="护照有效期" value={formatDate(order.passportExpiry)} />
                </div>
              )}
            </GlassCard>

            {/* 申请人卡片 */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '25ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  申请人 ({order.applicants.length}人)
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    资料齐全: {order.applicants.filter(a => a.documentsComplete).length}/{order.applicants.length}
                    {order.applicants.some(a => a.visaResult) && (
                      <> · 已出结果: {order.applicants.filter(a => a.visaResult).length}/{order.applicants.length}</>
                    )}
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddApplicant(true)}
                      className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      添加
                    </button>
                  )}
                </div>
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
                    canEdit={!!canEdit}
                    isEditing={editingApplicantId === applicant.id}
                    editValues={applicantEditValues}
                    onEdit={() => {
                      setEditingApplicantId(applicant.id)
                      setApplicantEditValues({
                        name: applicant.name,
                        phone: applicant.phone ?? '',
                        passportNo: applicant.passportNo ?? '',
                      })
                    }}
                    onEditChange={(vals) => setApplicantEditValues(vals)}
                    onSaveEdit={() => handleSaveApplicant(applicant.id)}
                    onCancelEdit={() => setEditingApplicantId(null)}
                    isSaving={isSavingApplicant}
                    onRefresh={() => fetchOrder(orderId)}
                  />
                ))}
              </div>
            </GlassCard>

            {/* 签证信息 */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  签证信息
                </h3>
                {canEdit && editingSection !== 'visa' && (
                  <button
                    onClick={() => startEdit('visa', {
                      targetCountry: order.targetCountry,
                      visaType: order.visaType,
                      visaCategory: order.visaCategory ?? '',
                      travelDate: order.travelDate ? order.travelDate.split('T')[0] : '',
                    })}
                    className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    编辑
                  </button>
                )}
              </div>
              {editingSection === 'visa' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="申请国家" value={editValues.targetCountry} onChange={(v) => setEditValues(p => ({...p, targetCountry: v}))} />
                    <EditField label="签证类型" value={editValues.visaType} onChange={(v) => setEditValues(p => ({...p, visaType: v}))} />
                    <EditField label="签证类别" value={editValues.visaCategory} onChange={(v) => setEditValues(p => ({...p, visaCategory: v}))} />
                    <EditField label="出行日期" value={editValues.travelDate} onChange={(v) => setEditValues(p => ({...p, travelDate: v}))} type="date" />
                  </div>
                  <EditActions onSave={saveEdit} onCancel={cancelEdit} isSaving={isSaving} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoField label="申请国家" value={order.targetCountry} />
                  <InfoField label="签证类型" value={order.visaType} />
                  <InfoField label="签证类别" value={order.visaCategory} />
                  <InfoField label="出行日期" value={formatDate(order.travelDate)} />
                  <InfoField label="预约日期" value={formatDate(order.appointmentDate)} />
                  <InfoField label="需录指纹" value={order.fingerprintRequired ? '是' : '否'} />
                </div>
              )}
            </GlassCard>

            {/* 签证分类流程提示 */}
            {order.visaCategory && (
              <GlassCard className="p-4 animate-fade-in-up" style={{ animationDelay: '75ms' }}>
                <VisaFlowHints category={order.visaCategory} fingerprintRequired={order.fingerprintRequired} appointmentDate={order.appointmentDate} />
              </GlassCard>
            )}

            {/* 订单信息 */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  订单信息
                </h3>
                {canEdit && editingSection !== 'order' && (
                  <button
                    onClick={() => startEdit('order', {
                      externalOrderNo: order.externalOrderNo ?? '',
                      amount: String(order.amount),
                      paymentMethod: order.paymentMethod ?? '',
                      sourceChannel: order.sourceChannel ?? '',
                      targetCity: order.targetCity ?? '',
                    })}
                    className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    编辑
                  </button>
                )}
              </div>
              {editingSection === 'order' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="外部订单号" value={editValues.externalOrderNo} onChange={(v) => setEditValues(p => ({...p, externalOrderNo: v}))} />
                    <EditField label="金额" value={editValues.amount} onChange={(v) => setEditValues(p => ({...p, amount: v}))} type="number" />
                    <EditField label="支付方式" value={editValues.paymentMethod} onChange={(v) => setEditValues(p => ({...p, paymentMethod: v}))} />
                    <EditField label="来源渠道" value={editValues.sourceChannel} onChange={(v) => setEditValues(p => ({...p, sourceChannel: v}))} />
                    <EditField label="送签城市" value={editValues.targetCity} onChange={(v) => setEditValues(p => ({...p, targetCity: v}))} />
                  </div>
                  <EditActions onSave={saveEdit} onCancel={cancelEdit} isSaving={isSaving} />
                </div>
              ) : (
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
              )}

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
            </GlassCard>

            {/* 备注 */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '125ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  备注 ({remarks.length})
                </h3>
                {canEdit && (
                  <button
                    onClick={() => setShowRemarkModal(true)}
                    className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    添加备注
                  </button>
                )}
              </div>
              {remarks.length === 0 ? (
                <p className="text-xs text-[var(--color-text-placeholder)] py-4 text-center">暂无备注</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {remarks.map((r, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--color-primary-light)]">{r.author}</span>
                        <span className="text-[10px] text-[var(--color-text-placeholder)]">
                          {r.time ? formatDateTime(r.time) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* 资料清单（移到左侧） */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
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

            {/* 签证材料（移到左侧） */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '175ms' }}>
              <MaterialPanel
                orderId={order.id}
                materials={order.visaMaterials}
                userRole={user?.role ?? 'CUSTOMER'}
                orderStatus={order.status}
                onRefresh={() => fetchOrder(orderId)}
              />
            </GlassCard>
          </div>

          {/* 右侧：关联人员 + 操作日志 */}
          <div className="space-y-6">
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">关联人员</h3>
              <div className="space-y-3 text-sm">
                <PersonField label="资料员" person={order.collector} />
                <PersonField label="操作员" person={order.operator} />
                <PersonField label="客户" person={order.customer} />
              </div>
            </GlassCard>

            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '225ms' }}>
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
          </div>
        </div>
      )}

      {/* ===================== 多人订单布局 ===================== */}
      {isMultiApplicant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：共享信息 + 申请人标签页 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 客户信息 */}
            <GlassCard className="p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  客户信息
                </h3>
                {canEdit && editingSection !== 'customer' && (
                  <button
                    onClick={() => startEdit('customer', {
                      contactName: order.contactName ?? order.customerName,
                      customerPhone: order.customerPhone,
                      customerEmail: order.customerEmail ?? '',
                      passportNo: order.passportNo ?? '',
                    })}
                    className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    编辑
                  </button>
                )}
              </div>
              {editingSection === 'customer' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="联系人" value={editValues.contactName} onChange={(v) => setEditValues(p => ({...p, contactName: v}))} />
                    <EditField label="手机号" value={editValues.customerPhone} onChange={(v) => setEditValues(p => ({...p, customerPhone: v}))} />
                    <EditField label="邮箱" value={editValues.customerEmail} onChange={(v) => setEditValues(p => ({...p, customerEmail: v}))} />
                    <EditField label="护照号" value={editValues.passportNo} onChange={(v) => setEditValues(p => ({...p, passportNo: v}))} />
                  </div>
                  <EditActions onSave={saveEdit} onCancel={cancelEdit} isSaving={isSaving} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoField label="联系人" value={order.contactName ?? order.customerName} />
                  <InfoField label="手机号" value={order.customerPhone} />
                  <InfoField label="邮箱" value={order.customerEmail} />
                  <InfoField label="护照号" value={order.passportNo} />
                  <InfoField label="护照签发日" value={formatDate(order.passportIssue)} />
                  <InfoField label="护照有效期" value={formatDate(order.passportExpiry)} />
                </div>
              )}
            </GlassCard>

            {/* 申请人总览 */}
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '25ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  申请人 ({order.applicants.length}人)
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    资料齐全: {order.applicants.filter(a => a.documentsComplete).length}/{order.applicants.length}
                    {order.applicants.some(a => a.visaResult) && (
                      <> · 已出结果: {order.applicants.filter(a => a.visaResult).length}/{order.applicants.length}</>
                    )}
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddApplicant(true)}
                      className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      添加
                    </button>
                  )}
                </div>
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
                    canEdit={!!canEdit}
                    isEditing={editingApplicantId === applicant.id}
                    editValues={applicantEditValues}
                    onEdit={() => {
                      setEditingApplicantId(applicant.id)
                      setApplicantEditValues({
                        name: applicant.name,
                        phone: applicant.phone ?? '',
                        passportNo: applicant.passportNo ?? '',
                      })
                    }}
                    onEditChange={(vals) => setApplicantEditValues(vals)}
                    onSaveEdit={() => handleSaveApplicant(applicant.id)}
                    onCancelEdit={() => setEditingApplicantId(null)}
                    isSaving={isSavingApplicant}
                    onRefresh={() => fetchOrder(orderId)}
                  />
                ))}
              </div>
            </GlassCard>

            {/* 申请人标签页 */}
            <GlassCard className="p-0 animate-fade-in-up overflow-hidden" style={{ animationDelay: '50ms' }}>
              {/* 标签头 */}
              <div className="flex border-b border-white/5 overflow-x-auto">
                {order.applicants.map((applicant, idx) => (
                  <button
                    key={applicant.id}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all relative ${
                      activeTab === idx
                        ? 'text-[var(--color-primary-light)] bg-[var(--color-primary)]/5'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      activeTab === idx
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]'
                        : 'bg-white/10 text-[var(--color-text-placeholder)]'
                    }`}>
                      {applicant.name[0]}
                    </span>
                    <span>{applicant.name}</span>
                    {/* 状态小点 */}
                    {applicant.visaResult && (
                      <span className={`w-2 h-2 rounded-full ${applicant.visaResult === 'APPROVED' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}`} />
                    )}
                    {/* 选中下划线 */}
                    {activeTab === idx && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                    )}
                  </button>
                ))}
              </div>

              {/* 标签内容 */}
              {(() => {
                const applicant = order.applicants[activeTab]
                if (!applicant) return null

                // 该申请人的资料需求（均匀分配）
                const perPerson = Math.ceil(order.documentRequirements.length / order.applicants.length)
                const start = activeTab * perPerson
                const end = Math.min(start + perPerson, order.documentRequirements.length)
                const applicantReqs = order.documentRequirements.slice(start, end)

                // 该申请人的签证材料（均匀分配）
                const matPerPerson = Math.ceil(order.visaMaterials.length / order.applicants.length)
                const matStart = activeTab * matPerPerson
                const matEnd = Math.min(matStart + matPerPerson, order.visaMaterials.length)
                const applicantMats = order.visaMaterials.slice(matStart, matEnd)

                return (
                  <div className="p-5 space-y-6">
                    {/* 申请人头信息 */}
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <span className="w-10 h-10 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-sm font-bold text-[var(--color-primary-light)]">
                        {applicant.name[0]}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{applicant.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-placeholder)] mt-0.5">
                          {applicant.phone && <span>📱 {applicant.phone}</span>}
                          {applicant.passportNo && <span>🛂 {applicant.passportNo}</span>}
                          {applicant.documentsComplete && (
                            <span className="text-[var(--color-success)]">✅ 资料齐全</span>
                          )}
                          {applicant.visaResult && (
                            <span className={applicant.visaResult === 'APPROVED' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
                              {applicant.visaResult === 'APPROVED' ? '🎉 出签' : '❌ 拒签'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 签证信息 */}
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        签证信息
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <InfoField label="申请国家" value={order.targetCountry} />
                        <InfoField label="签证类型" value={order.visaType} />
                        <InfoField label="签证类别" value={order.visaCategory} />
                        <InfoField label="出行日期" value={formatDate(order.travelDate)} />
                        <InfoField label="预约日期" value={formatDate(order.appointmentDate)} />
                        <InfoField label="需录指纹" value={order.fingerprintRequired ? '是' : '否'} />
                      </div>
                    </div>

                    {/* 订单信息 */}
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        订单信息
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <InfoField label="订单号" value={order.orderNo} highlight />
                        <InfoField label="金额" value={`¥${Number(order.amount).toLocaleString()}`} highlight />
                        <InfoField label="外部订单号" value={order.externalOrderNo} />
                        <InfoField label="支付方式" value={order.paymentMethod} />
                        <InfoField label="来源渠道" value={order.sourceChannel} />
                        <InfoField label="送签城市" value={order.targetCity} />
                      </div>
                    </div>

                    {/* 备注 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          备注 ({remarks.length})
                        </h4>
                        {canEdit && (
                          <button
                            onClick={() => setShowRemarkModal(true)}
                            className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors"
                          >
                            + 添加
                          </button>
                        )}
                      </div>
                      {remarks.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-placeholder)] py-3 text-center">暂无备注</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {remarks.map((r, i) => (
                            <div key={i} className="bg-white/[0.03] rounded-lg p-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-[var(--color-primary-light)]">{r.author}</span>
                                <span className="text-[10px] text-[var(--color-text-placeholder)]">{r.time ? formatDateTime(r.time) : ''}</span>
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)]">{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 资料清单 */}
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {applicant.name} 的资料清单
                        {applicantReqs.length > 0 && (
                          <span className="text-[10px] text-[var(--color-text-placeholder)] font-normal">
                            ({applicantReqs.filter(r => r.status === 'APPROVED').length}/{applicantReqs.length} 已合格)
                          </span>
                        )}
                      </h4>
                      <DocumentPanel
                        orderId={order.id}
                        requirements={applicantReqs}
                        userRole={user?.role ?? 'CUSTOMER'}
                        orderStatus={order.status}
                        applicantCount={1}
                        applicants={[{ id: applicant.id, name: applicant.name }]}
                        onRefresh={() => fetchOrder(orderId)}
                      />
                    </div>

                    {/* 签证材料 */}
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {applicant.name} 的签证材料
                      </h4>
                      <MaterialPanel
                        orderId={order.id}
                        materials={applicantMats}
                        userRole={user?.role ?? 'CUSTOMER'}
                        orderStatus={order.status}
                        onRefresh={() => fetchOrder(orderId)}
                      />
                    </div>

                    {/* 流程提示 */}
                    {order.visaCategory && (
                      <div className="pt-2">
                        <VisaFlowHints category={order.visaCategory} fingerprintRequired={order.fingerprintRequired} appointmentDate={order.appointmentDate} />
                      </div>
                    )}
                  </div>
                )
              })()}
            </GlassCard>
          </div>

          {/* 右侧：关联人员 + 操作日志 */}
          <div className="space-y-6">
            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">关联人员</h3>
              <div className="space-y-3 text-sm">
                <PersonField label="资料员" person={order.collector} />
                <PersonField label="操作员" person={order.operator} />
                <PersonField label="客户" person={order.customer} />
              </div>
            </GlassCard>

            <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '125ms' }}>
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
          </div>
        </div>
      )}

      {/* 聊天浮动按钮（OUTSOURCE 无聊天权限） */}
      {user?.role !== 'OUTSOURCE' && <ChatFloatingButton orderId={orderId} />}

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

      {/* 添加备注弹窗 */}
      {showRemarkModal && (
        <Modal isOpen onClose={() => { setShowRemarkModal(false); setNewRemark('') }} title="添加备注" size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                备注内容 *
              </label>
              <textarea
                className="glass-input w-full text-sm resize-none"
                rows={4}
                placeholder="请输入备注信息，如非标准订单信息、特殊要求等..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowRemarkModal(false); setNewRemark('') }}
                className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddRemark}
                disabled={isAddingRemark || !newRemark.trim()}
                className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isAddingRemark ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 添加申请人弹窗 */}
      {showAddApplicant && (
        <Modal isOpen onClose={() => { setShowAddApplicant(false); setNewApplicant({ name: '', phone: '', passportNo: '' }) }} title="添加申请人" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">姓名 *</label>
                <input
                  className="glass-input w-full text-sm"
                  placeholder="请输入申请人姓名"
                  value={newApplicant.name}
                  onChange={(e) => setNewApplicant(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">手机号</label>
                <input
                  className="glass-input w-full text-sm"
                  placeholder="请输入手机号（可选）"
                  value={newApplicant.phone}
                  onChange={(e) => setNewApplicant(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">护照号</label>
                <input
                  className="glass-input w-full text-sm"
                  placeholder="请输入护照号（可选）"
                  value={newApplicant.passportNo}
                  onChange={(e) => setNewApplicant(p => ({ ...p, passportNo: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowAddApplicant(false); setNewApplicant({ name: '', phone: '', passportNo: '' }) }}
                className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddApplicant}
                disabled={isAddingApplicant || !newApplicant.name.trim()}
                className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isAddingApplicant ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </Modal>
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

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-placeholder)] mb-1">{label}</label>
      <input
        type={type}
        className="glass-input w-full text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === 'number' ? '0.01' : undefined}
      />
    </div>
  )
}

function EditActions({ onSave, onCancel, isSaving }: { onSave: () => void; onCancel: () => void; isSaving: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
      >
        取消
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="glass-btn-primary px-5 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isSaving ? '保存中...' : '确认保存'}
      </button>
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

  const getDetailPlaceholder = (): string => {
    const action = actions.find(a => a.toStatus === selectedStatus)
    if (!action) return '操作说明...'
    if (selectedStatus === 'MAKING_MATERIALS') return '确认资料达标，开始制作...'
    if (selectedStatus === 'COLLECTING_DOCS') return '请说明需要补充哪些资料...'
    if (selectedStatus === 'PENDING_DELIVERY') return '材料说明...'
    return `${action.label}的备注说明...`
  }

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


// ==================== 聊天浮动按钮 ====================

function ChatFloatingButton({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { rooms, fetchRooms } = useChatStore()

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const room = rooms.find((r) => r.orderId === orderId)
  const unread = room?.unreadCount ?? 0

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="w-96 h-[520px] mb-3 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] animate-fade-in-up"
          style={{ animationDuration: '200ms' }}
        >
          <ChatPanel orderId={orderId} onClose={() => setIsOpen(false)} />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/50 hover:scale-105 transition-all duration-200 flex items-center justify-center relative"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-[var(--color-error)] text-[11px] text-white flex items-center justify-center px-1 font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}

// 签证分类流程差异化提示组件
function VisaFlowHints({ category, fingerprintRequired, appointmentDate }: {
  category: string
  fingerprintRequired: boolean
  appointmentDate: string | null
}) {
  const cat = category.toLowerCase()
  const isEVisa = cat.includes('电子') || cat.includes('evisa') || cat.includes('e-visa')
  const isSticker = cat.includes('贴纸') || cat.includes('sticker')
  const isSchengen = cat.includes('申根') || cat.includes('schengen')

  const hints: Array<{ icon: string; text: string; color: string }> = []

  if (isEVisa) {
    hints.push({ icon: '💻', text: '电子签证：交付时提供电子文件即可，无需邮寄护照原件', color: 'var(--color-info)' })
    hints.push({ icon: '📧', text: '出签后将电子签证发送至客户邮箱/聊天窗口', color: 'var(--color-info)' })
  } else if (isSticker) {
    hints.push({ icon: '📮', text: '贴纸签证：交付时需提供邮寄指引，客户需寄送护照原件', color: 'var(--color-warning)' })
    hints.push({ icon: '📋', text: '确认客户收件地址后安排邮寄', color: 'var(--color-warning)' })
  }

  if (isSchengen) {
    hints.push({ icon: '🇪🇺', text: '申根签证：客户需自行反馈出签状态', color: 'var(--color-accent)' })
  }

  if (fingerprintRequired) {
    hints.push({ icon: '🖐️', text: '需录指纹：请在预约日前提醒客户前往签证中心采集', color: 'var(--color-warning)' })
    if (appointmentDate) {
      hints.push({ icon: '📅', text: `指纹采集预约：${formatDate(appointmentDate)}`, color: 'var(--color-warning)' })
    }
  }

  if (hints.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        流程提示
      </h4>
      <div className="space-y-1.5">
        {hints.map((h, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-base leading-none">{h.icon}</span>
            <span style={{ color: h.color }}>{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
