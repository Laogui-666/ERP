'use client'

import { useAuth } from '@shared/hooks/use-auth'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'
import { LiquidButton } from '@design-system/components/liquid-button'

export default function ForbiddenPage() {
  const { user } = useAuth()
  const homeHref = user?.role === 'CUSTOMER' ? '/' : '/admin/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-morandi-light via-morandi-cream to-morandi-blush">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={liquidSpringConfig.gentle}
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-morandi-ocean/20 border border-morandi-ocean/30">
            <svg className="w-10 h-10 text-morandi-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 00-8 0v4h8zm-8 0H4a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-morandi-deep mb-2">403</h1>
          <p className="text-lg text-morandi-mist mb-6">无权访问此页面</p>
          <p className="text-sm text-morandi-mist/60 mb-8">
            您的角色权限不足，无法访问该资源。<br />
            如需帮助，请联系管理员。
          </p>
          <LiquidButton href={homeHref} variant="primary" size="lg">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            返回首页
          </LiquidButton>
        </motion.div>
      </div>
    </div>
  )
}
