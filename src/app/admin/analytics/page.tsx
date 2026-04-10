'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@shared/hooks/use-auth'
import { PageHeader } from '@shared/components/layout/page-header'
import { StatCard } from '@erp/components/analytics/stat-card'
import { TrendChart } from '@erp/components/analytics/trend-chart'
import { RankingTable } from '@erp/components/analytics/ranking-table'
import { useToast } from '@shared/ui/toast'
import { Button } from '@shared/ui/button'
import { liquidSpringConfig, staggerContainer, staggerItem, hoverScale } from '@design-system/theme/animations'

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
  byCountry: [string, number][]
  byPayment: [string, number][]
}

interface TrendItem {
  month: string
  orders: number
  revenue: number
  profit: number
  approved: number
  rejected: number
}

interface WorkloadData {
  csRanking: Array<{ name: string; orders: number; revenue: number }>
  collectorWorkload: Array<{ name: string; orders: number }>
  operatorRanking: Array<{ name: string; orders: number; approved: number; rejected: number; approvalRate: string }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [workload, setWorkload] = useState<WorkloadData | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [overviewRes, trendRes, workloadRes] = await Promise.all([
        apiFetch(`/api/analytics/overview?month=${selectedMonth}`),
        apiFetch(`/api/analytics/trend?months=6`),
        apiFetch(`/api/analytics/workload?month=${selectedMonth}`),
      ])

      const [overviewJson, trendJson, workloadJson] = await Promise.all([
        overviewRes.json(),
        trendRes.json(),
        workloadRes.json(),
      ])

      if (overviewJson.success) setOverview(overviewJson.data)
      if (trendJson.success) setTrend(trendJson.data)
      if (workloadJson.success) setWorkload(workloadJson.data)
    } catch {
      toast('error', '加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = () => {
    window.open(`/api/analytics/export?month=${selectedMonth}&format=xlsx`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
      </div>
    )
  }

  const canExport = user?.role && ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'].includes(user.role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="数据统计"
        description="经营数据分析"
        action={
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-glass-card/80 backdrop-blur-xl border border-glass-border text-glass-primary text-sm focus:outline-none focus:ring-2 focus:ring-glass-primary/30 focus:border-glass-primary/50 hover:border-glass-primary/30 transition-all"
            />
            {canExport && (
              <Button
                variant="primary"
                size="md"
                onClick={handleExport}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出 Excel
              </Button>
            )}
          </div>
        }
      />

      {/* 核心指标卡片 */}
      {overview && (
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {(
            [
              {
                label: "总订单",
                value: overview.totalOrders,
                sub: `${overview.totalApplicants} 个申请人`,
                color: "info" as const,
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )
              },
              {
                label: "总营收",
                value: `¥${overview.totalRevenue.toLocaleString()}`,
                sub: `毛利 ¥${overview.totalProfit.toLocaleString()}`,
                color: "warning" as const,
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                label: "出签率",
                value: overview.approvalRate,
                sub: `出签 ${overview.approved} · 拒签 ${overview.rejected}`,
                color: parseFloat(overview.approvalRate) >= 90 ? "success" : "warning",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                label: "进行中",
                value: overview.inProgress,
                sub: `毛利率 ${overview.profitRate}`,
                color: "accent" as const,
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ] as const
          ).map((card, index) => (
            <motion.div key={index} variants={staggerItem}>
              <motion.div variants={hoverScale}>
                <StatCard
                  label={card.label}
                  value={card.value}
                  sub={card.sub}
                  color={card.color}
                  icon={card.icon}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 趋势图 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
      >
        <TrendChart data={trend} />
      </motion.div>

      {/* 国家分布 + 支付方式 */}
      {overview && (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-glass-primary mb-4">国家分布 TOP 10</h3>
            {overview.byCountry.length === 0 ? (
              <p className="text-xs text-glass-muted text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {overview.byCountry.map(([country, count]) => {
                  const maxCount = overview.byCountry[0][1]
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <motion.div 
                      key={country} 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * overview.byCountry.indexOf([country, count]) }}
                    >
                      <span className="text-xs text-glass-muted w-16 truncate">{country}</span>
                      <div className="flex-1 h-5 bg-glass-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-glass-primary/40 to-purple-500/30"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + 0.05 * overview.byCountry.indexOf([country, count]) }}
                        />
                      </div>
                      <span className="text-xs text-glass-primary font-medium w-8 text-right">{count}</span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          <motion.div variants={staggerItem} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-glass-primary mb-4">支付方式分布</h3>
            {overview.byPayment.length === 0 ? (
              <p className="text-xs text-glass-muted text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {overview.byPayment.map(([method, count]) => (
                  <motion.div 
                    key={method} 
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * overview.byPayment.indexOf([method, count]) }}
                  >
                    <span className="text-sm text-glass-primary">{method}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-glass-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-glass-primary/40"
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / overview.totalOrders) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + 0.05 * overview.byPayment.indexOf([method, count]) }}
                        />
                      </div>
                      <span className="text-xs text-glass-muted w-12 text-right">
                        {count} ({((count / overview.totalOrders) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* 人员绩效排行 */}
      {workload && (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <RankingTable
              title="客服绩效排行"
              items={workload.csRanking}
              columns={[
                { key: 'orders', label: '订单', format: (v) => `${v}单` },
                { key: 'revenue', label: '营收', format: (v) => `¥${Number(v).toLocaleString()}` },
              ]}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <RankingTable
              title="资料员工作负荷"
              items={workload.collectorWorkload}
              columns={[
                { key: 'orders', label: '接单', format: (v) => `${v}单` },
              ]}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <RankingTable
              title="操作员绩效"
              items={workload.operatorRanking}
              columns={[
                { key: 'orders', label: '处理', format: (v) => `${v}单` },
                { key: 'approvalRate', label: '出签率' },
              ]}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
