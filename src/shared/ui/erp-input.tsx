'use client'

import React from 'react'

export type ERPInputSize = 'sm' | 'md' | 'lg'

export type ERPInputVariant = 'default' | 'filled' | 'outline'

interface ERPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  inputSize?: ERPInputSize
  variant?: ERPInputVariant
  label?: string
  error?: string
  helperText?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  fullWidth?: boolean
}

export function ERPInput({
  inputSize = 'md',
  variant = 'default',
  label,
  error,
  helperText,
  prefix,
  suffix,
  fullWidth = false,
  className = '',
  ...props
}: ERPInputProps) {
  const sizeClasses = {
    sm: 'text-xs py-1.5',
    md: 'text-sm py-2',
    lg: 'text-base py-3'
  }

  const variantClasses = {
    default: 'bg-white/5 border border-glass-border',
    filled: 'bg-glass-muted border border-glass-border',
    outline: 'bg-transparent border border-glass-border'
  }

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="text-sm font-medium text-glass-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text-muted">
            {prefix}
          </div>
        )}
        <input
          className={`w-full rounded-xl px-3 ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${sizeClasses[inputSize]} ${variantClasses[variant]} ${error ? 'border-glass-danger' : ''} focus:outline-none focus:ring-2 focus:ring-glass-primary/50 focus:border-glass-primary transition-all duration-300 ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-glass-text-muted">
            {suffix}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <div className="mt-1.5">
          {error ? (
            <p className="text-xs text-glass-danger">{error}</p>
          ) : (
            <p className="text-xs text-glass-text-muted">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function ERPTextarea({
  inputSize = 'md',
  variant = 'default',
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}: Omit<ERPInputProps, 'prefix' | 'suffix'> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const sizeClasses = {
    sm: 'text-xs py-1.5',
    md: 'text-sm py-2',
    lg: 'text-base py-3'
  }

  const variantClasses = {
    default: 'bg-white/5 border border-glass-border',
    filled: 'bg-glass-muted border border-glass-border',
    outline: 'bg-transparent border border-glass-border'
  }

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="text-sm font-medium text-glass-text-primary mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-xl px-3 ${sizeClasses[inputSize]} ${variantClasses[variant]} ${error ? 'border-glass-danger' : ''} focus:outline-none focus:ring-2 focus:ring-glass-primary/50 focus:border-glass-primary transition-all duration-300 ${className}`}
        {...props}
      />
      {(error || helperText) && (
        <div className="mt-1.5">
          {error ? (
            <p className="text-xs text-glass-danger">{error}</p>
          ) : (
            <p className="text-xs text-glass-text-muted">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
}