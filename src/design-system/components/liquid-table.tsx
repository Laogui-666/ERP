'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface Column<T> {
  key: string;
  title: string;
  width?: string;
  render?: (record: T) => ReactNode;
}

interface LiquidTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T | ((record: T) => string);
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

const LiquidTable = forwardRef<HTMLDivElement, LiquidTableProps<any>>(
  <T extends { id: string }>({
    data,
    columns,
    rowKey,
    selectable = false,
    selectedIds = new Set(),
    onSelect,
    onSelectAll,
    loading = false,
    emptyText = '暂无数据',
    className,
  }: LiquidTableProps<T>, ref: React.Ref<HTMLDivElement>) => {
    const allSelected = data.length > 0 && data.every(item => selectedIds.has(item.id));
    const someSelected = data.some(item => selectedIds.has(item.id)) && !allSelected;

    const getRowKey = (record: T): string => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return String(record[rowKey]);
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={liquidSpringConfig.medium}
        className={cn(
          'overflow-hidden rounded-2xl',
          'bg-white/40 backdrop-blur-xl',
          'border border-white/30',
          'shadow-liquid-soft',
          className
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* 表头 */}
            <thead>
              <tr className="border-b border-white/20">
                {selectable && (
                  <th className="px-4 py-3 w-12">
                    <motion.button
                      onClick={onSelectAll}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'w-4 h-4 rounded border transition-all duration-200',
                        allSelected
                          ? 'bg-liquid-ocean border-liquid-ocean'
                          : someSelected
                          ? 'bg-liquid-ocean/50 border-liquid-ocean'
                          : 'bg-white/50 border-white/40 hover:border-liquid-ocean/50'
                      )}
                    >
                      {(allSelected || someSelected) && (
                        <svg className="w-3 h-3 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-liquid-mist uppercase tracking-wider"
                    style={{ width: col.width }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>

            {/* 表体 */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                    <motion.div
                      className="inline-block w-6 h-6 border-2 border-liquid-ocean/30 border-t-liquid-ocean rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="mt-2 text-xs text-liquid-mist">加载中...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={liquidSpringConfig.bouncy}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-liquid-ocean/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-liquid-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-sm text-liquid-mist">{emptyText}</p>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                data.map((record, index) => {
                  const isSelected = selectedIds.has(record.id);
                  return (
                    <motion.tr
                      key={getRowKey(record)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...liquidSpringConfig.medium, delay: index * 0.02 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                      className={cn(
                        'border-b border-white/10 last:border-b-0 transition-colors',
                        isSelected && 'bg-liquid-ocean/5'
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <motion.button
                            onClick={() => onSelect?.(record.id)}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              'w-4 h-4 rounded border transition-all duration-200',
                              isSelected
                                ? 'bg-liquid-ocean border-liquid-ocean'
                                : 'bg-white/50 border-white/40 hover:border-liquid-ocean/50'
                            )}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </motion.button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          {col.render ? col.render(record) : String(record[col.key as keyof T] ?? '')}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }
);

LiquidTable.displayName = 'LiquidTable';

export { LiquidTable };
export type { Column };
