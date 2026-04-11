'use client';

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

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
        bg: 'bg-liquid-surface/85',
        blur: 'backdrop-blur-lg',
        border: 'border-liquid-borderLight/50',
        shadow: 'shadow-liquid-soft',
      },
      medium: {
        bg: 'bg-liquid-surface/90',
        blur: 'backdrop-blur-xl',
        border: 'border-liquid-border/60',
        shadow: 'shadow-liquid-medium',
      },
      strong: {
        bg: 'bg-liquid-surface/95',
        blur: 'backdrop-blur-2xl',
        border: 'border-liquid-border/70',
        shadow: 'shadow-liquid-strong',
      },
      ultra: {
        bg: 'bg-liquid-surface/98',
        blur: 'backdrop-blur-3xl',
        border: 'border-liquid-border/80',
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
      solid: 'bg-liquid-surface shadow-liquid-medium',
      outlined: 'bg-transparent border border-liquid-border/30',
    };

    const paddings = {
      none: '',
      sm: 'p-5',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const hoverStyles = hoverable
      ? 'cursor-pointer'
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
        whileHover={hoverable ? { scale: 1.015, y: -1 } : {}}
        whileTap={hoverable ? { scale: 0.985 } : {}}
        transition={liquidSpringConfig.snappy}
        {...props as any}
      >
        {/* 顶部光泽效果 */}
        {(variant === 'liquid' || variant === 'liquid-elevated') && withGloss && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-liquid-ocean/20 via-liquid-ocean/10 to-transparent rounded-t-liquid" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-liquid-ocean/30 to-transparent" />
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
    <div ref={ref} className={cn('mt-5 pt-5 border-t border-liquid-borderLight/50', className)} {...props}>{children}</div>
  )
);
LiquidCardFooter.displayName = 'LiquidCardFooter';

export { LiquidCard, LiquidCardHeader, LiquidCardContent, LiquidCardFooter };
