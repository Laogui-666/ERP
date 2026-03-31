// M7 Phase 1: Portal 首页占位（Phase 2 将替换为完整 Hero + 工具网格 + 数据统计）
// 此文件为 Server Component，SEO 友好
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 backdrop-blur-xl border border-white/10 shadow-lg shadow-[var(--color-primary)]/10">
          <span className="text-2xl">🌊</span>
        </div>

        <h1 className="text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
          沐海旅行
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
          一站式签证服务平台
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-text-placeholder)]">
          资讯 · 行程 · 评估 · 办理
        </p>

        {/* 快捷入口 */}
        <div className="mt-10 grid grid-cols-2 gap-3">
          <Link
            href="/login"
            className="glass-btn-primary py-3 text-center text-[14px] font-semibold"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="glass-btn-secondary py-3 text-center text-[14px] font-semibold"
          >
            注册
          </Link>
        </div>

        {/* 工具预览 */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { icon: '📰', label: '签证资讯' },
            { icon: '🗺️', label: '行程助手' },
            { icon: '📝', label: '申请表' },
            { icon: '🔍', label: '签证评估' },
            { icon: '🌐', label: '翻译助手' },
            { icon: '📄', label: '证明文件' },
          ].map((tool) => (
            <Link
              key={tool.label}
              href="/login"
              className="glass-card-light flex flex-col items-center gap-2 p-4 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              <span className="text-2xl">{tool.icon}</span>
              <span className="text-[12px] text-[var(--color-text-secondary)]">{tool.label}</span>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-[11px] text-[var(--color-text-placeholder)] opacity-50">
          © 2026 沐海旅行
        </p>
      </div>
    </div>
  )
}
