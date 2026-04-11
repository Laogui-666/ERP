'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidChatCardProps {
  orderNo: string;
  status: ReactNode;
  country: string;
  visaType: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

const LiquidChatCard = forwardRef<HTMLDivElement, LiquidChatCardProps>(
  ({ 
    orderNo, 
    status, 
    country, 
    visaType, 
    lastMessage,
    lastMessageAt,
    unreadCount = 0,
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
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        onClick={onClick}
        className={cn(
          'relative overflow-hidden rounded-2xl p-4',
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
        <div className="relative z-10 flex items-start gap-3">
          {/* 图标 */}
          <motion.div 
            className={cn(
              'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg',
              'bg-liquid-ocean/15 text-liquid-ocean',
              'border border-white/30'
            )}
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={liquidSpringConfig.snappy}
          >
            🎫
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* 顶部行 */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-liquid-deep truncate">
                  {orderNo}
                </span>
                {status}
              </div>
              {lastMessageAt && (
                <span className="text-[10px] text-liquid-silver flex-shrink-0 ml-2">
                  {lastMessageAt}
                </span>
              )}
            </div>

            {/* 签证信息 */}
            <div className="flex items-center gap-1.5 text-xs text-liquid-mist mb-1.5">
              <span>🌍</span>
              <span>{country}</span>
              <span className="text-liquid-silver">·</span>
              <span>{visaType}</span>
            </div>

            {/* 消息预览 */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-liquid-silver truncate max-w-[200px]">
                {lastMessage || '点击进入会话'}
              </p>
              {unreadCount > 0 && (
                <motion.span 
                  className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center px-1 font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={liquidSpringConfig.bouncy}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

LiquidChatCard.displayName = 'LiquidChatCard';

export { LiquidChatCard };
