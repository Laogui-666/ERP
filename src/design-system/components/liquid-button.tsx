'use client';

import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'liquid' | 'liquid-fill';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'full' | 'auto' | 'fixed';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  withGlow?: boolean;
}

const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    width = 'auto',
    isLoading = false,
    leftIcon,
    rightIcon,
    withGlow = true,
    className,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none relative overflow-hidden';

    const variants = {
      primary: 'bg-liquid-ocean text-liquid-deep hover:bg-liquid-ocean/90 active:bg-liquid-ocean/80',
      secondary: 'bg-liquid-sand text-liquid-deep hover:bg-liquid-sand/90 active:bg-liquid-sand/80',
      ghost: 'bg-transparent text-liquid-deep hover:bg-liquid-cream active:bg-liquid-cream/80',
      liquid: 'bg-liquid-surface/80 backdrop-blur-xl border border-liquid-border/50 text-liquid-deep hover:bg-liquid-surface/90 active:bg-liquid-surface/85',
      'liquid-fill': 'bg-liquid-surface/90 backdrop-blur-2xl border border-liquid-border/60 text-liquid-deep hover:bg-liquid-surface/95 active:bg-liquid-surface/90',
    };

    const glowStyles = withGlow ? {
      primary: 'shadow-[0_0_0_1px_rgba(232,213,196,0.3)_inset,0_8px_24px_rgba(232,213,196,0.25)]',
      liquid: 'shadow-liquid-glow',
      'liquid-fill': 'shadow-liquid-glow',
    } : {};

    const sizes = {
      sm: 'px-5 py-3 text-sm md:py-2.5',
      md: 'px-7 py-4 text-base md:py-3.5',
      lg: 'px-9 py-5 text-lg md:py-4.5',
      xl: 'px-11 py-6 text-xl md:py-5.5',
    };

    const radius = {
      sm: 'rounded-2xl',
      md: 'rounded-3xl',
      lg: 'rounded-3xl',
      xl: 'rounded-3xl',
    };

    const widthStyles = {
      full: 'w-full md:w-auto',
      auto: 'w-auto',
      fixed: 'w-full',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          glowStyles[variant as keyof typeof glowStyles],
          sizes[size],
          radius[size],
          widthStyles[width],
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={liquidSpringConfig.liquid}
        {...props}
      >
        {/* 光泽效果层 */}
        {(variant === 'liquid' || variant === 'liquid-fill') && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-liquid-ocean/20 to-transparent rounded-t-[inherit]" />
          </div>
        )}

        <div className="relative z-10 flex items-center">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>加载中...</span>
            </>
          ) : (
            <>
              {leftIcon && <span className="mr-2">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="ml-2">{rightIcon}</span>}
            </>
          )}
        </div>
      </motion.button>
    );
  }
);

LiquidButton.displayName = 'LiquidButton';
export { LiquidButton };
