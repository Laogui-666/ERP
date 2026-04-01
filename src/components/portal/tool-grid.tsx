'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@shared/hooks/use-auth'
import { GlassCard } from '@shared/ui/glass-card'
import { Modal } from '@shared/ui/modal'
import { cn } from '@shared/lib/utils'

interface Tool {
  icon: string
  label: string
  desc: string
  href: string
}

const TOOLS: Tool[] = [
  { icon: '📰', label: '签证资讯', desc: '各国政策实时更新', href: '/portal/tools/news' },
  { icon: '🗺️', label: '行程助手', desc: 'AI 智能规划', href: '/portal/tools/itinerary' },
  { icon: '📝', label: '申请表', desc: '填写逐步引导', href: '/portal/tools/form-helper' },
  { icon: '🔍', label: '签证评估', desc: '通过率预测', href: '/portal/tools/assessment' },
  { icon: '🌐', label: '翻译助手', desc: '证件翻译', href: '/portal/tools/translator' },
  { icon: '📄', label: '证明文件', desc: '模板生成', href: '/portal/tools/documents' },
]

export function ToolGrid() {
  const { user } = useAuth()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleToolClick = (href: string) => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    router.push(href)
  }

  return (
    <>
      <div id="tools" ref={ref} className="px-4 py-8">
        <h2
          className={cn(
            'mb-5 text-[18px] font-semibold text-[var(--color-text-primary)] transition-all duration-500',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          旅行工具箱
        </h2>

        <div className="mx-auto grid max-w-lg grid-cols-2 gap-3">
          {TOOLS.map((tool, i) => (
            <button
              key={tool.label}
              onClick={() => handleToolClick(tool.href)}
              className={cn(
                'group text-left transition-all duration-500',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <GlassCard
                intensity="light"
                className="relative overflow-hidden p-5 transition-all duration-300 group-hover:-translate-y-1 group-active:scale-[0.98]"
              >
                {/* hover sweep 光效 */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />

                <span className="text-2xl transition-transform duration-300 group-hover:scale-110 inline-block">
                  {tool.icon}
                </span>
                <p className="mt-2 text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {tool.label}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                  {tool.desc}
                </p>
              </GlassCard>
            </button>
          ))}
        </div>
      </div>

      {/* 未登录提示弹窗 */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <div className="p-6 text-center">
          <span className="text-3xl">🔐</span>
          <h3 className="mt-3 text-[16px] font-semibold text-[var(--color-text-primary)]">
            请先登录
          </h3>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            登录后即可使用全部旅行工具
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setShowLoginModal(false)}
              className="glass-btn-secondary flex-1 py-2 text-[13px]"
            >
              取消
            </button>
            <button
              onClick={() => router.push('/login')}
              className="glass-btn-primary flex-1 py-2 text-[13px] font-semibold"
            >
              去登录
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
