'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidPaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
  className?: string;
}

const LiquidPagination = forwardRef<HTMLDivElement, LiquidPaginationProps>(
  ({ current, total, pageSize = 20, onChange, className }, ref) => {
    const totalPages = Math.ceil(total / pageSize);
    
    if (totalPages <= 1) return null;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.medium}
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-t border-white/10',
          className
        )}
      >
        <span className="text-xs text-liquid-mist">
          第 <span className="text-liquid-deep font-medium">{current}</span> / {totalPages} 页 · 共 {total} 条
        </span>
        
        <div className="flex gap-2">
          <motion.button
            disabled={current <= 1}
            onClick={() => onChange(current - 1)}
            whileHover={current > 1 ? { scale: 1.05 } : {}}
            whileTap={current > 1 ? { scale: 0.95 } : {}}
            className={cn(
              'px-3 py-1.5 text-xs rounded-xl font-medium',
              'bg-white/60 backdrop-blur-xl text-liquid-deep',
              'border border-white/40',
              'shadow-liquid-soft',
              'transition-all duration-300',
              'hover:bg-white/70 hover:shadow-liquid-medium',
              'disabled:opacity-30 disabled:cursor-not-allowed'
            )}
          >
            上一页
          </motion.button>
          
          <motion.button
            disabled={current >= totalPages}
            onClick={() => onChange(current + 1)}
            whileHover={current < totalPages ? { scale: 1.05 } : {}}
            whileTap={current < totalPages ? { scale: 0.95 } : {}}
            className={cn(
              'px-3 py-1.5 text-xs rounded-xl font-medium',
              'bg-white/60 backdrop-blur-xl text-liquid-deep',
              'border border-white/40',
              'shadow-liquid-soft',
              'transition-all duration-300',
              'hover:bg-white/70 hover:shadow-liquid-medium',
              'disabled:opacity-30 disabled:cursor-not-allowed'
            )}
          >
            下一页
          </motion.button>
        </div>
      </motion.div>
    );
  }
);

LiquidPagination.displayName = 'LiquidPagination';

export { LiquidPagination };
