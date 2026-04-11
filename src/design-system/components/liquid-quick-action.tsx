'use client';

import { forwardRef, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';

interface LiquidQuickActionProps {
  href: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  className?: string;
  delay?: number;
}

const LiquidQuickAction = forwardRef<HTMLAnchorElement, LiquidQuickActionProps>(
  ({ href, label, icon, description, className }, ref) => {
    return (
      <div>
        <Link
          ref={ref}
          href={href}
          className={cn(
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl',
            'bg-white/50',
            'border border-white/40',
            'shadow-liquid-soft',
            'interactive-hover animate-enter-fade',
            className
          )}
        >
          {icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                'bg-liquid-ocean/10 text-liquid-ocean',
                'border border-white/30'
              )}
            >
              <span className="text-lg">
                {icon}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-liquid-deep">
              {label}
            </span>
            {description && (
              <p className="text-xs text-liquid-mist mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
          <svg
            className="w-4 h-4 text-liquid-mist"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }
);

LiquidQuickAction.displayName = 'LiquidQuickAction';

export { LiquidQuickAction };
