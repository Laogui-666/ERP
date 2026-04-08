'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@shared/lib/api-client'
import { StatusBadge } from '@erp/components/orders/status-badge'
import { StatusTimelineHorizontal } from '@erp/components/orders/status-timeline'
import { CustomerUpload } from '@erp/components/documents/customer-upload'
import { MaterialChecklist } from '@erp/components/orders/material-checklist'
import { ChatPanel } from '@erp/components/chat/chat-panel'
import { useChatStore } from '@erp/stores/chat-store'
import { registerNotificationHandler, registerChatMessageHandler } from '@shared/hooks/use-socket-client'
import { LiquidCard } from '@design-system/components/liquid-card'
import { useToast } from '@shared/ui/toast'
import { formatDateTime, formatDate } from '@shared/lib/utils'
import type { OrderDetail } from '@erp/types/order'

export default function CustomerOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [activeApplicantTab, setActiveApplicantTab] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}`, { cache: 'no-store' })
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

  useEffect(() => {
    const handlerId = `customer-order-${orderId}`
    const unregister = registerNotificationHandler(handlerId, (data) => {
      if (data.orderId === orderId) fetchOrder()
    })
    return unregister
  }, [orderId, fetchOrder])

  useEffect(() => {
    pollingRef.current = setInterval(() => { fetchOrder() }, 30000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [fetchOrder])

  const handleSubmit = async () => {
    if (!order) return
    const hasFiles = order.documentRequirements.some((r) => r.files.length > 0)
    if (!hasFiles) { toast('error', '请至少上传一份资料后再提交'); return }
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/submit`, { method: 'POST' })
      const json = await res.json()
      if (json.success) { toast('success', json.data?.message ?? '提交成功'); fetchOrder() }
      else { toast('error', json.error?.message ?? '提交失败') }
    } catch { toast('error', '提交失败') }
    finally { setIsSubmitting(false) }
  }

  const handleFeedback = async (result: 'APPROVED' | 'REJECTED') => {
    if (!order) return
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: result }),
      })
      const json = await res.json()
      if (json.success) { toast('success', result === 'APPROVED' ? '已确认出签' : '已确认拒签'); setShowFeedback(false); fetchOrder() }
      else { toast('error', json.error?.message ?? '操作失败') }
    } catch { toast('error', '操作失败') }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-liquid-ocean/10" /><div className="w-32 h-5 rounded bg-liquid-ocean/10" /></div>
          <div className="w-16 h-5 rounded-full bg-liquid-ocean/10" />
        </div>
        <LiquidCard className="p-5 space-y-4">
          {[1,2,3].map(i => <div key={i} className="flex gap-3"><div className="w-7 h-7 rounded-full bg-liquid-ocean/10 shrink-0" /><div className="space-y-1 flex-1"><div className="w-20 h-4 rounded bg-liquid-ocean/10" /><div className="w-16 h-3 rounded bg-liquid-ocean/5" /></div></div>)}
        </LiquidCard>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <p className="text-liquid-mist">订单不存在</p>
        <button onClick={() => router.push('/customer/orders')} className="mt-4 text-sm text-liquid-ocean hover:underline">返回订单列表</button>
      </div>
    )
  }

  const canSubmit = order.status === 'COLLECTING_DOCS' && order.documentRequirements.some((r) => r.files.length > 0)
  const canFeedback = order.status === 'DELIVERED'
  const showMaterials = ['MAKING_MATERIALS','PENDING_DELIVERY','DELIVERED','APPROVED','REJECTED','PARTIAL'].includes(order.status)
  const showDocuments = order.documentRequirements.length > 0
  const isSchengen = ['法国','德国','意大利','西班牙','荷兰','瑞士','奥地利','比利时','葡萄牙','希腊','丹麦','挪威','瑞典','芬兰','冰岛','捷克','波兰','匈牙利','卢森堡','斯洛伐克','斯洛文尼亚','爱沙尼亚','拉脱维亚','立陶宛','马耳他'].some(c => order.targetCountry.includes(c)) || order.visaCategory?.includes('申根')
  const isEVisa = order.visaCategory?.includes('电子') || order.visaType?.includes('电子')
  const approvedCount = order.documentRequirements.filter((r) => r.status === 'APPROVED').length
  const totalCount = order.documentRequirements.length
  const allApproved = totalCount > 0 && approvedCount === totalCount
  const showMultiTabs = order.applicantCount > 1 && order.applicants.length > 1

  // 多人订单：按申请人分组资料需求
  const getApplicantRequirements = (applicantIndex: number) => {
    if (!showMultiTabs) return order.documentRequirements
    const perPerson = Math.ceil(order.documentRequirements.length / order.applicants.length)
    return order.documentRequirements.slice(applicantIndex * perPerson, Math.min((applicantIndex + 1) * perPerson, order.documentRequirements.length))
  }

  return (
    <div className="space-y-5 pb-4">
      {/* ===== 头部 ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/customer/orders')} className="text-liquid-mist/60 hover:text-liquid-mist transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-mono text-sm text-liquid-oceanLight">{order.orderNo}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* 签证概要 */}
      <div className="text-sm text-liquid-mist flex items-center gap-2">
        <span>🌍</span><span>{order.targetCountry}</span>
        <span className="text-liquid-mist/60">·</span><span>{order.visaType}</span>
        {order.applicantCount > 1 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-liquid-sand/15 text-liquid-sand">👥 {order.applicantCount}人</span>
        )}
      </div>

      {/* ===== 状态时间线（横向） ===== */}
      <LiquidCard className="p-4">
        <StatusTimelineHorizontal currentStatus={order.status} orderLogs={order.orderLogs} />
      </LiquidCard>

      {/* ===== 多申请人标签页 ===== */}
      {showMultiTabs && (
        <LiquidCard className="p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          {/* Tab 标签栏 */}
          <div className="flex border-b border-liquid-ocean/10 overflow-x-auto scrollbar-none">
            {order.applicants.map((a, i) => {
              const isActive = activeApplicantTab === i
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveApplicantTab(i)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? 'border-liquid-ocean text-liquid-deep bg-liquid-ocean/5'
                      : 'border-transparent text-liquid-mist/60 hover:text-liquid-mist hover:bg-liquid-ocean/5'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                    isActive ? 'bg-liquid-ocean/20 text-liquid-ocean' : 'bg-liquid-ocean/10 text-liquid-mist/60'
                  }`}>{a.name[0]}</span>
                  <span>{a.name}</span>
                  {a.documentsComplete && <span className="text-liquid-emerald">✓</span>}
                  {a.visaResult === 'APPROVED' && <span className="text-[10px]">🎉</span>}
                  {a.visaResult === 'REJECTED' && <span className="text-[10px]">😞</span>}
                </button>
              )
            })}
          </div>
          {/* Tab 内容：当前选中申请人的资料 */}
          <div className="p-4">
            {order.applicants[activeApplicantTab] && (
              <div className="space-y-2 mb-2">
                <div className="flex items-center gap-3 text-xs text-liquid-mist">
                  {order.applicants[activeApplicantTab].passportNo && (
                    <span>护照 {order.applicants[activeApplicantTab].passportNo}</span>
                  )}
                  <span>{getApplicantRequirements(activeApplicantTab).filter(r => r.status === 'APPROVED').length}/{getApplicantRequirements(activeApplicantTab).length} 已合格</span>
                </div>
              </div>
            )}
            <CustomerUpload
              orderId={orderId}
              requirements={getApplicantRequirements(activeApplicantTab)}
              onRefresh={fetchOrder}
            />
          </div>
        </LiquidCard>
      )}

      {/* ===== 单人：资料上传 ===== */}
      {!showMultiTabs && showDocuments && (
        <>
          <div className="h-px bg-liquid-ocean/10" />
          <CustomerUpload
            orderId={orderId}
            requirements={order.documentRequirements}
            onRefresh={fetchOrder}
          />
        </>
      )}

      {/* 确认提交按钮 */}
      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-liquid-ocean text-white text-sm font-medium hover:bg-liquid-oceanLight disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</>
          ) : (
            <><span>✅</span><span>确认提交资料</span><span className="text-xs opacity-70">({approvedCount}/{totalCount} 已合格)</span></>
          )}
        </button>
      )}

      {order.status === 'COLLECTING_DOCS' && !canSubmit && totalCount > 0 && (
        <div className="text-center text-xs text-liquid-mist/60 py-2">
          {order.documentRequirements.every((r) => r.status === 'REVIEWING' || r.status === 'APPROVED')
            ? '✅ 资料已提交，正在审核中'
            : allApproved ? '✅ 所有资料已审核通过，等待资料员提交审核' : '请先上传资料后再提交'}
        </div>
      )}

      {/* ===== B类材料 ===== */}
      {showMaterials && (
        <><div className="h-px bg-liquid-ocean/10" /><MaterialChecklist status={order.status} materials={order.visaMaterials} /></>
      )}

      {/* ===== 出签反馈 ===== */}
      {canFeedback && (
        <>
          <div className="h-px bg-liquid-ocean/10" />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-liquid-deep flex items-center gap-2">
              <span>🎫</span><span>签证结果</span>
              {isSchengen && <span className="text-[10px] px-1.5 py-0.5 rounded bg-liquid-ocean/15 text-liquid-ocean">申根签证</span>}
            </h3>
            {isEVisa ? (
              <div className="rounded-xl border border-liquid-ocean/10 bg-liquid-ocean/5 p-4 text-center">
                <p className="text-xs text-liquid-mist">电子签证结果将由送签专员反馈，届时会通知您</p>
              </div>
            ) : showFeedback ? (
              <div className="rounded-xl border border-liquid-ocean/10 bg-liquid-ocean/5 p-4 space-y-3">
                <p className="text-xs text-liquid-mist">请确认您的签证结果：</p>
                <div className="flex gap-3">
                  <button onClick={() => handleFeedback('APPROVED')} className="flex-1 py-2.5 rounded-xl bg-liquid-emerald/15 text-liquid-emerald text-sm font-medium hover:bg-liquid-emerald/25 transition-colors">✅ 已出签</button>
                  <button onClick={() => handleFeedback('REJECTED')} className="flex-1 py-2.5 rounded-xl bg-liquid-ruby/15 text-liquid-ruby text-sm font-medium hover:bg-liquid-ruby/25 transition-colors">❌ 被拒签</button>
                </div>
                <button onClick={() => setShowFeedback(false)} className="w-full text-xs text-liquid-mist/60 hover:text-liquid-mist transition-colors">取消</button>
              </div>
            ) : (
              <button onClick={() => setShowFeedback(true)} className="w-full py-3 rounded-xl border border-liquid-ocean/30 text-liquid-ocean text-sm font-medium hover:bg-liquid-ocean/10 transition-colors">确认签证结果</button>
            )}
          </div>
        </>
      )}

      {/* ===== 订单信息 ===== */}
      <div className="h-px bg-liquid-ocean/10" />
      <LiquidCard className="p-5 space-y-1">
        <h3 className="text-sm font-semibold text-liquid-deep flex items-center gap-2 mb-3"><span>📋</span><span>订单信息</span></h3>
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
      </LiquidCard>

      {/* ===== 聊天浮动按钮 ===== */}
      <CustomerChatButton orderId={orderId} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-liquid-mist/60">{label}</span>
      <span className="text-xs text-liquid-mist">{value}</span>
    </div>
  )
}

// ==================== 客户端聊天浮动按钮 ====================

function CustomerChatButton({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { rooms, fetchRooms } = useChatStore()
  const room = rooms.find((r) => r.orderId === orderId)
  const unread = room?.unreadCount ?? 0

  useEffect(() => { fetchRooms() }, [fetchRooms])

  useEffect(() => {
    const handlerId = `chat-badge-${orderId}`
    const unregister = registerChatMessageHandler(handlerId, (data) => {
      if (data.orderId === orderId) fetchRooms()
    })
    return unregister
  }, [orderId, fetchRooms])

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 right-4 z-40 w-12 h-12 rounded-full bg-liquid-ocean text-white shadow-lg shadow-liquid-ocean/30 hover:shadow-liquid-ocean/50 hover:scale-105 transition-all duration-200 flex items-center justify-center relative"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
        )}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-liquid-ruby text-[10px] text-white flex items-center justify-center px-1 font-medium">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {isOpen && (
        <div className="fixed z-50 max-sm:inset-0 max-sm:rounded-none sm:bottom-20 sm:right-4 sm:w-96 sm:h-[500px] sm:rounded-2xl overflow-hidden shadow-2xl border border-liquid-ocean/10 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
          <ChatPanel orderId={orderId} compact onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}
