'use client';

import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'liquid' | 'liquid-fill';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'full' | 'auto' | 'fixed';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  withGlow?: boolean;
  href?: string;
  children: ReactNode;
}

type LiquidButtonProps = LiquidButtonBaseProps & Omit<HTMLMotionProps<'button'>, 'children'>;

type LiquidAnchorProps = LiquidButtonBaseProps & Omit<HTMLMotionProps<'a'>, 'children'>;

const LiquidButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, LiquidButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    width = 'auto',
    isLoading = false,
    leftIcon,
    rightIcon,
    withGlow = true,
    href,
    className,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none relative overflow-hidden';

    const variants = {
      primary: 'bg-morandi-ocean text-white hover:bg-morandi-ocean/90 active:bg-morandi-ocean/80',
      secondary: 'bg-morandi-sand text-morandi-deep hover:bg-morandi-sand/90 active:bg-morandi-sand/80',
      ghost: 'bg-transparent text-morandi-deep hover:bg-morandi-cream active:bg-morandi-cream/80',
      liquid: 'bg-white/65 backdrop-blur-xl border border-white/40 text-morandi-deep hover:bg-white/75 active:bg-white/85',
      'liquid-fill': 'bg-white/90 backdrop-blur-2xl border border-white/60 text-morandi-deep hover:bg-white/95 active:bg-white/90',
    };

    const glowStyles = withGlow ? {
      primary: 'shadow-[0_0_0_1px_rgba(122,157,150,0.3)_inset,0_8px_24px_rgba(122,157,150,0.25)]',
      secondary: 'shadow-[0_0_0_1px_rgba(214,198,176,0.3)_inset,0_8px_24px_rgba(214,198,176,0.25)]',
      liquid: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.10)]',
      'liquid-fill': 'shadow-[0_12px_40px_0_rgba(31,38,135,0.15)]',
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

    const buttonClassName = cn(
      baseStyles,
      variants[variant],
      glowStyles[variant as keyof typeof glowStyles],
      sizes[size],
      radius[size],
      widthStyles[width],
      (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
      className
    );

    const commonProps = {
      className: buttonClassName,
      whileHover: { scale: disabled || isLoading ? 1 : 1.015 },
      whileTap: { scale: disabled || isLoading ? 1 : 0.985 },
      transition: liquidSpringConfig.snappy,
      ...props
    };

    if (href) {
      const anchorProps = commonProps as Omit<LiquidAnchorProps, keyof LiquidButtonBaseProps>;
      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...anchorProps}
          href={href}
          className={cn(
            buttonClassName,
            (disabled || isLoading) && 'pointer-events-none'
          )}
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
        </motion.a>
      );
    }

    const buttonProps = commonProps as Omit<LiquidButtonProps, keyof LiquidButtonBaseProps>;
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        {...buttonProps}
        disabled={disabled || isLoading}
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
