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
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">月度趋势</h3>
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          暂无数据
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-foreground mb-4">月度趋势</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              name="订单数"
              stroke="hsl(var(--info))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--info))', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="营收 (¥)"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--warning))', r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="profit"
              name="毛利 (¥)"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
