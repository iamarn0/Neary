import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { resetSocket } from '../lib/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('neare.token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then((response) => setUser(response.data.data.user))
      .catch(() => {
        localStorage.removeItem('neare.token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(payload) {
      const response = await api.post('/auth/login', payload)
      localStorage.setItem('neare.token', response.data.data.token)
      resetSocket()
      setUser(response.data.data.user)
      return response.data.data.user
    },
    async register(payload) {
      const response = await api.post('/auth/register', payload)
      localStorage.setItem('neare.token', response.data.data.token)
      resetSocket()
      setUser(response.data.data.user)
      return response.data.data.user
    },
    logout() {
      localStorage.removeItem('neare.token')
      resetSocket()
      setUser(null)
    },
    setUser,
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
