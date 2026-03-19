export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* 客户端顶部导航 */}
      <header className="glass-topbar sticky top-0 z-50 px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            沐海旅行
          </h1>
          <div className="flex items-center gap-3">
            <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              🔔
            </button>
            <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              👤
            </button>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="mx-auto max-w-lg px-4 py-4">
        {children}
      </main>

      {/* 底部Tab栏 */}
      <nav className="glass-topbar fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {[
            { icon: '🏠', label: '首页' },
            { icon: '📋', label: '订单' },
            { icon: '💬', label: '消息' },
            { icon: '👤', label: '我的' },
          ].map((tab) => (
            <button
              key={tab.label}
              className="flex flex-col items-center gap-1 px-4 py-1"
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
