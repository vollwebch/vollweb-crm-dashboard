'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface UserPermissions {
  clients: boolean
  services: boolean
  hosting: boolean
  domains: boolean
  payments: boolean
  invoices: boolean
  alarms: boolean
  reminders: boolean
  trash: boolean
  audit: boolean
  stats: boolean
  config: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  permissions: UserPermissions
  companyId: string
  company: { id: string; name: string }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: keyof UserPermissions) => boolean
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  clients: true,
  services: true,
  hosting: true,
  domains: true,
  payments: true,
  invoices: true,
  alarms: true,
  reminders: true,
  trash: true,
  audit: true,
  stats: true,
  config: true
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    // Admins always have all permissions
    if (user?.role === 'ADMIN') return true
    
    // Check user permissions
    if (!user?.permissions) return true // Default to allowed if no permissions set
    
    return user.permissions[permission] === true
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, hasPermission }}>
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
