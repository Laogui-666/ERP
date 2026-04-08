'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidNotificationItemProps {
  icon?: ReactNode;
  title: string;
  content?: string | null;
  createdAt: string;
  isRead?: boolean;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

const LiquidNotificationItem = forwardRef<HTMLDivElement, LiquidNotificationItemProps>(
  ({ 
    icon,
    title, 
    content,
    createdAt,
    isRead = false,
    className,
    onClick,
    delay = 0
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...liquidSpringConfig.medium, delay: delay * 0.02 }}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        whileTap={{ scale: 0.995 }}
        onClick={onClick}
        className={cn(
          'relative px-4 py-3.5 cursor-pointer transition-all',
          'border-b border-white/[0.04] last:border-b-0',
          !isRead ? 'bg-liquid-ocean/[0.04]' : '',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* 图标 */}
          <motion.span 
            className="text-base shrink-0 mt-0.5"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={liquidSpringConfig.snappy}
          >
            {icon ?? '🔔'}
          </motion.span>

          <div className="flex-1 min-w-0">
            {/* 标题行 */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'text-[13px] truncate',
                  !isRead
                    ? 'font-semibold text-liquid-deep'
                    : 'text-liquid-mist'
                )}
              >
                {title}
              </span>
              {!isRead && (
                <motion.span 
                  className="w-2 h-2 rounded-full bg-liquid-ocean shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={liquidSpringConfig.bouncy}
                />
              )}
            </div>

            {/* 内容 */}
            {content && (
              <p className="text-xs text-liquid-silver mt-0.5 line-clamp-2 leading-relaxed">
                {content}
              </p>
            )}

            {/* 时间 */}
            <span className="text-[10px] text-liquid-silver mt-1 block">
              {createdAt}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
);

LiquidNotificationItem.displayName = 'LiquidNotificationItem';

export { LiquidNotificationItem };
