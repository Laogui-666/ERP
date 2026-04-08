'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidPoolCardProps {
  orderNo: string;
  customerName: string;
  status: ReactNode;
  country: string;
  visaType: string;
  amount: number;
  createdAt: string;
  isClaiming?: boolean;
  className?: string;
  onClaim?: () => void;
  delay?: number;
}

const LiquidPoolCard = forwardRef<HTMLDivElement, LiquidPoolCardProps>(
  ({ 
    orderNo, 
    customerName,
    status, 
    country, 
    visaType, 
    amount,
    createdAt,
    isClaiming = false,
    className,
    onClaim,
    delay = 0
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.medium, delay: delay * 0.05 }}
        whileHover={{ y: -4, scale: 1.01 }}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5',
          'bg-white/60 backdrop-blur-xl',
          'border border-white/50',
          'shadow-liquid-soft',
          'transition-all duration-300',
          'hover:shadow-liquid-medium',
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
          {/* 订单头部 */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-mono text-liquid-ocean">{orderNo}</span>
              <h3 className="text-base font-semibold text-liquid-deep mt-1">
                {customerName}
              </h3>
            </div>
            {status}
          </div>

          {/* 信息 */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-2 text-sm">
              <motion.div 
                className="w-8 h-8 rounded-lg bg-liquid-ocean/10 flex items-center justify-center text-liquid-ocean"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={liquidSpringConfig.snappy}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </motion.div>
              <span className="text-liquid-deep font-medium">{country}</span>
              <span className="text-liquid-silver">·</span>
              <span className="text-liquid-mist">{visaType}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <motion.div 
                className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={liquidSpringConfig.snappy}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <span className="text-liquid-deep font-semibold">¥{amount.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-liquid-silver">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {createdAt}
            </div>
          </div>

          {/* 接单按钮 */}
          <motion.button
            onClick={onClaim}
            disabled={isClaiming}
            whileHover={{ scale: isClaiming ? 1 : 1.02 }}
            whileTap={{ scale: isClaiming ? 1 : 0.98 }}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-semibold',
              'bg-liquid-ocean text-white',
              'shadow-lg shadow-liquid-ocean/25',
              'transition-all duration-300',
              'hover:bg-liquid-ocean/90 hover:shadow-liquid-ocean/35',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'relative overflow-hidden'
            )}
          >
            {/* 按钮光泽效果 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
            
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isClaiming ? (
                <>
                  <motion.span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  接单中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  立即接单
                </>
              )}
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  }
);

LiquidPoolCard.displayName = 'LiquidPoolCard';

export { LiquidPoolCard };
