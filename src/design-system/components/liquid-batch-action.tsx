'use client';

import { forwardRef, ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface BatchAction {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
}

interface LiquidBatchActionProps {
  selectedCount: number;
  actions: BatchAction[];
  onAction: (actionKey: string) => void;
  onClear: () => void;
  className?: string;
}

const LiquidBatchAction = forwardRef<HTMLDivElement, LiquidBatchActionProps>(
  ({ selectedCount, actions, onAction, onClear, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    if (selectedCount === 0) return null;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={liquidSpringConfig.medium}
        className={cn(
          'flex items-center justify-between gap-4 p-4',
          'bg-liquid-ocean/5 backdrop-blur-xl',
          'border border-liquid-ocean/20',
          'rounded-2xl',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold',
              'bg-liquid-ocean text-white'
            )}
          >
            已选 {selectedCount} 项
          </motion.span>
          <motion.button
            onClick={onClear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs text-liquid-mist hover:text-liquid-deep transition-colors"
          >
            取消选择
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-liquid-mist">批量操作：</span>
          
          {/* 下拉菜单 */}
          <div className="relative">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs',
                'bg-white/60 backdrop-blur-sm',
                'border border-white/40',
                'text-liquid-deep',
                'hover:bg-white/70',
                'transition-all duration-200'
              )}
            >
              选择操作
              <svg
                className={cn('w-3 h-3 transition-transform duration-200', isOpen && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={liquidSpringConfig.snappy}
                  className={cn(
                    'absolute right-0 top-full mt-2 z-50',
                    'min-w-[140px]',
                    'bg-white/80 backdrop-blur-xl',
                    'border border-white/40',
                    'rounded-xl',
                    'shadow-liquid-medium',
                    'overflow-hidden'
                  )}
                >
                  {actions.map((action) => (
                    <motion.button
                      key={action.key}
                      onClick={() => {
                        onAction(action.key);
                        setIsOpen(false);
                      }}
                      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-xs',
                        'text-left',
                        action.danger ? 'text-red-500' : 'text-liquid-deep',
                        'transition-colors'
                      )}
                    >
                      {action.icon}
                      {action.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }
);

LiquidBatchAction.displayName = 'LiquidBatchAction';

export { LiquidBatchAction };
