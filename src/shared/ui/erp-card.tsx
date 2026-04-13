'use client'

import React from 'react'

interface ERPCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  footer?: React.ReactNode
  bordered?: boolean
  hoverable?: boolean
  elevated?: boolean
}

export function ERPCard({
  children,
  title,
  subtitle,
  icon,
  footer,
  bordered = true,
  hoverable = true,
  elevated = false,
  className = '',
  ...props
}: ERPCardProps) {
  return (
    <div
      className={`rounded-xl glass-card ${bordered ? 'border border-glass-border-light' : ''} ${hoverable ? 'glass-card-hover transition-all' : ''} ${elevated ? 'shadow-glass-medium' : ''} ${className}`}
      {...props}
    >
      {(title || subtitle || icon) && (
        <div className="p-4 border-b border-glass-border-light">
          <div className="flex items-center gap-3">
            {icon && <div className="text-glass-primary">{icon}</div>}
            <div className="flex-1">
              {title && <h3 className="text-sm font-semibold text-glass-text-primary">{title}</h3>}
              {subtitle && <p className="text-xs text-glass-text-muted mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t border-glass-border-light">
          {footer}
        </div>
      )}
    </div>
  )
}