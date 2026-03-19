export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        经营驾驶舱
      </h1>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '总营收', value: '¥0', icon: '💰' },
          { label: '总订单', value: '0', icon: '📊' },
          { label: '出签率', value: '0%', icon: '✅' },
          { label: '进行中', value: '0', icon: '⏳' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图 + 状态分布 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            接单量趋势
          </h3>
          <div className="flex h-48 items-center justify-center text-[var(--color-text-placeholder)]">
            📈 图表区域（待接入图表库）
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            状态分布
          </h3>
          <div className="flex h-48 items-center justify-center text-[var(--color-text-placeholder)]">
            🍩 饼图区域（待接入图表库）
          </div>
        </div>
      </div>

      {/* 异常监控 */}
      <div className="glass-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          异常监控
        </h3>
        <div className="flex h-32 items-center justify-center text-[var(--color-text-placeholder)]">
          暂无异常订单
        </div>
      </div>
    </div>
  )
}
