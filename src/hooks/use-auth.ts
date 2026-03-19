'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
