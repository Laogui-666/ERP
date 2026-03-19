import { create } from 'zustand'
import type { Order, OrderDetail, OrderQuery } from '@/types/order'
import type { ApiMeta } from '@/types/api'

interface OrderState {
  orders: Order[]
  currentOrder: OrderDetail | null
  meta: ApiMeta | null
  isLoading: boolean
  query: OrderQuery

  fetchOrders: (query?: OrderQuery) => Promise<void>
  fetchOrder: (id: string) => Promise<void>
  setQuery: (query: Partial<OrderQuery>) => void
  clearCurrentOrder: () => void
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  meta: null,
  isLoading: false,
  query: { page: 1, pageSize: 20 },

  fetchOrders: async (queryOverride) => {
    set({ isLoading: true })
    try {
      const query = { ...get().query, ...queryOverride }
      const params = new URLSearchParams()
      if (query.page) params.set('page', String(query.page))
      if (query.pageSize) params.set('pageSize', String(query.pageSize))
      if (query.status) params.set('status', query.status)
      if (query.priority) params.set('priority', query.priority)
      if (query.search) params.set('search', query.search)
      if (query.assigneeId) params.set('assigneeId', query.assigneeId)
      if (query.startDate) params.set('startDate', query.startDate)
      if (query.endDate) params.set('endDate', query.endDate)

      const res = await fetch(`/api/orders?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        set({ orders: json.data, meta: json.meta ?? null, query })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  fetchOrder: async (id) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/orders/${id}`)
      const json = await res.json()

      if (json.success) {
        set({ currentOrder: json.data })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  setQuery: (partial) => {
    set((state) => ({ query: { ...state.query, ...partial } }))
  },

  clearCurrentOrder: () => set({ currentOrder: null }),
}))
