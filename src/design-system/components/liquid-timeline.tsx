'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface TimelineItem {
  id: string;
  status: string;
  label: string;
  timestamp: string;
  operator?: string;
  remark?: string;
  icon?: ReactNode;
}

interface LiquidTimelineProps {
  items: TimelineItem[];
  className?: string;
}

const LiquidTimeline = forwardRef<HTMLDivElement, LiquidTimelineProps>(
  ({ items, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={liquidSpringConfig.medium}
        className={cn('relative', className)}
      >
        {/* 时间线 */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-liquid-ocean/30 via-liquid-ocean/20 to-transparent" />

        {/* 节点列表 */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...liquidSpringConfig.medium, delay: index * 0.1 }}
              className="relative pl-10"
            >
              {/* 节点图标 */}
              <motion.div
                className={cn(
                  'absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center',
                  'bg-white/80 backdrop-blur-sm',
                  'border-2 border-liquid-ocean/30',
                  'text-liquid-ocean'
                )}
                whileHover={{ scale: 1.1, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                transition={liquidSpringConfig.snappy}
              >
                {item.icon || (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </motion.div>

              {/* 内容 */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-liquid-deep">
                    {item.label}
                  </span>
                  <span className="text-xs text-liquid-silver">
                    {item.timestamp}
                  </span>
                </div>
                {item.operator && (
                  <div className="text-xs text-liquid-mist mb-1">
                    操作人: {item.operator}
                  </div>
                )}
                {item.remark && (
                  <div className="text-xs text-liquid-mist bg-white/30 rounded-lg px-2 py-1.5 mt-2">
                    {item.remark}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
);

LiquidTimeline.displayName = 'LiquidTimeline';

export { LiquidTimeline };
export type { TimelineItem };
