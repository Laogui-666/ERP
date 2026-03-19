'use client'

import { useCallback } from 'react'
import { useOrderStore } from '@/stores/order-store'
import type { OrderQuery, OrderStatus } from '@/types/order'

export function useOrders() {
  const { orders, currentOrder, meta, isLoading, query, fetchOrders, fetchOrder, setQuery, clearCurrentOrder } =
    useOrderStore()

  const refresh = useCallback(() => fetchOrders(), [fetchOrders])

  const search = useCallback(
    (search: string) => fetchOrders({ ...query, search, page: 1 }),
    [fetchOrders, query],
  )

  const filterByStatus = useCallback(
    (status?: OrderStatus) => fetchOrders({ ...query, status, page: 1 }),
    [fetchOrders, query],
  )

  const goToPage = useCallback(
    (page: number) => fetchOrders({ ...query, page }),
    [fetchOrders, query],
  )

  const changeStatus = useCallback(
    async (orderId: string, toStatus: OrderStatus, remark?: string) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toStatus, remark }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error?.message ?? '状态变更失败')
      }
      // Refresh current order if viewing
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }
      return json.data
    },
    [currentOrder, fetchOrder],
  )

  const claimOrder = useCallback(
    async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/claim`, { method: 'POST' })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error?.message ?? '接单失败')
      }
      return json.data
    },
    [],
  )

  return {
    orders,
    currentOrder,
    meta,
    isLoading,
    query,
    fetchOrders,
    fetchOrder,
    setQuery,
    clearCurrentOrder,
    refresh,
    search,
    filterByStatus,
    goToPage,
    changeStatus,
    claimOrder,
  }
}

export function useOrderQuery(): OrderQuery {
  const { query } = useOrderStore()
  return query
}
