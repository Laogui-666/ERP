'use client';

import { forwardRef } from 'react';
import { cn } from '@shared/lib/utils';

interface LiquidInfoFieldProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}

const LiquidInfoField = forwardRef<HTMLDivElement, LiquidInfoFieldProps>(
  ({ label, value, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-1', className)}>
        <span className="text-xs text-liquid-mist">{label}</span>
        <div className="text-sm text-liquid-deep font-medium">
          {value ?? '-'}
        </div>
      </div>
    );
  }
);

LiquidInfoField.displayName = 'LiquidInfoField';

export { LiquidInfoField };
