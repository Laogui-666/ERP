'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'
import { LiquidButton } from '@design-system/components/liquid-button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-morandi-light via-morandi-cream to-morandi-blush">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={liquidSpringConfig.gentle}
        >
          <div className="text-7xl font-bold text-morandi-ocean mb-2">404</div>
          <p className="text-lg text-morandi-mist mb-6">
            页面不存在或已被移除
          </p>
          <LiquidButton href="/" variant="primary" size="lg">
            返回首页
          </LiquidButton>
        </motion.div>
      </div>
    </div>
  )
}
