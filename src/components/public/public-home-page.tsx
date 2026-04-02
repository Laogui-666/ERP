'use client'

import Link from 'next/link'

/**
 * 盼达旅行 - 品牌首页
 * 公开浏览，所有用户可见
 */
export function PublicHomePage() {
  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-accent)]/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-primary)]/20 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] animate-fade-in-up">
              <span className="bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-primary-light)] to-[var(--color-accent)] bg-clip-text text-transparent">
                四海无界，一站畅游
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up delay-100">
              一站式服务，轻松出境自由行。为您的出境自由行提供专业的签证服务。
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
              <Link
                href="/register"
                className="glass-btn-primary group relative px-8 py-3 text-[15px] font-semibold overflow-hidden"
              >
                <span className="relative z-10">免费注册，立即体验</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent animate-sweep" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 text-[15px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-white/[0.1] rounded-xl hover:bg-white/[0.05] transition-all"
              >
                联系我们咨询
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50+', label: '热门国家' },
              { value: '10K+', label: '用户服务' },
              { value: '99%+', label: '成功率' },
              { value: '7×24h', label: '在线客服' },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-3xl sm:text-4xl font-bold text-[var(--color-primary-light)]">
                  {stat.value}
                </div>
                <div className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Destinations */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
              热门目的地
            </h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
精选热门国家，快速出签
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: '日本电子签', price: '¥599', flag: '🗾', color: 'from-pink-400/20 to-rose-400/20' },
              { name: '韩国电子签', price: '¥399', flag: '🇰🇷', color: 'from-blue-400/20 to-indigo-400/20' },
              { name: '申根签证', price: '¥358', flag: '🇪🇺', color: 'from-blue-500/20 to-cyan-400/20' },
              { name: '英国标准签', price: '¥1299', flag: '🇬🇧', color: 'from-red-400/20 to-orange-400/20' },
              { name: '澳大利亚', price: '¥1399', flag: '🇦🇺', color: 'from-green-400/20 to-teal-400/20' },
              { name: '加拿大签', price: '¥1099', flag: '🇨🇦', color: 'from-red-500/20 to-rose-400/20' },
              { name: '美国十年签', price: '¥1599', flag: '🇺🇸', color: 'from-blue-600/20 to-blue-400/20' },
              { name: '越南电子签', price: '¥299', flag: '🇻🇳', color: 'from-yellow-400/20 to-orange-400/20' },
              { name: '马来西亚', price: '¥280', flag: '🇲🇾', color: 'from-slate-400/20 to-blue-400/20' },
              { name: '泰国落地签', price: '¥299', flag: '🇹🇭', color: 'from-purple-400/20 to-pink-400/20' },
            ].map((dest, i) => (
              <Link
                key={dest.name}
                href={`/services?destination=${i + 1}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br border border-white/[0.08] hover:border-[var(--color-primary)]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--color-primary)]/10"
                style={{
                  background: `linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.05), rgba(var(--color-accent-rgb), 0.05))`,
                }}
              >
                <div className="aspect-[4/5] flex flex-col p-4">
                  <div className="flex-1 flex items-center justify-center text-5xl">
                    {dest.flag}
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
                      {dest.name}
                    </div>
                    <div className="mt-1 text-[15px] font-bold text-[var(--color-primary-light)]">
                      {dest.price}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gradient-to-b from-transparent via-[var(--color-primary)]/[0.03] to-transparent">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
              选择您需要的服务
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { 
                name: '签证评估', 
                desc: 'AI 评估您的签证通过率', 
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                status: '即将上线',
                href: '/assessment',
                soon: true
              },
              { 
                name: '一键翻译', 
                desc: '快速精准的多语言翻译', 
                icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
                status: 'NEW',
                href: '/translation',
                soon: false
              },
              { 
                name: '证明文件', 
                desc: '在职/在读证明文件生成', 
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                status: 'NEW',
                href: '/proofs',
                soon: false
              },
              { 
                name: '申请表助手', 
                desc: '智能填写各国签证申请表', 
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
                status: 'NEW',
                href: '/services/visa',
                soon: false
              },
              { 
                name: '行程规划', 
                desc: '智能规划您的旅行路线', 
                icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
                status: '即将上线',
                href: '/itinerary',
                soon: true
              },
            ].map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  service.soon 
                    ? 'border-white/[0.08] bg-white/[0.02] cursor-not-allowed opacity-70' 
                    : 'border-white/[0.08] hover:border-[var(--color-primary)]/30 hover:bg-white/[0.03] hover:shadow-lg hover:shadow-[var(--color-primary)]/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${
                    service.soon 
                      ? 'bg-white/[0.05]' 
                      : 'bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/15 transition-colors'
                  }`}>
                    <svg className={`w-5 h-5 ${service.soon ? 'text-[var(--color-text-placeholder)]' : 'text-[var(--color-primary-light)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={service.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {service.name}
                      </h3>
                      {service.status === 'NEW' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] line-clamp-2">
                      {service.desc}
                    </p>
                  </div>
                </div>
                {service.soon && (
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-white/[0.05] text-[var(--color-text-placeholder)] rounded-full">
                    {service.status}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            准备好了吗？
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)] max-w-xl mx-auto">
            让签证办理变得简单从容
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-primary)]/20"
            >
              开始办理
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-accent)]/20">
                  <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[15px] font-bold text-[var(--color-text-primary)]">盼达旅行</span>
              </div>
              <p className="mt-3 text-[13px] text-[var(--color-text-secondary)]">
                四海无界，一站畅游
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">产品服务</h4>
              <ul className="space-y-2">
                {['一键翻译', '签证资讯', '行程规划', '签证评估'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">关于我们</h4>
              <ul className="space-y-2">
                {['关于我们', '联系我们', '隐私政策', '服务条款'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">帮助支持</h4>
              <ul className="space-y-2">
                {['帮助中心', '常见问题', '使用指南'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/[0.04] text-center">
            <p className="text-[12px] text-[var(--color-text-placeholder)] opacity-50">
              © 2024 盼达旅行. All rights reserved. | 战略合作伙伴：华夏国际旅行社
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
