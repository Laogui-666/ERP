'use client'

export function AppFooter() {
  return (
    <footer className="relative border-t border-white/[0.04] bg-[rgba(22,27,41,0.6)] backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 品牌 */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">华夏签证</h3>
            <p className="mt-1.5 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              专业签证，一站搞定
            </p>
            <div className="mt-4 flex gap-3">
              {['微信', '微博'].map((name) => (
                <div key={name} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-[var(--color-text-placeholder)] hover:bg-white/[0.08] transition-colors cursor-pointer">
                  {name[0]}
                </div>
              ))}
            </div>
          </div>

          {/* 签证服务 */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-placeholder)]">签证服务</h4>
            <ul className="mt-3 space-y-2">
              {['申根签证', '美国签证', '日本签证', '韩国签证', '泰国签证'].map((item) => (
                <li key={item}>
                  <span className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 智能工具 */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-placeholder)]">智能工具</h4>
            <ul className="mt-3 space-y-2">
              {['签证资讯', '行程助手', '申请表助手', '签证评估', '翻译助手'].map((item) => (
                <li key={item}>
                  <span className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 关于我们 */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-placeholder)]">关于</h4>
            <ul className="mt-3 space-y-2">
              {['关于我们', '联系方式', '隐私政策', '服务条款'].map((item) => (
                <li key={item}>
                  <span className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-10 border-t border-white/[0.04] pt-6 text-center">
          <p className="text-[11px] text-[var(--color-text-placeholder)]">
            © 2026 华夏签证 · 专业签证，一站搞定
          </p>
        </div>
      </div>
    </footer>
  )
}
