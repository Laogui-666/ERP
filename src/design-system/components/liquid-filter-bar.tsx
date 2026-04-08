'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface FilterOption {
  value: string;
  label: string;
}

interface LiquidFilterBarProps {
  filters: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  extra?: ReactNode;
  className?: string;
}

const LiquidFilterBar = forwardRef<HTMLDivElement, LiquidFilterBarProps>(
  ({ filters, searchValue, onSearchChange, onSearch, extra, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.medium}
        className={cn(
          'flex flex-wrap items-center gap-3 p-4',
          'bg-white/40 backdrop-blur-xl',
          'border border-white/30',
          'rounded-2xl',
          'shadow-liquid-soft',
          className
        )}
      >
        {/* 筛选器 */}
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <span className="text-xs text-liquid-mist whitespace-nowrap">{filter.label}</span>
            <motion.select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              whileHover={{ scale: 1.02 }}
              className={cn(
                'px-3 py-2 rounded-xl text-xs',
                'bg-white/60 backdrop-blur-sm',
                'border border-white/40',
                'text-liquid-deep',
                'focus:outline-none focus:border-liquid-ocean/50',
                'transition-all duration-200',
                'cursor-pointer',
                'min-w-[100px]'
              )}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </motion.select>
          </div>
        ))}

        {/* 搜索框 */}
        {onSearchChange && (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
                placeholder="搜索订单号/客户名/手机号..."
                className={cn(
                  'w-full px-4 py-2 pl-9 rounded-xl text-xs',
                  'bg-white/60 backdrop-blur-sm',
                  'border border-white/40',
                  'text-liquid-deep placeholder:text-liquid-silver',
                  'focus:outline-none focus:border-liquid-ocean/50 focus:bg-white/70',
                  'transition-all duration-200'
                )}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-liquid-silver"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {onSearch && (
              <motion.button
                onClick={onSearch}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-medium',
                  'bg-liquid-ocean text-white',
                  'shadow-lg shadow-liquid-ocean/20',
                  'hover:bg-liquid-ocean/90 hover:shadow-liquid-ocean/30',
                  'transition-all duration-200'
                )}
              >
                查询
              </motion.button>
            )}
          </div>
        )}

        {/* 额外内容 */}
        {extra && <div className="ml-auto">{extra}</div>}
      </motion.div>
    );
  }
);

LiquidFilterBar.displayName = 'LiquidFilterBar';

export { LiquidFilterBar };
