'use client'

import React from 'react'

export type ERPLoadingButtonProps = {
  loading: boolean
  loadingText?: string
}

export type ERPButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning'
export type ERPButtonSize = 'sm' | 'md' | 'lg'

interface ERPButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, Partial<ERPLoadingButtonProps> {
  variant?: ERPButtonVariant
  size?: ERPButtonSize
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export function ERPButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText = '处理中...',
  className = '',
  disabled,
  ...props
}: ERPButtonProps) {
  const variantClasses = {
    primary: 'bg-glass-primary text-white hover:bg-glass-primary/90',
    secondary: 'bg-glass-muted text-glass-text-primary hover:bg-glass-muted/80',
    outline: 'bg-transparent border border-glass-border text-glass-text-primary hover:bg-glass-primary/5',
    danger: 'bg-glass-danger text-white hover:bg-glass-danger/90',
    success: 'bg-glass-success text-white hover:bg-glass-success/90',
    warning: 'bg-glass-warning text-white hover:bg-glass-warning/90'
  }

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  }

  return (
    <button
      className={`rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 glass-button-hover focus:outline-none focus:ring-2 focus:ring-glass-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  )
}