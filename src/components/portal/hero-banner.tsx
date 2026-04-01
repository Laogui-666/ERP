'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'
import { cn } from '@shared/lib/utils'

const TITLE_WORDS = ['一', '站', '式', ' ', '签', '证', '服', '务', '平', '台']

export function HeroBanner() {
  const { user } = useAuth()
  const [visibleWords, setVisibleWords] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleWords((prev) => {
        if (prev >= TITLE_WORDS.length) {
          clearInterval(timer)
          return prev
        }
        return prev + 1
      })
    }, 100)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 pt-14">
      {/* Hero 标题 */}
      <div className="text-center">
        <h1 className="flex flex-wrap items-center justify-center text-[32px] font-bold tracking-wider text-[var(--color-text-primary)] leading-tight">
          {TITLE_WORDS.map((word, i) => (
            <span
              key={i}
              className={cn(
                'inline-block transition-all duration-500',
                i < visibleWords
                  ? 'opacity-100 translate-y-0 scale-100 blur-0'
                  : 'opacity-0 translate-y-3 scale-95 blur-sm'
              )}
              style={{
                transitionDelay: `${i * 50}ms`,
                minWidth: word === ' ' ? '0.3em' : undefined,
              }}
            >
              {word === ' ' ? '\u00A0' : word}
            </span>
          ))}
        </h1>

        {/* 底部光带 */}
        <div className="relative mx-auto mt-4 h-[2px] overflow-hidden">
          <div
            className="absolute inset-0 mx-auto rounded-full bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent"
            style={{ animation: 'glowPulse 4s ease-in-out infinite' }}
          />
        </div>

        {/* 副标题 */}
        <p
          className={cn(
            'mt-4 text-[14px] text-[var(--color-text-secondary)] transition-all duration-700',
            visibleWords >= TITLE_WORDS.length
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
          style={{ transitionDelay: '200ms' }}
        >
          资讯 · 行程 · 评估 · 办理 — 从了解到出发，全程陪伴
        </p>

        {/* CTA 按钮 */}
        <div
          className={cn(
            'mt-8 flex items-center justify-center gap-3 transition-all duration-700',
            visibleWords >= TITLE_WORDS.length
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
          style={{ transitionDelay: '400ms' }}
        >
          <Link
            href={user ? '/portal/orders' : '/register'}
            className="glass-btn-primary group relative overflow-hidden px-6 py-3 text-[14px] font-semibold"
          >
            <span className="relative z-10">开始探索 →</span>
            {/* sweep 光效 */}
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
              style={{
                animation: 'sweep 3s ease-in-out infinite',
                animationDelay: '1s',
              }}
            />
          </Link>
          <Link
            href="#tools"
            className="glass-btn-secondary px-6 py-3 text-[14px] font-medium"
          >
            了解详情
          </Link>
        </div>
      </div>
    </section>
  )
}
