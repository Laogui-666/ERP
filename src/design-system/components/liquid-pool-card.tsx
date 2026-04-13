'use client';

import { forwardRef, ReactNode } from 'react';
import { cn } from '@shared/lib/utils';

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
    onClaim
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5',
          'bg-white/60',
          'border border-white/50',
          'shadow-liquid-soft',
          'card-hover animate-enter-slide-up',
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
              <div 
                className="w-8 h-8 rounded-lg bg-liquid-ocean/10 flex items-center justify-center text-liquid-ocean"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-liquid-deep font-medium">{country}</span>
              <span className="text-liquid-silver">·</span>
              <span className="text-liquid-mist">{visaType}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div 
                className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
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
          <button
            onClick={onClaim}
            disabled={isClaiming}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-semibold',
              'bg-liquid-ocean text-white',
              'shadow-lg shadow-liquid-ocean/25',
              'button-hover',
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
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
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
          </button>
        </div>
      </div>
    );
  }
);

LiquidPoolCard.displayName = 'LiquidPoolCard';

export { LiquidPoolCard };
