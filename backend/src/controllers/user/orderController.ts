import { Request, Response, NextFunction } from 'express'
import * as orderService from '../../services/user/orderService'

/**
 * 创建订单
 */
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { items, payMethod } = req.body

    // 验证请求数据
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供订单项',
      })
    }

    // 验证每个订单项
    for (const item of items) {
      if (!item.fortuneId || typeof item.fortuneId !== 'string') {
        return res.status(400).json({
          success: false,
          message: '订单项格式错误：缺少fortuneId',
        })
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: '订单项格式错误：数量必须大于0',
        })
      }
    }

    const order = await orderService.createOrder(req.user.id, items, payMethod)

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: order,
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    } else {
      next(error)
    }
  }
}

/**
 * 获取用户订单列表
 */
export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const status = req.query.status as string

    const result = await orderService.getUserOrders(req.user.id, {
      page,
      limit,
      status,
    })

    res.json({
      success: true,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取订单详情
 */
export const getOrderDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params

    const order = await orderService.getOrderDetail(req.user.id, id)

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    if (error instanceof Error && error.message === '订单不存在') {
      res.status(404).json({
        success: false,
        message: error.message,
      })
    } else {
      next(error)
    }
  }
}

/**
 * 取消订单
 */
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params

    const result = await orderService.cancelOrder(req.user.id, id)

    res.json({
      success: true,
      message: '订单已取消',
      data: result,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '订单不存在') {
        res.status(404).json({
          success: false,
          message: error.message,
        })
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    } else {
      next(error)
    }
  }
}

/**
 * 删除订单
 */
export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params

    await orderService.deleteOrder(req.user.id, id)

    res.json({
      success: true,
      message: '订单已删除',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '订单不存在') {
        res.status(404).json({
          success: false,
          message: error.message,
        })
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    } else {
      next(error)
    }
  }
}

/**
 * 获取订单统计
 */
export const getOrderStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const stats = await orderService.getOrderStats(req.user.id)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}
