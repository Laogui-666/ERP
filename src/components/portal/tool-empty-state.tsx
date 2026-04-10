'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

interface ToolEmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function ToolEmptyState({ icon, title, description, action }: ToolEmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center gap-4 p-12 rounded-3xl bg-gradient-to-br from-glass-card/80 to-glass-card/40 backdrop-blur-xl border border-glass-border shadow-lg shadow-glass-primary/5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={liquidSpringConfig.gentle}
    >
      <motion.span 
        className="text-5xl"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.span>
      <p className="text-lg font-semibold text-glass-primary">{title}</p>
      <p className="text-sm text-glass-muted text-center max-w-sm">{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  )
}
