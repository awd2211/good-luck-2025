import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserInfo, isAuthenticated, getLocalUser, saveAuthData, logout as logoutService } from '../services/authService'

interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  loading: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => Promise<void>
  updateUser: (userData: UserInfo) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初始化时检查本地存储
    if (isAuthenticated()) {
      const localUser = getLocalUser()
      if (localUser) {
        setUser(localUser)
      }
    }
    setLoading(false)
  }, [])

  const login = (token: string, userData: UserInfo) => {
    saveAuthData(token, userData)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await logoutService()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setUser(null)
    }
  }

  const updateUser = (userData: UserInfo) => {
    // 更新用户信息并保存到本地存储
    const token = localStorage.getItem('token')
    if (token) {
      saveAuthData(token, userData)
    }
    setUser(userData)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return context
}
