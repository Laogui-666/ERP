'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@shared/hooks/use-auth'
import { PageHeader } from '@shared/components/layout/page-header'
import { GlassCard } from '@shared/ui/glass-card'
import { StatCard } from '@erp/components/analytics/stat-card'
import { TrendChart } from '@erp/components/analytics/trend-chart'
import { RankingTable } from '@erp/components/analytics/ranking-table'
import { useToast } from '@shared/ui/toast'

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
        <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
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
              className="glass-input text-sm"
            />
            {canExport && (
              <button
                onClick={handleExport}
                className="glass-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出 Excel
              </button>
            )}
          </div>
        }
      />

      {/* 核心指标卡片 */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="总订单"
            value={overview.totalOrders}
            sub={`${overview.totalApplicants} 个申请人`}
            color="info"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="总营收"
            value={`¥${overview.totalRevenue.toLocaleString()}`}
            sub={`毛利 ¥${overview.totalProfit.toLocaleString()}`}
            color="warning"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="出签率"
            value={overview.approvalRate}
            sub={`出签 ${overview.approved} · 拒签 ${overview.rejected}`}
            color={parseFloat(overview.approvalRate) >= 90 ? 'success' : 'warning'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="进行中"
            value={overview.inProgress}
            sub={`毛利率 ${overview.profitRate}`}
            color="accent"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* 趋势图 */}
      <TrendChart data={trend} />

      {/* 国家分布 + 支付方式 */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-5 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">国家分布 TOP 10</h3>
            {overview.byCountry.length === 0 ? (
              <p className="text-xs text-[var(--color-text-placeholder)] text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {overview.byCountry.map(([country, count]) => {
                  const maxCount = overview.byCountry[0][1]
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={country} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--color-text-secondary)] w-16 truncate">{country}</span>
                      <div className="flex-1 h-5 bg-white/[0.03] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)]/40 to-[var(--color-accent)]/30 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--color-text-primary)] font-medium w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">支付方式分布</h3>
            {overview.byPayment.length === 0 ? (
              <p className="text-xs text-[var(--color-text-placeholder)] text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {overview.byPayment.map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-primary)]">{method}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-info)]/40 transition-all duration-500"
                          style={{ width: `${(count / overview.totalOrders) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)] w-12 text-right">
                        {count} ({((count / overview.totalOrders) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* 人员绩效排行 */}
      {workload && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RankingTable
            title="客服绩效排行"
            items={workload.csRanking}
            columns={[
              { key: 'orders', label: '订单', format: (v) => `${v}单` },
              { key: 'revenue', label: '营收', format: (v) => `¥${Number(v).toLocaleString()}` },
            ]}
          />
          <RankingTable
            title="资料员工作负荷"
            items={workload.collectorWorkload}
            columns={[
              { key: 'orders', label: '接单', format: (v) => `${v}单` },
            ]}
          />
          <RankingTable
            title="操作员绩效"
            items={workload.operatorRanking}
            columns={[
              { key: 'orders', label: '处理', format: (v) => `${v}单` },
              { key: 'approvalRate', label: '出签率' },
            ]}
          />
        </div>
      )}
    </div>
  )
}
