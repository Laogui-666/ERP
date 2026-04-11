'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';
import { LiquidRoleBadge } from './liquid-role-badge';

interface LiquidTeamCardProps {
  name: string;
  role: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  department?: string | undefined;
  email?: string | null | undefined;
  className?: string;
  delay?: number;
}

const LiquidTeamCard = forwardRef<HTMLDivElement, LiquidTeamCardProps>(
  ({ name, role, phone, status, department, email, className, delay = 0 }, ref) => {
    const isActive = status === 'ACTIVE';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.medium, delay: delay * 0.05 }}

        className={cn(
          'relative overflow-hidden rounded-2xl p-4',
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
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* 头像 */}
            <motion.div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-base font-semibold shrink-0',
                'bg-liquid-ocean/15 text-liquid-ocean',
                'border border-white/30'
              )}
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={liquidSpringConfig.snappy}
            >
              {name[0]}
            </motion.div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-liquid-deep truncate">
                  {name}
                </span>
                <motion.span
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    isActive ? 'bg-emerald-500' : 'bg-red-400'
                  )}
                  animate={isActive ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <LiquidRoleBadge role={role} size="sm" />
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-liquid-mist">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="truncate">{phone}</span>
            </div>
            {email && (
              <div className="flex items-center gap-2 text-xs text-liquid-mist">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{email}</span>
              </div>
            )}
            {department && (
              <div className="flex items-center gap-2 text-xs text-liquid-silver">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{department}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

LiquidTeamCard.displayName = 'LiquidTeamCard';

export { LiquidTeamCard };
