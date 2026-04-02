import { HeroBanner } from './hero-banner'
import { StatsCounter } from './stats-counter'
import { ToolGrid } from './tool-grid'
import { DestinationCarousel } from './destination-carousel'
import Link from 'next/link'

/**
 * Portal 首页 — Server Component 壳
 * 内部交互组件均为 Client Component，SEO 友好
 */
export function PortalHomePage() {
  return (
    <div className="relative">
      {/* Hero */}
      <HeroBanner />

      {/* 核心数据 */}
      <StatsCounter />

      {/* 6 大工具 */}
      <ToolGrid />

      {/* 热门目的地 */}
      <DestinationCarousel />

      {/* CTA 区域 */}
      <section className="px-4 py-12 text-center">
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">
          &ldquo;准备好了吗？让签证办理变得简单&rdquo;
        </p>
        <Link
          href="/register"
          className="glass-btn-primary group relative mt-5 inline-flex overflow-hidden px-8 py-3 text-[14px] font-semibold"
        >
          <span className="relative z-10">免费注册，立即体验 →</span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
            style={{
              animation: 'sweep 3s ease-in-out infinite',
              animationDelay: '2s',
            }}
          />
        </Link>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-white/[0.04] px-4 py-6 text-center">
        <p className="text-[11px] text-[var(--color-text-placeholder)] opacity-50">
          © 2026 华夏签证 · 关于我们 · 联系方式 · 隐私政策
        </p>
      </footer>
    </div>
  )
}
