'use client';

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@shared/lib/utils';

interface LiquidCardProps extends HTMLMotionProps<'div'> {
  variant?: 'liquid' | 'solid' | 'outlined' | 'liquid-elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  liquidIntensity?: 'light' | 'medium' | 'strong' | 'ultra';
  withGloss?: boolean;
  withBorder?: boolean;
  children: ReactNode;
}

const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ 
    children, 
    variant = 'liquid', 
    padding = 'md', 
    hoverable = false,
    liquidIntensity = 'medium',
    withGloss = true,
    withBorder = true,
    className,
    ...props 
  }, ref) => {
    const baseStyles = 'transition-all duration-400 relative overflow-hidden';

    const intensityConfig = {
      light: {
        bg: 'bg-white/45',
        blur: 'backdrop-blur-lg',
        border: 'border-white/35',
        shadow: 'shadow-liquid-soft',
      },
      medium: {
        bg: 'bg-white/60',
        blur: 'backdrop-blur-xl',
        border: 'border-white/50',
        shadow: 'shadow-liquid-medium',
      },
      strong: {
        bg: 'bg-white/72',
        blur: 'backdrop-blur-2xl',
        border: 'border-white/60',
        shadow: 'shadow-liquid-strong',
      },
      ultra: {
        bg: 'bg-white/80',
        blur: 'backdrop-blur-3xl',
        border: 'border-white/70',
        shadow: 'shadow-liquid-glow',
      },
    };

    const config = intensityConfig[liquidIntensity];

    const variants = {
      liquid: cn(
        config.bg,
        config.blur,
        withBorder && config.border,
        config.shadow
      ),
      'liquid-elevated': cn(
        config.bg,
        config.blur,
        withBorder && config.border,
        'shadow-liquid-glow',
        'transform-gpu'
      ),
      solid: 'bg-white shadow-liquid-medium',
      outlined: 'bg-transparent border border-liquid-silver/30',
    };

    const paddings = {
      none: '',
      sm: 'p-5',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const hoverStyles = hoverable
      ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-liquid-strong active:scale-[0.99]'
      : '';

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          'rounded-liquid',
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        {...props as any}
      >
        {/* 顶部光泽效果 */}
        {(variant === 'liquid' || variant === 'liquid-elevated') && withGloss && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-liquid" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        )}

        {/* 内容层 */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

LiquidCard.displayName = 'LiquidCard';

const LiquidCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-5', className)} {...props}>{children}</div>
  )
);
LiquidCardHeader.displayName = 'LiquidCardHeader';

const LiquidCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>{children}</div>
  )
);
LiquidCardContent.displayName = 'LiquidCardContent';

const LiquidCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-5 pt-5 border-t border-white/20', className)} {...props}>{children}</div>
  )
);
LiquidCardFooter.displayName = 'LiquidCardFooter';

export { LiquidCard, LiquidCardHeader, LiquidCardContent, LiquidCardFooter };
