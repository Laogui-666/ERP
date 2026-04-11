'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidOrderCardProps {
  orderNo: string;
  status: ReactNode;
  country: string;
  visaType: string;
  createdAt: string;
  applicantCount?: number;
  hint?: string | null;
  progressStep?: number;
  isTerminal?: boolean;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

const STEP_LABELS = ['待对接', '已对接', '资料收集', '审核', '制作', '交付'];

const LiquidOrderCard = forwardRef<HTMLDivElement, LiquidOrderCardProps>(
  ({ 
    orderNo, 
    status, 
    country, 
    visaType, 
    createdAt,
    applicantCount = 1,
    hint = null,
    progressStep = 0,
    isTerminal = false,
    className,
    onClick,
    delay = 0
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.medium, delay: delay * 0.05 }}

        onClick={onClick}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5',
          'bg-white/60 backdrop-blur-xl',
          'border border-white/50',
          'shadow-liquid-soft',
          'cursor-pointer',
          className
        )}
      >
        {/* 顶部光泽效果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/15 to-transparent rounded-t-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {/* 内容层 */}
        <div className="relative z-10">
          {/* 订单号 + 状态 */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-liquid-ocean">
                {orderNo}
              </span>
              {applicantCount > 1 && (
                <motion.span 
                  className="text-[10px] px-1.5 py-0.5 rounded-lg bg-violet-500/15 text-violet-600 border border-violet-500/20"
                  whileHover={{ scale: 1.05 }}
                >
                  👥 {applicantCount}人
                </motion.span>
              )}
            </div>
            {status}
          </div>

          {/* 签证信息 */}
          <div className="space-y-1.5 mb-3 text-sm">
            <div className="flex items-center gap-2 text-liquid-mist">
              <span>🌍</span>
              <span className="text-liquid-deep">{country}</span>
              <span className="text-liquid-silver">·</span>
              <span>{visaType}</span>
            </div>
            <div className="flex items-center gap-2 text-liquid-silver text-xs">
              <span>创建于 {createdAt}</span>
            </div>
          </div>

          {/* 状态流程指示 */}
          <div className="flex items-center gap-1 text-xs">
            {STEP_LABELS.map((_, si) => {
              const isDone = isTerminal || (progressStep >= 0 && si <= progressStep);
              return (
                <div key={si} className="flex items-center gap-1">
                  <motion.span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium',
                      isDone
                        ? 'bg-liquid-ocean text-white'
                        : 'bg-white/30 text-liquid-silver border border-white/30'
                    )}
                    whileHover={isDone ? { scale: 1.1 } : {}}
                  >
                    {si + 1}
                  </motion.span>
                  {si < STEP_LABELS.length - 1 && (
                    <div
                      className={cn(
                        'h-px w-4',
                        isDone && si < (isTerminal ? STEP_LABELS.length : progressStep)
                          ? 'bg-liquid-ocean'
                          : 'bg-white/20'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 待办提示 */}
          {hint && (
            <motion.div 
              className="mt-3 px-3 py-2 rounded-xl bg-liquid-ocean/10 border border-liquid-ocean/20 text-xs text-liquid-ocean font-medium"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={liquidSpringConfig.snappy}
            >
              {hint}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
);

LiquidOrderCard.displayName = 'LiquidOrderCard';

export { LiquidOrderCard };
