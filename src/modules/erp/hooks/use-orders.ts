'use client'

import { useCallback } from 'react'
import { useOrderStore } from '@erp/stores/order-store'
import { apiFetch } from '@shared/lib/api-client'
import type { OrderQuery, OrderStatus } from '@erp/types/order'

export function useOrders() {
  const { orders, currentOrder, meta, isLoading, query, fetchOrders, fetchOrder, setQuery, clearCurrentOrder } =
    useOrderStore()

  const refresh = useCallback(() => fetchOrders(), [fetchOrders])

  const search = useCallback(
    (search: string) => fetchOrders({ ...query, search, page: 1 }),
    [fetchOrders, query],
  )

  const filterByStatus = useCallback(
    (status: OrderStatus | undefined) => {
      const next: OrderQuery = { ...query, page: 1 }
      if (status) next.status = status
      else delete next.status
      fetchOrders(next)
    },
    [fetchOrders, query],
  )

  const goToPage = useCallback(
    (page: number) => fetchOrders({ ...query, page }),
    [fetchOrders, query],
  )

  const changeStatus = useCallback(
    async (orderId: string, toStatus: OrderStatus, detail?: string) => {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, detail }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error?.message ?? '状态变更失败')
      }
      // 刷新当前查看的订单
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }
      return json.data
    },
    [currentOrder, fetchOrder],
  )

  const claimOrder = useCallback(
    async (orderId: string) => {
      const res = await apiFetch(`/api/orders/${orderId}/claim`, { method: 'POST' })
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
