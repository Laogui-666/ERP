import Link from 'next/link'
import { GlassCard } from '@shared/ui/glass-card'

const TOOLS = [
  { name: '签证资讯', desc: '各国签证政策实时更新，出行无忧', href: '/portal/tools/news', color: 'from-blue-400/20 to-cyan-400/10', icon: '📰' },
  { name: '行程助手', desc: 'AI 智能规划旅行路线', href: '/portal/tools/itinerary', color: 'from-green-400/20 to-emerald-400/10', icon: '🗺️' },
  { name: '申请表助手', desc: '各国签证表智能填写，告别繁琐', href: '/portal/tools/form-helper', color: 'from-amber-400/20 to-orange-400/10', icon: '📝' },
  { name: '签证评估', desc: 'AI 评估通过率与拒签风险', href: '/portal/tools/assessment', color: 'from-purple-400/20 to-violet-400/10', icon: '🔍' },
  { name: '翻译助手', desc: '多语言即时翻译，精准专业', href: '/portal/tools/translator', color: 'from-pink-400/20 to-rose-400/10', icon: '🌐' },
  { name: '证明文件', desc: '在职证明、收入证明等一键生成', href: '/portal/tools/documents', color: 'from-indigo-400/20 to-blue-400/10', icon: '📄' },
]

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* 顶栏 */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] transition-colors hover:bg-white/[0.10]"
        >
          <svg className="h-4 w-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">智能工具箱</h1>
          <p className="text-[12px] text-[var(--color-text-secondary)]">华夏签证为你准备的旅行助手</p>
        </div>
      </div>

      {/* 工具卡片列表 */}
      <div className="space-y-3">
        {TOOLS.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <GlassCard
              intensity="medium"
              hover
              className="group flex items-center gap-4 rounded-2xl p-4 transition-all active:scale-[0.97]"
            >
              {/* 图标 */}
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-[22px]">{tool.icon}</span>
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {tool.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              {/* 箭头 */}
              <svg
                className="h-4 w-4 flex-shrink-0 text-[var(--color-text-placeholder)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-center">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          💡 所有工具均可免费使用
        </p>
        <p className="mt-1 text-[12px] text-[var(--color-text-placeholder)]">
          登录后可保存历史记录和偏好设置
        </p>
      </div>

      {/* 底部安全留白 */}
      <div className="h-4" />
    </div>
  )
}
