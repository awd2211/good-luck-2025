import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { CartItem, Fortune } from '../types'
import * as cartApi from '../services/cartService'
import { useAuth } from '../hooks/useAuth'
import { logError } from '../utils/logger'

interface CartContextType {
  items: CartItem[]
  itemCount: number
  totalAmount: number
  isLoading: boolean
  addItem: (fortune: Fortune, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 计算购物车统计信息
  const itemCount = Array.isArray(items) ? items.reduce((sum, item) => sum + item.quantity, 0) : 0
  const totalAmount = Array.isArray(items) ? items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0

  // 用户登录后加载购物车
  useEffect(() => {
    if (user && token) {
      refreshCart()
    } else {
      // 未登录时清空购物车
      setItems([])
    }
  }, [user, token])

  const refreshCart = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await cartApi.getCart()
      // 后端返回的是 CartResponse { items, count, total }
      const cartData = response.data.data
      if (cartData && cartData.items) {
        setItems(cartData.items)
      } else {
        setItems([])
      }
    } catch (error) {
      logError('获取购物车失败', error)
      setItems([]) // 出错时设置为空数组
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = async (fortune: Fortune, quantity = 1) => {
    if (!token) {
      throw new Error('请先登录')
    }

    try {
      await cartApi.addToCart(fortune.id, quantity)
      await refreshCart()
    } catch (error) {
      logError('添加到购物车失败', error, { fortuneId: fortune.id, quantity })
      throw error
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!token) return

    try {
      await cartApi.updateCartItem(itemId, quantity)
      await refreshCart()
    } catch (error) {
      logError('更新购物车失败', error, { itemId, quantity })
      throw error
    }
  }

  const removeItem = async (itemId: string) => {
    if (!token) return

    try {
      await cartApi.removeFromCart(itemId)
      await refreshCart()
    } catch (error) {
      logError('删除购物车项失败', error, { itemId })
      throw error
    }
  }

  const clearCart = async () => {
    if (!token) return

    try {
      await cartApi.clearCart()
      setItems([])
    } catch (error) {
      logError('清空购物车失败', error)
      throw error
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart 必须在 CartProvider 中使用')
  }
  return context
}
