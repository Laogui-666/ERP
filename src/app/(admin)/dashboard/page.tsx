export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 欢迎 */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          经营驾驶舱
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          实时掌握业务运营状况
        </p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <StatCard
          title="总营收"
          value="¥0"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="primary"
        />
        <StatCard
          title="总订单"
          value="0"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="info"
        />
        <StatCard
          title="进行中"
          value="0"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="warning"
        />
        <StatCard
          title="出签率"
          value="--"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="success"
        />
      </div>

      {/* 快捷操作 */}
      <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/admin/orders" label="订单管理" icon="📋" />
          <QuickAction href="/admin/pool" label="公共池" icon="🏊" />
          <QuickAction href="/admin/team" label="团队管理" icon="👥" />
          <QuickAction href="/admin/analytics" label="数据统计" icon="📊" />
        </div>
      </div>

      {/* 工作流说明 */}
      <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">核心工作流</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: '客服录单', color: 'bg-[var(--color-info)]/20 text-[var(--color-info)]' },
            { label: '资料员接单', color: 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]' },
            { label: '资料收集', color: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]' },
            { label: '操作员审核', color: 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' },
            { label: '材料制作', color: 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]' },
            { label: '交付客户', color: 'bg-[var(--color-success)]/20 text-[var(--color-success)]' },
            { label: '出签/拒签', color: 'bg-[var(--color-success)]/20 text-[var(--color-success)]' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${step.color}`}>
                {step.label}
              </span>
              {i < arr.length - 1 && (
                <svg className="w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: React.ReactNode
  color: 'primary' | 'info' | 'warning' | 'success'
}) {
  const colorMap = {
    primary: 'from-[var(--color-primary)]/15 to-[var(--color-primary)]/5 text-[var(--color-primary-light)]',
    info: 'from-[var(--color-info)]/15 to-[var(--color-info)]/5 text-[var(--color-info)]',
    warning: 'from-[var(--color-warning)]/15 to-[var(--color-warning)]/5 text-[var(--color-warning)]',
    success: 'from-[var(--color-success)]/15 to-[var(--color-success)]/5 text-[var(--color-success)]',
  }

  return (
    <div className="glass-card-static p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-text-secondary)]">{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</div>
    </div>
  )
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-200 group"
    >
      <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">{label}</span>
    </a>
  )
}
