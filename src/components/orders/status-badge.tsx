'use client'

import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/order'
import { ORDER_STATUS_LABELS } from '@/types/order'

interface StatusBadgeProps {
  status: OrderStatus
}

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'danger' | 'purple'> = {
  PENDING: 'default',
  DATA_ENTRY: 'info',
  DOCUMENT_PENDING: 'warning',
  DOCUMENT_COMPLETE: 'success',
  REVIEWING: 'purple',
  APPROVED: 'success',
  SUBMITTED_TO_EMBASSY: 'info',
  VISA_GRANTED: 'success',
  VISA_REJECTED: 'danger',
  COMPLETED: 'default',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} size="sm">
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}
