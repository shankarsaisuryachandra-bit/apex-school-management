import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('refreshToken', data.refreshToken)
      const userData = {
        userId: data.userId,
        profileId: data.profileId,
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        staffRole: data.staffRole,
        permissions: data.permissions || [],
      }
      sessionStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, role: data.role }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user')
    setUser(null)
  }

  const getRoleDashboard = (role) => {
    switch (role) {
      case 'MANAGEMENT': return '/management'
      case 'TEACHER': return '/teacher'
      case 'STUDENT': return '/student'
      case 'PARENT': return '/parent'
      case 'BUS_OPERATOR': return '/bus-console'
      default: return '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getRoleDashboard }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
