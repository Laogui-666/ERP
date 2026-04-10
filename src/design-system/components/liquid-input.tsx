'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@shared/lib/utils';

interface LiquidInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'liquid' | 'solid';
}

const LiquidInput = forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    leftIcon,
    rightIcon,
    variant = 'liquid',
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const baseStyles = 'w-full px-5 py-4 md:py-3.5 rounded-3xl transition-all duration-300 focus:outline-none text-base md:text-sm';

    const variants = {
      liquid: 'bg-liquid-surface/85 backdrop-blur-xl border border-liquid-border/50 focus:bg-liquid-surface/95 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium',
      solid: 'bg-liquid-surface border border-liquid-border/30 focus:border-liquid-ocean focus:shadow-liquid-medium',
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-semibold text-liquid-deep mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-liquid-mist">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseStyles,
              variants[variant],
              leftIcon ? 'pl-14' : '',
              rightIcon ? 'pr-14' : '',
              error ? 'border-red-400/60 focus:border-red-500 animate-shake' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-liquid-mist">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-liquid-mist">{helperText}</p>
        )}
      </div>
    );
  }
);

LiquidInput.displayName = 'LiquidInput';
export { LiquidInput };
