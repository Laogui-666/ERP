'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidRoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
  className?: string;
}

// 角色颜色映射
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-600',
    border: 'border-violet-500/20',
  },
  COMPANY_OWNER: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
  },
  CS_ADMIN: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-600',
    border: 'border-sky-500/20',
  },
  CUSTOMER_SERVICE: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
  },
  VISA_ADMIN: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
  },
  DOC_COLLECTOR: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-600',
    border: 'border-teal-500/20',
  },
  OPERATOR: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600',
    border: 'border-cyan-500/20',
  },
  OUTSOURCE: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-600',
    border: 'border-slate-500/20',
  },
  default: {
    bg: 'bg-liquid-ocean/10',
    text: 'text-liquid-ocean',
    border: 'border-liquid-ocean/20',
  },
};

// 角色标签映射
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '超级管理员',
  COMPANY_OWNER: '企业主',
  CS_ADMIN: '客服部管理员',
  CUSTOMER_SERVICE: '客服',
  VISA_ADMIN: '签证部管理员',
  DOC_COLLECTOR: '资料员',
  OPERATOR: '签证操作员',
  OUTSOURCE: '外包业务员',
};

const LiquidRoleBadge = forwardRef<HTMLSpanElement, LiquidRoleBadgeProps>(
  ({ role, size = 'sm', className }, ref) => {
    const colors = ROLE_COLORS[role] ?? ROLE_COLORS.default;
    const label = ROLE_LABELS[role] ?? role;

    return (
      <motion.span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-lg border backdrop-blur-sm',
          colors.bg,
          colors.text,
          colors.border,
          size === 'sm' && 'px-2 py-0.5 text-[10px]',
          size === 'md' && 'px-2.5 py-1 text-xs',
          className
        )}
        whileHover={{ scale: 1.05 }}
        transition={liquidSpringConfig.snappy}
      >
        {label}
      </motion.span>
    );
  }
);

LiquidRoleBadge.displayName = 'LiquidRoleBadge';

export { LiquidRoleBadge };
