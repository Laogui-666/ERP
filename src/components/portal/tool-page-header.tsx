'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

interface ToolPageHeaderProps {
  icon: string
  title: string
  description: string
}

export function ToolPageHeader({ icon, title, description }: ToolPageHeaderProps) {
  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={liquidSpringConfig.gentle}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <h1 className="text-2xl md:text-3xl font-bold text-liquid-deep">
          {title}
        </h1>
      </div>
      <p className="text-base text-liquid-mist max-w-2xl">
        {description}
      </p>
    </motion.div>
  )
}
