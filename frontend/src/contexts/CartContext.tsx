import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { CartItem, Fortune } from '../types'
import * as cartApi from '../services/cartService'
import { useAuth } from '../hooks/useAuth'

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
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
      setItems(response.data.data || [])
    } catch (error) {
      console.error('获取购物车失败:', error)
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
      console.error('添加到购物车失败:', error)
      throw error
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!token) return

    try {
      await cartApi.updateCartItem(itemId, quantity)
      await refreshCart()
    } catch (error) {
      console.error('更新购物车失败:', error)
      throw error
    }
  }

  const removeItem = async (itemId: string) => {
    if (!token) return

    try {
      await cartApi.removeFromCart(itemId)
      await refreshCart()
    } catch (error) {
      console.error('删除购物车项失败:', error)
      throw error
    }
  }

  const clearCart = async () => {
    if (!token) return

    try {
      await cartApi.clearCart()
      setItems([])
    } catch (error) {
      console.error('清空购物车失败:', error)
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
