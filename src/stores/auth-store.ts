import { create } from 'zustand'
import type { UserProfile } from '@/types/user'

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const json = await res.json()
    if (!json.success) {
      throw new Error(json.error?.message ?? '登录失败')
    }

    set({ user: json.data.user, isAuthenticated: true })
  },

  logout: async () => {
    await fetch('/api/auth/refresh', { method: 'DELETE' })
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true })
      const res = await fetch('/api/auth/me')
      const json = await res.json()

      if (json.success) {
        set({ user: json.data, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))
