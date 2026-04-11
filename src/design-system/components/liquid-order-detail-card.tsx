'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidOrderDetailCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  delay?: number;
}

const LiquidOrderDetailCard = forwardRef<HTMLDivElement, LiquidOrderDetailCardProps>(
  ({ title, icon, children, action, className, delay = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.medium, delay: delay * 0.05 }}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-white/60 backdrop-blur-xl',
          'border border-white/50',
          'shadow-liquid-soft',
          className
        )}
      >
        {/* 顶部光泽效果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/15 to-transparent rounded-t-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {/* 内容层 */}
        <div className="relative z-10 p-5">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-liquid-deep flex items-center gap-2">
              {icon && (
                <span className="text-liquid-ocean">{icon}</span>
              )}
              {title}
            </h3>
            {action && <div>{action}</div>}
          </div>

          {/* 内容 */}
          {children}
        </div>
      </motion.div>
    );
  }
);

LiquidOrderDetailCard.displayName = 'LiquidOrderDetailCard';

export { LiquidOrderDetailCard };
