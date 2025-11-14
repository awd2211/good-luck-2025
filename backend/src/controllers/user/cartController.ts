import { Request, Response, NextFunction } from 'express'
import * as cartService from '../../services/user/cartService'

/**
 * 获取购物车
 */
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const cart = await cartService.getUserCart(req.user.id)

    res.json({
      success: true,
      data: cart,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 添加到购物车
 */
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { fortuneId, quantity = 1 } = req.body

    if (!fortuneId) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空',
      })
    }

    if (quantity < 1 || quantity > 99) {
      return res.status(400).json({
        success: false,
        message: '数量必须在1-99之间',
      })
    }

    const item = await cartService.addToCart(req.user.id, fortuneId, quantity)

    res.json({
      success: true,
      message: '添加成功',
      data: item,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新购物车商品数量
 */
export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '数量必须大于0',
      })
    }

    const item = await cartService.updateCartItem(req.user.id, id, quantity)

    res.json({
      success: true,
      message: '更新成功',
      data: item,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 删除购物车商品
 */
export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params
    await cartService.removeFromCart(req.user.id, id)

    res.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 批量删除购物车商品
 */
export const batchRemove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要删除的商品',
      })
    }

    const result = await cartService.batchRemoveFromCart(req.user.id, ids)

    res.json({
      success: true,
      message: `成功删除${result.deletedCount}件商品`,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 清空购物车
 */
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const result = await cartService.clearCart(req.user.id)

    res.json({
      success: true,
      message: '购物车已清空',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
