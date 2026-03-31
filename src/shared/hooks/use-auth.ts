'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@shared/stores/auth-store'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
