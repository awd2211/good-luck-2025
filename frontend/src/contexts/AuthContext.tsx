import { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User, LoginData, RegisterData } from '../types'
import * as authApi from '../services/authService'
import storage from '../utils/storage'
import { logError } from '../utils/logger'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
  setAuth: (token: string, user: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = () => {
    setUser(null)
    setToken(null)
    storage.remove('token')
    storage.remove('user')
  }

  // 初始化：从 storage 恢复登录状态
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = storage.get('token')
      const savedUser = storage.getJSON<User>('user')

      if (savedToken && savedUser) {
        setToken(savedToken)
        try {
          setUser(savedUser)
          // 可选：验证 token 是否仍然有效
          await authApi.getCurrentUser()
        } catch (error) {
          logError('Token 验证失败', error)
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
    storage.set('token', newToken)
    storage.setJSON('user', newUser)
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
    storage.set('token', newToken)
    storage.setJSON('user', newUser)
  }

  const updateUser = (newUser: User) => {
    setUser(newUser)
    storage.setJSON('user', newUser)
  }

  const refreshUser = async () => {
    const response = await authApi.getCurrentUser()
    const newUser = response.data.data
    if (!newUser) {
      throw new Error('获取用户信息失败')
    }
    updateUser(newUser)
  }

  // 直接设置认证状态（用于邮箱登录等场景）
  const setAuth = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    storage.set('token', newToken)
    storage.setJSON('user', newUser)
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
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
