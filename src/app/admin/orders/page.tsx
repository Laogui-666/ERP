'use client'

import { useEffect, useState, useCallback } from 'react'
import { useOrderStore } from '@/stores/order-store'
import { useAuth } from '@/hooks/use-auth'
import { StatusBadge } from '@/components/orders/status-badge'
import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/types/order'

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
]

export default function OrdersPage() {
  const { orders, meta, isLoading, fetchOrders } = useOrderStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)

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
      <GlassCard className="p-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="glass-input text-sm min-w-[140px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#252B3B]">
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
              className="glass-input w-full text-sm"
            />
          </div>

          <button
            onClick={handleFilter}
            className="glass-btn-primary px-4 py-2.5 text-sm font-medium"
          >
            查询
          </button>

          {/* 统计 */}
          {meta && (
            <span className="text-sm text-[var(--color-text-secondary)] ml-auto">
              共 {meta.total} 条
            </span>
          )}
        </div>
      </GlassCard>

      {/* 订单列表 */}
      <GlassCard className="overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-[var(--color-text-placeholder)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-[var(--color-text-secondary)]">暂无订单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">订单号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">客户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">国家/类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-placeholder)] uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-[var(--color-primary-light)]">{order.orderNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">{order.customerName}</div>
                        <div className="text-xs text-[var(--color-text-placeholder)]">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-[var(--color-text-primary)]">{order.targetCountry}</div>
                        <div className="text-xs text-[var(--color-text-placeholder)]">{order.visaType}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--color-text-primary)]">¥{Number(order.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--color-text-secondary)]">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors"
                      >
                        查看详情
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {meta && meta.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-[var(--color-text-secondary)]">
              第 {meta.page} / {meta.totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                上一页
              </button>
              <button
                disabled={page >= (meta.totalPages ?? 1)}
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </GlassCard>

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
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.customerName || !form.customerPhone || !form.targetCountry || !form.visaType || !form.amount) {
      toast('error', '请填写必填字段')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          customerEmail: form.customerEmail || undefined,
          passportNo: form.passportNo || undefined,
          visaCategory: form.visaCategory || undefined,
          travelDate: form.travelDate || undefined,
          paymentMethod: form.paymentMethod || undefined,
          sourceChannel: form.sourceChannel || undefined,
          remark: form.remark || undefined,
          externalOrderNo: form.externalOrderNo || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
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
      <div className="space-y-4">
        {/* 客户信息 */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 pb-2 border-b border-white/5">
            客户信息
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>客户姓名 *</label>
              <input
                className={inputClass}
                placeholder="请输入客户姓名"
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
                <option value="微信" className="bg-[#252B3B]">微信</option>
                <option value="支付宝" className="bg-[#252B3B]">支付宝</option>
                <option value="银行转账" className="bg-[#252B3B]">银行转账</option>
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
