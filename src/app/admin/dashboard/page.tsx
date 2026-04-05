'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { StatCard } from '@erp/components/analytics/stat-card'

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

  return (
    <div className="space-y-6">
      {/* 欢迎 */}
      <div className="anim-initial animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          经营驾驶舱
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.month} 实时数据` : '实时掌握业务运营状况'}
        </p>
      </div>

      {/* 核心指标卡片 - 交错入场 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="anim-initial animate-fade-in-up delay-50">
          <StatCard
            label="总营收"
            value={revenue}
            {...(data ? { sub: `毛利 ¥${data.totalProfit.toLocaleString()} (${data.profitRate})` } : {})}
            color="primary"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
        <div className="anim-initial animate-fade-in-up delay-100">
          <StatCard
            label="总订单"
            value={orders}
            {...(data ? { sub: `${data.totalApplicants} 位申请人` } : {})}
            color="info"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>
        <div className="anim-initial animate-fade-in-up delay-150">
          <StatCard
            label="进行中"
            value={inProgress}
            {...(data ? { sub: `已出签 ${data.approved} / 拒签 ${data.rejected}` } : {})}
            color="warning"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
        <div className="anim-initial animate-fade-in-up delay-200">
          <StatCard
            label="出签率"
            value={approvalRate}
            color="success"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-card rounded-xl border border-border p-5 anim-initial animate-fade-in-up delay-250">
        <h2 className="text-sm font-semibold text-foreground mb-4 tracking-wide">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/admin/orders" label="订单管理" icon="📋" delay={0} />
          <QuickAction href="/admin/pool" label="公共池" icon="🏊" delay={50} />
          <QuickAction href="/admin/team" label="团队管理" icon="👥" delay={100} />
          <QuickAction href="/admin/analytics" label="数据统计" icon="📊" delay={150} />
        </div>
      </div>

      {/* 工作流说明 */}
      <div className="bg-card rounded-xl border border-border p-5 anim-initial animate-fade-in-up delay-300">
        <h2 className="text-sm font-semibold text-foreground mb-4 tracking-wide">核心工作流</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {
            [
              { label: '客服录单', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
              { label: '资料员接单', color: 'bg-primary/10 text-primary' },
              { label: '资料收集', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
              { label: '操作员审核', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
              { label: '材料制作', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400' },
              { label: '交付客户', color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
              { label: '出签/拒签', color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${step.color} transition-transform duration-200 hover:scale-105`}>
                  {step.label}
                </span>
                {i < arr.length - 1 && (
                  <svg className="w-3.5 h-3.5 text-muted-foreground opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, label, icon, delay = 0 }: { href: string; label: string; icon: string; delay?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-card border border-border transition-all duration-300 group active:scale-95 hover:bg-accent hover:border-border hover:shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-lg transition-transform duration-300 group-hover:scale-110 group-active:scale-95">{icon}</span>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </Link>
  )
}
