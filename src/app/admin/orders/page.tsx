'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { useToast } from '@shared/ui/toast'
import { Button } from '@shared/ui/button'
import { Card, CardContent } from '@shared/ui/card'
import { Input } from '@shared/ui/input'
import { formatDate } from '@shared/lib/utils'
import { ORDER_STATUS_LABELS } from '@erp/types/order'
import { LiquidTable, Column } from '@design-system/components/liquid-table'
import { LiquidFilterBar } from '@design-system/components/liquid-filter-bar'
import { LiquidBatchAction } from '@design-system/components/liquid-batch-action'
import { LiquidPagination } from '@design-system/components/liquid-pagination'
import { liquidSpringConfig } from '@design-system/theme/animations'
import type { Order, OrderStatus } from '@erp/types/order'

interface ApplicantForm {
  name: string
  phone: string
  passportNo: string
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchOrders = useCallback(async (params: { page: number; pageSize: number }) => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(keyword.trim() && { keyword: keyword.trim() }),
      })
      const res = await apiFetch(`/api/orders?${query.toString()}`)
      const json = await res.json()
      if (json.success) {
        setOrders(json.data)
        setMeta(json.meta)
        setSelectedIds(new Set())
      }
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, keyword])

  useEffect(() => {
    fetchOrders({ page: 1, pageSize: 20 })
    setPage(1)
  }, [fetchOrders])

  const handlePageChange = (p: number) => {
    setPage(p)
    fetchOrders({ page: p, pageSize: 20 })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)))
    }
  }

  const handleBatchAction = async (action: string) => {
    if (selectedIds.size === 0) return
    if (action === 'cancel') {
      const res = await apiFetch('/api/orders/batch-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', `已批量取消 ${selectedIds.size} 个订单`)
        fetchOrders({ page, pageSize: 20 })
      } else {
        toast('error', json.error?.message ?? '批量取消失败')
      }
    }
  }

  const statusOptions = useMemo(() => [
    { value: 'ALL', label: '全部状态' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ], [])

  // 表格列定义
  const columns: Column<Order>[] = [
    {
      key: 'orderNo',
      title: '订单号',
      width: '140px',
      render: (order) => (
        <span className="text-sm font-mono text-glass-primary">{order.orderNo}</span>
      ),
    },
    {
      key: 'customer',
      title: '客户',
      render: (order) => (
        <div>
          <div className="text-sm font-medium text-glass-primary">{order.customerName}</div>
          <div className="text-xs text-glass-muted">{order.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'visa',
      title: '签证信息',
      render: (order) => (
        <div>
          <div className="text-sm text-glass-primary">{order.targetCountry}</div>
          <div className="text-xs text-glass-muted">{order.visaType}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '120px',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'amount',
      title: '金额',
      width: '100px',
      render: (order) => (
        <span className="text-sm text-glass-primary">¥{Number(order.amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: '140px',
      render: (order) => (
        <span className="text-xs text-glass-muted">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '80px',
      render: (order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-xs text-glass-primary hover:text-glass-primary/80 transition-colors"
        >
          查看详情
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-glass-primary tracking-tight">订单管理</h1>
          <p className="mt-1 text-sm text-glass-muted">管理所有签证订单</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建订单
        </Button>
      </motion.div>

      {/* 筛选栏 */}
      <LiquidFilterBar
        filters={[
          {
            key: 'status',
            label: '状态',
            value: statusFilter,
            options: statusOptions,
            onChange: (value) => setStatusFilter(value as OrderStatus | 'ALL'),
          },
        ]}
        searchValue={keyword}
        onSearchChange={setKeyword}
        onSearch={() => fetchOrders({ page: 1, pageSize: 20 })}
      />

      {/* 批量操作 */}
      <LiquidBatchAction
        selectedCount={selectedIds.size}
        actions={[
          { key: 'cancel', label: '批量取消', danger: true },
        ]}
        onAction={handleBatchAction}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* 订单表格 */}
      <div className="glass-table rounded-xl overflow-hidden">
        <LiquidTable
          data={orders}
          columns={columns}
          rowKey="id"
          selectable
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onSelectAll={toggleSelectAll}
          loading={isLoading}
          emptyText="暂无订单"
        />
      </div>

      {/* 分页 */}
      {meta && (
        <div className="glass-pagination flex justify-center">
          <LiquidPagination
            current={page}
            total={meta.total}
            pageSize={meta.pageSize}
            onChange={handlePageChange}
          />
        </div>
      )}

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

// 新建订单弹窗组件
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
    contactName: '',
    targetCity: '',
    platformFeeRate: '0.061',
    visaFee: '',
    insuranceFee: '',
    rejectionInsurance: '',
    reviewBonus: '',
  })

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

    const validApplicants = applicants.filter((a) => a.name.trim())
    if (validApplicants.length === 0) {
      toast('error', '请至少填写一个申请人')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          platformFeeRate: Number(form.platformFeeRate),
          visaFee: form.visaFee ? Number(form.visaFee) : undefined,
          insuranceFee: form.insuranceFee ? Number(form.insuranceFee) : undefined,
          rejectionInsurance: form.rejectionInsurance ? Number(form.rejectionInsurance) : undefined,
          reviewBonus: form.reviewBonus ? Number(form.reviewBonus) : undefined,
          applicants: validApplicants,
        }),
      })
      const json = await res.json()
      if (json.success) {
        onSuccess()
      } else {
        toast('error', json.error?.message ?? '创建失败')
      }
    } catch {
      toast('error', '创建失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-glass-overlay backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={liquidSpringConfig.medium}
        className="w-full max-w-4xl max-h-[90vh] overflow-auto"
      >
        <Card padding="none" className="overflow-hidden">
          {/* 弹窗头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
            <h2 className="text-lg font-semibold text-glass-primary">新建订单</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-glass-muted hover:text-glass-primary hover:bg-glass-hover transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <CardContent className="space-y-6">
            {/* 客户信息 */}
            <div>
              <h3 className="text-sm font-semibold text-glass-primary mb-3">客户信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="客户姓名 *"
                  value={form.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  placeholder="请输入客户姓名"
                />
                <Input
                  label="手机号 *"
                  value={form.customerPhone}
                  onChange={(e) => handleChange('customerPhone', e.target.value)}
                  placeholder="请输入手机号"
                />
                <Input
                  label="邮箱"
                  value={form.customerEmail}
                  onChange={(e) => handleChange('customerEmail', e.target.value)}
                  placeholder="请输入邮箱"
                />
                <Input
                  label="护照号"
                  value={form.passportNo}
                  onChange={(e) => handleChange('passportNo', e.target.value)}
                  placeholder="请输入护照号"
                />
              </div>
            </div>

            {/* 签证信息 */}
            <div>
              <h3 className="text-sm font-semibold text-glass-primary mb-3">签证信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="目的国家 *"
                  value={form.targetCountry}
                  onChange={(e) => handleChange('targetCountry', e.target.value)}
                  placeholder="如：日本"
                />
                <Input
                  label="签证类型 *"
                  value={form.visaType}
                  onChange={(e) => handleChange('visaType', e.target.value)}
                  placeholder="如：旅游签证"
                />
                <Input
                  label="签证类别"
                  value={form.visaCategory}
                  onChange={(e) => handleChange('visaCategory', e.target.value)}
                  placeholder="如：单次/多次"
                />
                <Input
                  label="目的城市"
                  value={form.targetCity}
                  onChange={(e) => handleChange('targetCity', e.target.value)}
                  placeholder="如：东京"
                />
              </div>
            </div>

            {/* 申请人信息 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-glass-primary">申请人信息</h3>
                <Button variant="ghost" size="sm" onClick={addApplicant}>
                  + 添加申请人
                </Button>
              </div>
              <div className="space-y-3">
                {applicants.map((applicant, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl glass-card"
                  >
                    <span className="text-xs text-glass-muted w-6">#{index + 1}</span>
                    <Input
                      placeholder="姓名"
                      value={applicant.name}
                      onChange={(e) => updateApplicant(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="手机号"
                      value={applicant.phone}
                      onChange={(e) => updateApplicant(index, 'phone', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="护照号"
                      value={applicant.passportNo}
                      onChange={(e) => updateApplicant(index, 'passportNo', e.target.value)}
                      className="flex-1"
                    />
                    {applicants.length > 1 && (
                      <button
                        onClick={() => removeApplicant(index)}
                        className="text-glass-danger hover:text-glass-danger/80 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 财务信息 */}
            <div>
              <h3 className="text-sm font-semibold text-glass-primary mb-3">财务信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="订单金额 *"
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="请输入金额"
                />
                <Input
                  label="平台费率"
                  value={form.platformFeeRate}
                  onChange={(e) => handleChange('platformFeeRate', e.target.value)}
                  placeholder="0.061"
                />
                <Input
                  label="签证费"
                  type="number"
                  value={form.visaFee}
                  onChange={(e) => handleChange('visaFee', e.target.value)}
                  placeholder="请输入签证费"
                />
                <Input
                  label="保险费"
                  type="number"
                  value={form.insuranceFee}
                  onChange={(e) => handleChange('insuranceFee', e.target.value)}
                  placeholder="请输入保险费"
                />
                <Input
                  label="拒签险"
                  type="number"
                  value={form.rejectionInsurance}
                  onChange={(e) => handleChange('rejectionInsurance', e.target.value)}
                  placeholder="请输入拒签险"
                />
                <Input
                  label="好评返现"
                  type="number"
                  value={form.reviewBonus}
                  onChange={(e) => handleChange('reviewBonus', e.target.value)}
                  placeholder="请输入好评返现"
                />
              </div>

              {/* 财务预览 */}
              <div className="mt-4 p-4 rounded-xl glass-card">
                <h4 className="text-xs font-semibold text-glass-muted mb-2">财务预览</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-glass-muted text-xs">订单金额</span>
                    <div className="text-glass-primary font-semibold">¥{amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-glass-muted text-xs">平台费</span>
                    <div className="text-glass-danger">-¥{platformFeePreview.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-glass-muted text-xs">成本合计</span>
                    <div className="text-glass-danger">
                      -¥{(visaFee + insuranceFee + rejectIns + reviewBonus).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-glass-muted text-xs">毛利</span>
                    <div className={grossProfitPreview >= 0 ? 'text-glass-success' : 'text-glass-danger'}>
                      ¥{grossProfitPreview.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 其他信息 */}
            <div>
              <h3 className="text-sm font-semibold text-glass-primary mb-3">其他信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="付款方式"
                  value={form.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  placeholder="如：支付宝/微信/银行转账"
                />
                <Input
                  label="来源渠道"
                  value={form.sourceChannel}
                  onChange={(e) => handleChange('sourceChannel', e.target.value)}
                  placeholder="如：淘宝/京东/线下"
                />
                <Input
                  label="外部订单号"
                  value={form.externalOrderNo}
                  onChange={(e) => handleChange('externalOrderNo', e.target.value)}
                  placeholder="电商平台订单号"
                />
                <Input
                  label="出行日期"
                  type="date"
                  value={form.travelDate}
                  onChange={(e) => handleChange('travelDate', e.target.value)}
                />
              </div>
              <div className="mt-4">
                <label className="text-sm font-semibold text-glass-primary mb-2 block">备注</label>
                <textarea
                  value={form.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  placeholder="请输入备注信息"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl glass-input text-glass-primary text-sm placeholder:text-glass-muted focus:outline-none focus:ring-2 focus:ring-glass-primary/30 focus:border-glass-primary transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </CardContent>

          {/* 弹窗底部 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-glass-border">
            <Button variant="ghost" size="md" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              创建订单
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
