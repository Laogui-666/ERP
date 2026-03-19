'use client'

import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/order'
import { ORDER_STATUS_LABELS } from '@/types/order'

interface StatusBadgeProps {
  status: OrderStatus
}

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'danger' | 'purple'> = {
  PENDING_CONNECTION: 'default',
  CONNECTED: 'info',
  COLLECTING_DOCS: 'warning',
  PENDING_REVIEW: 'warning',
  UNDER_REVIEW: 'purple',
  MAKING_MATERIALS: 'info',
  PENDING_DELIVERY: 'purple',
  DELIVERED: 'success',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} size="sm">
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}
