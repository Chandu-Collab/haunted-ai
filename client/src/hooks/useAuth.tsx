import React, { createContext, useContext, useState, useEffect } from 'react'

type User = { id: string; email: string; avatarUrl?: string; nickname?: string } | null

type AuthContextType = {
  user: User
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string) => Promise<any>
  logout: () => void
  getToken: () => string | null
  updateAvatar: (avatarUrl: string) => Promise<any>
  updateNickname: (nickname: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem('haunted_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:5000'

  const getToken = () => localStorage.getItem('jwt') || localStorage.getItem('authToken') || null

  const saveToken = (token: string, userObj?: User) => {
    localStorage.setItem('jwt', token)
    if (userObj) localStorage.setItem('haunted_user', JSON.stringify(userObj))
    setUser(userObj || user)
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    localStorage.removeItem('authToken')
    localStorage.removeItem('haunted_user')
    setUser(null)
  }

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!resp.ok) throw new Error((await resp.json()).error || 'Login failed')
    const data = await resp.json()
    saveToken(data.token, data.user)
    return data
  }

  const signup = async (email: string, password: string) => {
    const resp = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!resp.ok) throw new Error((await resp.json()).error || 'Signup failed')
    const data = await resp.json()
    saveToken(data.token, data.user)
    return data
  }

  // Update avatar
  const updateAvatar = async (avatarUrl: string) => {
    if (!user) throw new Error('Not logged in')
    const resp = await fetch(`${API_URL}/api/auth/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      },
      body: JSON.stringify({ userId: user.id, avatarUrl })
    })
    if (!resp.ok) throw new Error((await resp.json()).error || 'Avatar update failed')
    const data = await resp.json()
    // Update user in local state and storage
    const updatedUser = { ...user, avatarUrl }
    setUser(updatedUser)
    localStorage.setItem('haunted_user', JSON.stringify(updatedUser))
    return data
  }

  // Update nickname
  const updateNickname = async (nickname: string) => {
    if (!user) throw new Error('Not logged in')
    const resp = await fetch(`${API_URL}/api/auth/nickname`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      },
      body: JSON.stringify({ userId: user.id, nickname })
    })
    if (!resp.ok) throw new Error((await resp.json()).error || 'Nickname update failed')
    const data = await resp.json()
    // Update user in local state and storage
    const updatedUser = { ...user, nickname }
    setUser(updatedUser)
    localStorage.setItem('haunted_user', JSON.stringify(updatedUser))
    return data
  }

  // keep user in sync if another tab changes localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'haunted_user') {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null) } catch { setUser(null) }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, getToken, updateAvatar, updateNickname }}>
      {children}
    </AuthContext.Provider>
  )
}

export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
