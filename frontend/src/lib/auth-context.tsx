'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import api from './api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'admin' | 'seller' | 'renter' | 'wholesaler'
  isVerified: boolean
  xpPoints: number
  level: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'seller' | 'renter' | 'wholesaler'
  phone?: string
  dateOfBirth?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const res = await api.get('/users/me')
      const u = res.data.user
      const normalized: User = {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isVerified: true,
        xpPoints: u.xpPoints,
        level: u.level
      }
      setUser(normalized)
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      const me = await api.get('/users/me')
      const u = me.data.user
      const normalized: User = {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isVerified: true,
        xpPoints: u.xpPoints,
        level: u.level
      }
      setUser(normalized)
      toast.success('Back in the lobby 👋')
      if (normalized.role === 'admin') router.push('/admin/dashboard')
      else if (normalized.role === 'seller') router.push('/seller/dashboard')
      else if (normalized.role === 'wholesaler') router.push('/wholesaler/dashboard')
      else router.push('/renter/dashboard')
      
    } catch (error) {
      toast.error('Access denied 🚫')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true)
      const res = await api.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      })
      const token = res.data.token
      localStorage.setItem('token', token)
      const me = await api.get('/users/me')
      const u = me.data.user
      const normalized: User = {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isVerified: false,
        xpPoints: u.xpPoints,
        level: u.level
      }
      setUser(normalized)
      toast.success('Account unlocked 🎯')
      if (userData.role === 'seller') router.push('/seller/kyc')
      else if (userData.role === 'wholesaler') router.push('/wholesaler/kyc')
      else router.push('/renter/kyc')
      
    } catch (error) {
      toast.error('Plot twist 😬')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    toast.success('Ghost mode activated 👻')
    router.push('/')
  }

  const refreshUser = async () => {
    await checkAuthStatus()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
