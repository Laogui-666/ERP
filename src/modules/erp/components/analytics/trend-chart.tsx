'use client'

import { GlassCard } from '@shared/ui/glass-card'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface TrendData {
  month: string
  orders: number
  revenue: number
  profit: number
  approved: number
  rejected: number
}

interface TrendChartProps {
  data: TrendData[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">月度趋势</h3>
        <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-placeholder)]">
          暂无数据
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">月度趋势</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#8E99A8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#8E99A8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#8E99A8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(26, 31, 46, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#E8ECF1',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#8E99A8' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              name="订单数"
              stroke="#7CA8B8"
              strokeWidth={2}
              dot={{ fill: '#7CA8B8', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="营收 (¥)"
              stroke="#C4A97D"
              strokeWidth={2}
              dot={{ fill: '#C4A97D', r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="profit"
              name="毛利 (¥)"
              stroke="#7FA87A"
              strokeWidth={2}
              dot={{ fill: '#7FA87A', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
