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
        bg: 'bg-white/65',
        blur: 'backdrop-blur-lg',
        border: 'border-white/40',
        shadow: 'shadow-[0_4px_16px_0_rgba(31,38,135,0.08)]',
      },
      medium: {
        bg: 'bg-white/75',
        blur: 'backdrop-blur-xl',
        border: 'border-white/50',
        shadow: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.10)]',
      },
      strong: {
        bg: 'bg-white/85',
        blur: 'backdrop-blur-2xl',
        border: 'border-white/60',
        shadow: 'shadow-[0_12px_40px_0_rgba(31,38,135,0.12)]',
      },
      ultra: {
        bg: 'bg-white/95',
        blur: 'backdrop-blur-3xl',
        border: 'border-white/70',
        shadow: 'shadow-[0_16px_48px_0_rgba(31,38,135,0.15)]',
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
        'shadow-[0_16px_48px_0_rgba(31,38,135,0.15)]',
        'transform-gpu'
      ),
      solid: 'bg-white shadow-[0_8px_32px_0_rgba(31,38,135,0.10)]',
      outlined: 'bg-transparent border border-white/30',
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
        whileHover={hoverable ? { scale: 1.02, y: -4, boxShadow: '0 16px 48px 0 rgba(31,38,135,0.12)' } : {}}
        whileTap={hoverable ? { scale: 0.985, y: 0 } : {}}
        transition={liquidSpringConfig.liquid}
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
