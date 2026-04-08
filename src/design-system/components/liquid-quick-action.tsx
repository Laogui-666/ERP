'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidQuickActionProps {
  href: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  className?: string;
  delay?: number;
}

const LiquidQuickAction = forwardRef<HTMLAnchorElement, LiquidQuickActionProps>(
  ({ href, label, icon, description, className, delay = 0 }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.medium, delay: delay * 0.1 }}
      >
        <Link
          ref={ref}
          href={href}
          className={cn(
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl',
            'bg-white/50 backdrop-blur-xl',
            'border border-white/40',
            'shadow-liquid-soft',
            'transition-all duration-300',
            'group',
            'hover:bg-white/70 hover:shadow-liquid-medium hover:-translate-y-0.5',
            'active:scale-95',
            className
          )}
        >
          {icon && (
            <motion.div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                'bg-liquid-ocean/10 text-liquid-ocean',
                'border border-white/30'
              )}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={liquidSpringConfig.snappy}
            >
              <span className="text-lg transition-transform duration-300 group-hover:scale-110">
                {icon}
              </span>
            </motion.div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-liquid-deep group-hover:text-liquid-ocean transition-colors">
              {label}
            </span>
            {description && (
              <p className="text-xs text-liquid-mist mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
          <svg
            className="w-4 h-4 text-liquid-mist opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    );
  }
);

LiquidQuickAction.displayName = 'LiquidQuickAction';

export { LiquidQuickAction };
