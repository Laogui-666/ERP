'use client';

import { forwardRef, ReactNode } from 'react';
import { cn } from '@shared/lib/utils';

interface LiquidStatCardProps {
  label: string;
  value: string | number;
  sub?: string | undefined;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

const colorMap = {
  primary: {
    text: 'text-liquid-ocean',
    bg: 'bg-liquid-ocean/10',
    border: 'border-liquid-ocean/20',
    glow: 'shadow-liquid-ocean/20',
  },
  success: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/20',
  },
  warning: {
    text: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/20',
  },
  error: {
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/20',
  },
  info: {
    text: 'text-sky-600',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    glow: 'shadow-sky-500/20',
  },
  accent: {
    text: 'text-violet-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-violet-500/20',
  },
};

const LiquidStatCard = forwardRef<HTMLDivElement, LiquidStatCardProps>(
  ({ label, value, sub, color = 'primary', icon, trend, trendValue, className }, ref) => {
    const c = colorMap[color];

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5',
          'bg-white/60',
          'border border-white/50',
          'shadow-liquid-soft',
          'animate-enter-scale',
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
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-liquid-mist mb-2 tracking-wide uppercase font-medium">
                {label}
              </p>
              <p className={cn('text-2xl font-bold tracking-tight leading-none text-liquid-deep', c.text)}>
                {value}
              </p>
              {sub && (
                <p className="text-sm text-liquid-mist mt-1.5 leading-snug">
                  {sub}
                </p>
              )}
              {trend && trendValue && (
                <div className="flex items-center gap-1 mt-2">
                  {trend === 'up' && (
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  {trend === 'down' && (
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {trend === 'neutral' && (
                    <svg className="w-3.5 h-3.5 text-liquid-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    trend === 'up' && 'text-emerald-600',
                    trend === 'down' && 'text-red-500',
                    trend === 'neutral' && 'text-liquid-mist'
                  )}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            {icon && (
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3',
                  'bg-white/50 backdrop-blur-sm',
                  c.bg,
                  c.text,
                  'border border-white/30'
                )}
              >
                <span className="opacity-90">{icon}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

LiquidStatCard.displayName = 'LiquidStatCard';

export { LiquidStatCard };
