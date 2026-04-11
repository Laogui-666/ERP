'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, liquidSpringConfig } from '@design-system/theme/animations'
import { LiquidCard } from '@design-system/components/liquid-card'

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
    { label: '客服录单', color: 'violet' },
    { label: '资料员接单', color: 'indigo' },
    { label: '资料收集', color: 'amber' },
    { label: '操作员审核', color: 'pink' },
    { label: '材料制作', color: 'blue' },
    { label: '交付客户', color: 'green' },
    { label: '出签/拒签', color: 'green' },
  ]

  const getColorClass = (color: string) => {
    switch (color) {
      case 'violet': return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400'
      case 'indigo': return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
      case 'amber': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
      case 'pink': return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-400'
      case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
      case 'green': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
      default: return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          经营驾驶舱
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
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
        {
          [
            {
              label: '总营收',
              value: revenue,
              sub: data ? `毛利 ¥${data.totalProfit.toLocaleString()} (${data.profitRate})` : undefined,
              color: 'violet',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: '总订单',
              value: orders,
              sub: data ? `${data.totalApplicants} 位申请人` : undefined,
              color: 'blue',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
            },
            {
              label: '进行中',
              value: inProgress,
              sub: data ? `已出签 ${data.approved} / 拒签 ${data.rejected}` : undefined,
              color: 'amber',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: '出签率',
              value: approvalRate,
              color: 'green',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((item) => (
            <motion.div key={item.label} variants={staggerItem}>
              <LiquidCard liquidIntensity="light" className={`p-6 rounded-2xl shadow-lg ${getColorClass(item.color)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{item.label}</h3>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass(item.color).replace('bg-', 'bg-opacity-20 bg-')}`}>
                    {item.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{item.value}</div>
                {item.sub && (
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">{item.sub}</div>
                )}
              </LiquidCard>
            </motion.div>
          ))
        }
      </motion.div>

      {/* 快捷操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.gentle, delay: 0.3 }}
      >
        <LiquidCard liquidIntensity="light" className="p-6 rounded-2xl shadow-lg">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 tracking-wide">快捷操作</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...liquidSpringConfig.gentle, delay: 0.1 * index }}
                whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              >
                <a
                  href={action.href}
                  className="block p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-xl">{action.icon}</div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{action.label}</h3>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{action.description}</p>
                </a>
              </motion.div>
            ))}
          </div>
        </LiquidCard>
      </motion.div>

      {/* 工作流说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.gentle, delay: 0.4 }}
      >
        <LiquidCard liquidIntensity="light" className="p-6 rounded-2xl shadow-lg">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 tracking-wide">核心工作流</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {workflowSteps.map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <motion.span
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getColorClass(step.color)}`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={liquidSpringConfig.snappy}
                >
                  {step.label}
                </motion.span>
                {i < arr.length - 1 && (
                  <svg className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-500 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </LiquidCard>
      </motion.div>
    </div>
  )
}
