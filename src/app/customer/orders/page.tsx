export default function CustomerOrdersPage() {
  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        我的订单
      </h2>

      {/* 当前订单卡片示例 */}
      <div className="glass-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[var(--color-info)] font-medium">
            🇫🇷 法国旅游签证
          </span>
          <span className="rounded-full bg-[var(--color-warning)]/20 px-3 py-1 text-xs text-[var(--color-warning)]">
            资料收集中
          </span>
        </div>

        <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
          订单号: V20260320001
        </p>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>资料进度</span>
            <span>3/6 项</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--color-primary)]"
              style={{ width: '50%' }}
            />
          </div>
        </div>

        {/* 状态流程条 */}
        <div className="flex items-center gap-1 text-xs">
          {['已对接', '资料收集中', '待审核', '制作中', '交付'].map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  i <= 1
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white/10 text-[var(--color-text-placeholder)]'
                }`}
              >
                {i + 1}
              </span>
              {i < 4 && (
                <div
                  className={`h-px w-6 ${
                    i < 1 ? 'bg-[var(--color-primary)]' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 空状态 */}
      <div className="glass-card p-8 text-center">
        <p className="text-[var(--color-text-placeholder)]">
          暂无更多订单
        </p>
      </div>
    </div>
  )
}
