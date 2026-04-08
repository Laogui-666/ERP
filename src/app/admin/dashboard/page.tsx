'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { LiquidStatCard } from '@design-system/components/liquid-stat-card'
import { LiquidQuickAction } from '@design-system/components/liquid-quick-action'
import { LiquidCard, LiquidCardContent } from '@design-system/components/liquid-card'
import { staggerContainer, staggerItem, liquidSpringConfig } from '@design-system/theme/animations'

interface OverviewData {
  month: string
  totalOrders: number
  totalApplicants: number
  totalRevenue: number
  totalProfit: number
  profitRate: string
  inProgress: number
  approved: number
  rejected: number
  approvalRate: string
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null)

  const fetchOverview = useCallback(async () => {
    try {
      const res = await apiFetch('/api/analytics/overview')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      // 静默失败
    }
  }, [])

  useEffect(() => {
    void fetchOverview()
  }, [fetchOverview])

  const revenue = data ? `¥${data.totalRevenue.toLocaleString()}` : '--'
  const orders = data ? String(data.totalOrders) : '--'
  const inProgress = data ? String(data.inProgress) : '--'
  const approvalRate = data ? data.approvalRate : '--'

  const quickActions = [
    { href: '/admin/orders', label: '订单管理', icon: '📋', description: '查看和管理所有订单' },
    { href: '/admin/pool', label: '公共池', icon: '🏊', description: '抢单和分配订单' },
    { href: '/admin/team', label: '团队管理', icon: '👥', description: '管理团队成员' },
    { href: '/admin/analytics', label: '数据统计', icon: '📊', description: '查看详细报表' },
  ]

  const workflowSteps = [
    { label: '客服录单', color: 'bg-blue-500/15 text-blue-600 border-blue-500/20' },
    { label: '资料员接单', color: 'bg-liquid-ocean/15 text-liquid-ocean border-liquid-ocean/20' },
    { label: '资料收集', color: 'bg-amber-500/15 text-amber-600 border-amber-500/20' },
    { label: '操作员审核', color: 'bg-violet-500/15 text-violet-600 border-violet-500/20' },
    { label: '材料制作', color: 'bg-slate-500/15 text-slate-600 border-slate-500/20' },
    { label: '交付客户', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
    { label: '出签/拒签', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
  ]

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
      >
        <h1 className="text-2xl font-bold text-liquid-deep tracking-tight">
          经营驾驶舱
        </h1>
        <p className="mt-1 text-sm text-liquid-mist">
          {data ? `${data.month} 实时数据` : '实时掌握业务运营状况'}
        </p>
      </motion.div>

      {/* 核心指标卡片 */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <LiquidStatCard
            label="总营收"
            value={revenue}
            sub={data ? `毛利 ¥${data.totalProfit.toLocaleString()} (${data.profitRate})` : undefined}
            color="primary"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <LiquidStatCard
            label="总订单"
            value={orders}
            sub={data ? `${data.totalApplicants} 位申请人` : undefined}
            color="info"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <LiquidStatCard
            label="进行中"
            value={inProgress}
            sub={data ? `已出签 ${data.approved} / 拒签 ${data.rejected}` : undefined}
            color="warning"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <LiquidStatCard
            label="出签率"
            value={approvalRate}
            color="success"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </motion.div>
      </motion.div>

      {/* 快捷操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.gentle, delay: 0.3 }}
      >
        <LiquidCard padding="lg" variant="liquid">
          <LiquidCardContent>
            <h2 className="text-sm font-semibold text-liquid-deep mb-4 tracking-wide">快捷操作</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <LiquidQuickAction
                  key={action.href}
                  href={action.href}
                  label={action.label}
                  icon={action.icon}
                  description={action.description}
                  delay={index}
                />
              ))}
            </div>
          </LiquidCardContent>
        </LiquidCard>
      </motion.div>

      {/* 工作流说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.gentle, delay: 0.4 }}
      >
        <LiquidCard padding="lg" variant="liquid">
          <LiquidCardContent>
            <h2 className="text-sm font-semibold text-liquid-deep mb-4 tracking-wide">核心工作流</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {workflowSteps.map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <motion.span
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${step.color} bg-white/30 backdrop-blur-sm`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={liquidSpringConfig.snappy}
                  >
                    {step.label}
                  </motion.span>
                  {i < arr.length - 1 && (
                    <svg className="w-3.5 h-3.5 text-liquid-mist opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </LiquidCardContent>
        </LiquidCard>
      </motion.div>
    </div>
  )
}
