import { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User, LoginData, RegisterData } from '../types'
import * as authApi from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken && savedUser) {
        setToken(savedToken)
        try {
          setUser(JSON.parse(savedUser))
          // 可选：验证 token 是否仍然有效
          await authApi.getCurrentUser()
        } catch (error) {
          console.error('Token 验证失败:', error)
          logout()
        }
      }
      setIsLoading(false)
    }

    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (data: LoginData) => {
    const response = await authApi.login(data)
    const authData = response.data.data
    if (!authData) {
      throw new Error('登录失败：未返回认证数据')
    }
    const { token: newToken, user: newUser } = authData

    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data)
    const authData = response.data.data
    if (!authData) {
      throw new Error('注册失败：未返回认证数据')
    }
    const { token: newToken, user: newUser } = authData

    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const updateUser = (newUser: User) => {
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const refreshUser = async () => {
    const response = await authApi.getCurrentUser()
    const newUser = response.data.data
    if (!newUser) {
      throw new Error('获取用户信息失败')
    }
    updateUser(newUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
