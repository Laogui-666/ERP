'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useOrderStore } from '@erp/stores/order-store'
import { useAuth } from '@shared/hooks/use-auth'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { PageHeader } from '@shared/components/layout/page-header'
import { Modal } from '@shared/ui/modal'
import { useToast } from '@shared/ui/toast'
import { ApplicantFormItem } from '@erp/components/orders/applicant-form-item'
import { formatDate } from '@shared/lib/utils'
import type { OrderStatus } from '@erp/types/order'

interface ApplicantForm {
  name: string
  phone: string
  passportNo: string
}

// 订单状态筛选选项
const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'PENDING_CONNECTION', label: '待对接' },
  { value: 'CONNECTED', label: '已对接' },
  { value: 'COLLECTING_DOCS', label: '资料收集中' },
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'UNDER_REVIEW', label: '资料审核中' },
  { value: 'MAKING_MATERIALS', label: '材料制作中' },
  { value: 'PENDING_DELIVERY', label: '待交付' },
  { value: 'DELIVERED', label: '已交付' },
  { value: 'APPROVED', label: '已出签' },
  { value: 'REJECTED', label: '已拒签' },
  { value: 'PARTIAL', label: '部分出签' },
]

export default function OrdersPage() {
  const { orders, meta, isLoading, fetchOrders } = useOrderStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  // 批量操作
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchMenu, setShowBatchMenu] = useState(false)
  const [batchAction, setBatchAction] = useState<string | null>(null)
  const [batchTemplateId, setBatchTemplateId] = useState('')
  const [batchCancelReason, setBatchCancelReason] = useState('')
  const [templates, setTemplates] = useState<Array<{id:string;name:string}>>([])
  const [isBatchRunning, setIsBatchRunning] = useState(false)

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) { setSelectedIds(new Set()); return }
    setSelectedIds(new Set(orders.map(o => o.id)))
  }
  const clearSelection = () => { setSelectedIds(new Set()); setBatchAction(null) }

  const loadTemplates = async () => {
    try {
      const res = await apiFetch('/api/templates')
      const json = await res.json()
      if (json.success) setTemplates(json.data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
    } catch {}
  }

  const handleBatch = async () => {
    if (selectedIds.size === 0) return
    if (!batchAction) return
    setIsBatchRunning(true)
    try {
      const payload: Record<string, unknown> = {
        action: batchAction,
        orderIds: Array.from(selectedIds),
      }
      if (batchAction === 'apply_template') {
        if (!batchTemplateId) { toast('error', '请选择模板'); setIsBatchRunning(false); return }
        payload.templateId = batchTemplateId
      }
      if (batchAction === 'cancel') {
        if (!batchCancelReason) { toast('error', '请填写取消原因'); setIsBatchRunning(false); return }
        payload.cancelReason = batchCancelReason
      }
      const res = await apiFetch('/api/orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        const { successCount, failCount } = json.data
        toast('success', `批量操作完成：成功 ${successCount}，失败 ${failCount}`)
        clearSelection()
        handleFilter()
      } else {
        toast('error', json.error?.message ?? '批量操作失败')
      }
    } catch {
      toast('error', '批量操作失败')
    } finally {
      setIsBatchRunning(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchOrders({ page: 1, pageSize: 20 })
  }, [fetchOrders])

  // 筛选
  const handleFilter = useCallback(() => {
    setPage(1)
    const q: { page: number; pageSize: number; status?: OrderStatus; search?: string } = {
      page: 1,
      pageSize: 20,
    }
    if (statusFilter) q.status = statusFilter
    if (searchText) q.search = searchText
    fetchOrders(q)
  }, [fetchOrders, statusFilter, searchText])

  // 翻页
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    const q: { page: number; pageSize: number; status?: OrderStatus; search?: string } = {
      page: newPage,
      pageSize: 20,
    }
    if (statusFilter) q.status = statusFilter
    if (searchText) q.search = searchText
    fetchOrders(q)
  }, [fetchOrders, statusFilter, searchText])

  // 是否可创建订单
  const canCreate = user?.role && ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE'].includes(user.role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="订单管理"
        description="管理所有签证订单"
        action={
          canCreate ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="glass-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建订单
            </button>
          ) : undefined
        }
      />

      {/* 筛选栏 */}
      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="border border-border rounded-lg px-3 py-2 text-sm min-w-[140px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索订单号、客户姓名..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              className="border border-border rounded-lg px-3 py-2 w-full text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            onClick={handleFilter}
            className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            查询
          </button>

          {/* 统计 */}
          {meta && (
            <span className="text-sm text-muted-foreground ml-auto">
              共 {meta.total} 条
            </span>
          )}
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="bg-card rounded-xl border border-border p-3 animate-fade-in-up flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">已选 {selectedIds.size} 单</span>
          <div className="relative">
            <button
              onClick={() => { setShowBatchMenu(!showBatchMenu); if (!showBatchMenu) loadTemplates() }}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              批量操作 ▾
            </button>
            {showBatchMenu && (
              <div className="absolute top-full mt-1 left-0 z-30 bg-card border border-border rounded-xl p-2 min-w-[180px] space-y-1 shadow-xl">
                {['apply_template', 'cancel'].map(a => (
                  <button key={a} onClick={() => { setBatchAction(a); setShowBatchMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent text-foreground">
                    {a === 'apply_template' ? '📄 应用模板' : '❌ 批量取消'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground">取消选择</button>

          {/* 应用模板面板 */}
          {batchAction === 'apply_template' && (
            <div className="w-full flex items-center gap-2 mt-1">
              <select value={batchTemplateId} onChange={(e) => setBatchTemplateId(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-xs flex-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">选择模板...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleBatch} disabled={isBatchRunning} className="px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isBatchRunning ? '执行中...' : '执行'}
              </button>
            </div>
          )}

          {/* 取消订单面板 */}
          {batchAction === 'cancel' && (
            <div className="w-full flex items-center gap-2 mt-1">
              <input value={batchCancelReason} onChange={(e) => setBatchCancelReason(e.target.value)} placeholder="取消原因" className="border border-border rounded-lg px-3 py-2 text-xs flex-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={handleBatch} disabled={isBatchRunning} className="px-3 py-2 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50">
                {isBatchRunning ? '执行中...' : '确认取消'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 订单列表 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-muted-foreground mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-muted-foreground">暂无订单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 w-8">
                    <input type="checkbox" checked={orders.length > 0 && selectedIds.size === orders.length}
                      onChange={toggleSelectAll} className="rounded border-border text-primary focus:ring-primary/50" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">订单号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">客户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">国家/类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-accent transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-2 py-3">
                      <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-border text-primary focus:ring-primary/50" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-primary">{order.orderNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-foreground">{order.targetCountry}</div>
                        <div className="text-xs text-muted-foreground">{order.visaType}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">¥{Number(order.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {meta && meta.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              第 {meta.page} / {meta.totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-accent text-foreground hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                上一页
              </button>
              <button
                disabled={page >= (meta.totalPages ?? 1)}
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-accent text-foreground hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新建订单弹窗 */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchOrders({ page: 1, pageSize: 20 })
            toast('success', '订单创建成功')
          }}
        />
      )}
    </div>
  )
}

// 新建订单弹窗
function CreateOrderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQuickEntry, setShowQuickEntry] = useState(true)
  const [quickTemplates, setQuickTemplates] = useState<Array<{id:string;name:string;country:string;visaType:string;items:unknown[];isSystem:boolean}>>([])
  const [recentCustomers, setRecentCustomers] = useState<Array<{customerName:string;customerPhone:string;customerEmail:string|null;passportNo:string|null;targetCountry:string;visaType:string;visaCategory:string|null;targetCity:string|null;paymentMethod:string|null;amount:string;sourceChannel:string|null;contactName:string|null}>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [applyDocTemplate, setApplyDocTemplate] = useState(false)

  // 快速录入数据加载
  useEffect(() => {
    apiFetch('/api/order-templates').then(r => r.json()).then(json => {
      if (json.success) {
        setQuickTemplates(json.data.templates ?? [])
        setRecentCustomers(json.data.recentCustomers ?? [])
      }
    }).catch(() => {})
  }, [])

  const handleQuickFill = (data: {
    customerName?: string; customerPhone?: string; customerEmail?: string | null;
    passportNo?: string | null; targetCountry?: string; visaType?: string;
    visaCategory?: string | null; targetCity?: string | null; paymentMethod?: string | null;
    amount?: string | number; sourceChannel?: string | null; contactName?: string | null;
  }) => {
    setForm(prev => ({
      ...prev,
      customerName: data.customerName ?? prev.customerName,
      customerPhone: data.customerPhone ?? prev.customerPhone,
      customerEmail: data.customerEmail ?? prev.customerEmail,
      passportNo: data.passportNo ?? prev.passportNo,
      targetCountry: data.targetCountry ?? prev.targetCountry,
      visaType: data.visaType ?? prev.visaType,
      visaCategory: data.visaCategory ?? prev.visaCategory,
      targetCity: data.targetCity ?? prev.targetCity,
      paymentMethod: data.paymentMethod ?? prev.paymentMethod,
      amount: data.amount ? String(data.amount) : prev.amount,
      sourceChannel: data.sourceChannel ?? prev.sourceChannel,
      contactName: data.contactName ?? prev.contactName,
    }))
    toast('success', '已快速填充')
  }

  const handleTemplateSelect = (t: {id:string;country:string;visaType:string}) => {
    setSelectedTemplateId(t.id)
    setApplyDocTemplate(true)
    setForm(prev => ({
      ...prev,
      targetCountry: t.country || prev.targetCountry,
      visaType: t.visaType || prev.visaType,
    }))
    toast('success', '已应用模板')
  }

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    passportNo: '',
    targetCountry: '',
    visaType: '',
    visaCategory: '',
    travelDate: '',
    amount: '',
    paymentMethod: '',
    sourceChannel: '',
    remark: '',
    externalOrderNo: '',
    contactName: '',
    targetCity: '',
    platformFeeRate: '0.061',
    visaFee: '',
    insuranceFee: '',
    rejectionInsurance: '',
    reviewBonus: '',
  })

  // M5：多申请人
  const [applicants, setApplicants] = useState<ApplicantForm[]>([
    { name: '', phone: '', passportNo: '' },
  ])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addApplicant = () => {
    setApplicants([...applicants, { name: '', phone: '', passportNo: '' }])
  }

  const removeApplicant = (index: number) => {
    if (applicants.length <= 1) return
    setApplicants(applicants.filter((_, i) => i !== index))
  }

  const updateApplicant = (index: number, field: keyof ApplicantForm, value: string) => {
    setApplicants((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  // 财务预览
  const amount = parseFloat(form.amount) || 0
  const rate = parseFloat(form.platformFeeRate) || 0.061
  const platformFeePreview = Math.round(amount * rate * 100) / 100
  const visaFee = parseFloat(form.visaFee) || 0
  const insuranceFee = parseFloat(form.insuranceFee) || 0
  const rejectIns = parseFloat(form.rejectionInsurance) || 0
  const reviewBonus = parseFloat(form.reviewBonus) || 0
  const grossProfitPreview = Math.round((amount - platformFeePreview - visaFee - insuranceFee - rejectIns - reviewBonus) * 100) / 100

  const handleSubmit = async () => {
    if (!form.customerName || !form.customerPhone || !form.targetCountry || !form.visaType || !form.amount) {
      toast('error', '请填写必填字段')
      return
    }

    // 校验申请人
    const validApplicants = applicants.filter((a) => a.name.trim())
    if (validApplicants.length === 0) {
      toast('error', '至少需要一个申请人')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          passportNo: form.passportNo || undefined,
          targetCountry: form.targetCountry,
          visaType: form.visaType,
          visaCategory: form.visaCategory || undefined,
          travelDate: form.travelDate || undefined,
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod || undefined,
          sourceChannel: form.sourceChannel || undefined,
          remark: form.remark || undefined,
          externalOrderNo: form.externalOrderNo || undefined,
          // M5
          applicants: validApplicants.length > 1 || validApplicants[0].name !== form.customerName
            ? validApplicants.map((a) => ({
                name: a.name,
                phone: a.phone || undefined,
                passportNo: a.passportNo || undefined,
              }))
            : undefined,
          contactName: form.contactName || undefined,
          targetCity: form.targetCity || undefined,
          platformFeeRate: rate,
          visaFee: visaFee || undefined,
          insuranceFee: insuranceFee || undefined,
          rejectionInsurance: rejectIns || undefined,
          reviewBonus: reviewBonus || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        // 如果选择了模板且开启了自动应用，创建资料清单
        if (applyDocTemplate && selectedTemplateId && json.data?.id) {
          try {
            await apiFetch('/api/templates/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: json.data.id, templateId: selectedTemplateId }),
            })
          } catch { /* 不阻塞主流程 */ }
        }
        onSuccess()
      } else {
        toast('error', json.error?.message ?? '创建失败')
      }
    } catch {
      toast('error', '创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'glass-input w-full text-sm'
  const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5'

  return (
    <Modal isOpen onClose={onClose} title="新建订单" size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* 快速录入 */}
        {(quickTemplates.length > 0 || recentCustomers.length > 0) && (
          <div className="rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
            <button
              onClick={() => setShowQuickEntry(!showQuickEntry)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[var(--color-primary-light)]"
            >
              <span className="flex items-center gap-1.5">⚡ 快速录入</span>
              <span>{showQuickEntry ? '▲' : '▼'}</span>
            </button>
            {showQuickEntry && (
              <div className="px-4 pb-3 space-y-2">
                {/* 模板快速填充 */}
                {quickTemplates.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[var(--color-text-placeholder)] mb-1.5">从模板填充</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickTemplates.slice(0, 6).map(t => (
                        <button key={t.id}
                          onClick={() => handleTemplateSelect(t)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                            selectedTemplateId === t.id
                              ? 'bg-[var(--color-primary)]/30 text-[var(--color-text-primary)] border border-[var(--color-primary)]/40'
                              : 'bg-white/[0.06] text-[var(--color-text-secondary)] hover:bg-white/[0.1] border border-transparent'
                          }`}
                        >
                          {t.country}·{t.visaType}
                          {t.isSystem && <span className="ml-1 text-[var(--color-info)]">★</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* 老客户快速填充 */}
                {recentCustomers.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[var(--color-text-placeholder)] mb-1.5">老客户快速填充</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recentCustomers.slice(0, 5).map((c, i) => (
                        <button key={i}
                          onClick={() => handleQuickFill(c)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[var(--color-text-secondary)] hover:bg-white/[0.1] border border-transparent transition-all"
                        >
                          {c.customerName} · {c.targetCountry}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 联系人信息 */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 pb-2 border-b border-white/5">
            联系人信息
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>联系人姓名 *</label>
              <input
                className={inputClass}
                placeholder="请输入联系人姓名"
                value={form.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>手机号 *</label>
              <input
                className={inputClass}
                placeholder="138xxxxxxxx"
                value={form.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                maxLength={11}
              />
            </div>
            <div>
              <label className={labelClass}>邮箱</label>
              <input
                className={inputClass}
                placeholder="example@mail.com"
                type="email"
                value={form.customerEmail}
                onChange={(e) => handleChange('customerEmail', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>护照号</label>
              <input
                className={inputClass}
                placeholder="E12345678"
                value={form.passportNo}
                onChange={(e) => handleChange('passportNo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* M5：申请人列表 */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
              申请人列表 ({applicants.length}人)
            </h4>
            <button
              onClick={addApplicant}
              className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors"
            >
              + 添加申请人
            </button>
          </div>
          <div className="space-y-2">
            {applicants.map((applicant, i) => (
              <ApplicantFormItem
                key={i}
                index={i}
                applicant={applicant}
                onChange={updateApplicant}
                onRemove={removeApplicant}
                canRemove={applicants.length > 1}
              />
            ))}
          </div>
        </div>

        {/* 签证信息 */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 pb-2 border-b border-white/5">
            签证信息
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>申请国家 *</label>
              <input
                className={inputClass}
                placeholder="如：法国、美国"
                value={form.targetCountry}
                onChange={(e) => handleChange('targetCountry', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>签证类型 *</label>
              <input
                className={inputClass}
                placeholder="如：旅游、商务"
                value={form.visaType}
                onChange={(e) => handleChange('visaType', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>签证类别</label>
              <input
                className={inputClass}
                placeholder="如：贴纸签、电子签"
                value={form.visaCategory}
                onChange={(e) => handleChange('visaCategory', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>送签城市</label>
              <input
                className={inputClass}
                placeholder="如：北京、上海"
                value={form.targetCity}
                onChange={(e) => handleChange('targetCity', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>出行日期</label>
              <input
                className={inputClass}
                type="date"
                value={form.travelDate}
                onChange={(e) => handleChange('travelDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 订单信息 */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 pb-2 border-b border-white/5">
            订单信息
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>金额 (¥) *</label>
              <input
                className={inputClass}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>支付方式</label>
              <select
                className={inputClass}
                value={form.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
              >
                <option value="" className="bg-[#252B3B]">请选择</option>
                <option value="支付宝" className="bg-[#252B3B]">支付宝</option>
                <option value="花呗" className="bg-[#252B3B]">花呗</option>
                <option value="信用支付" className="bg-[#252B3B]">信用支付</option>
                <option value="微信" className="bg-[#252B3B]">微信</option>
                <option value="现金" className="bg-[#252B3B]">现金</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>来源渠道</label>
              <input
                className={inputClass}
                placeholder="如：淘宝、门店"
                value={form.sourceChannel}
                onChange={(e) => handleChange('sourceChannel', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>外部订单号</label>
              <input
                className={inputClass}
                placeholder="网店/第三方订单号"
                value={form.externalOrderNo}
                onChange={(e) => handleChange('externalOrderNo', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className={labelClass}>备注</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={2}
              placeholder="订单备注信息"
              value={form.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
            />
          </div>
        </div>

        {/* M5：财务明细 */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 pb-2 border-b border-white/5">
            财务明细
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>平台扣点费率</label>
              <select
                className={inputClass}
                value={form.platformFeeRate}
                onChange={(e) => handleChange('platformFeeRate', e.target.value)}
              >
                <option value="0.061" className="bg-[#252B3B]">6.1%</option>
                <option value="0.073" className="bg-[#252B3B]">7.3%</option>
                <option value="0.05" className="bg-[#252B3B]">5%</option>
                <option value="0" className="bg-[#252B3B]">0%</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>签证费 (¥)</label>
              <input
                className={inputClass}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.visaFee}
                onChange={(e) => handleChange('visaFee', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>保险费 (¥)</label>
              <input
                className={inputClass}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.insuranceFee}
                onChange={(e) => handleChange('insuranceFee', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>拒签保险 (¥)</label>
              <input
                className={inputClass}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.rejectionInsurance}
                onChange={(e) => handleChange('rejectionInsurance', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>好评返现 (¥)</label>
              <input
                className={inputClass}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.reviewBonus}
                onChange={(e) => handleChange('reviewBonus', e.target.value)}
              />
            </div>
          </div>
          {/* 财务预览 */}
          {amount > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[var(--color-text-placeholder)]">平台费用</span>
                  <p className="text-[var(--color-warning)] font-medium">¥{platformFeePreview.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[var(--color-text-placeholder)]">总成本</span>
                  <p className="text-[var(--color-error)] font-medium">
                    ¥{(platformFeePreview + visaFee + insuranceFee + rejectIns + reviewBonus).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-placeholder)]">预估毛利</span>
                  <p className={`font-medium ${grossProfitPreview >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                    ¥{grossProfitPreview.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? '创建中...' : '创建订单'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
