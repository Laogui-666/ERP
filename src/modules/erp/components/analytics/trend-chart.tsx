'use client'

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
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-glass-primary mb-4">月度趋势</h3>
        <div className="h-64 flex items-center justify-center text-sm text-glass-muted">
          暂无数据
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-glass-primary mb-4">月度趋势</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              name="订单数"
              stroke="#88A8BF"
              strokeWidth={2}
              dot={{ fill: '#88A8BF', r: 3 }}
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
    </div>
  )
}
