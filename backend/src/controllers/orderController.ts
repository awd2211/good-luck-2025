import { Request, Response } from 'express'
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  getTodayOrderStats
} from '../services/orderService'

/**
 * 获取所有订单
 */
export const getOrders = (req: Request, res: Response) => {
  try {
    const { page, pageSize, search, status, startDate, endDate } = req.query

    const result = getAllOrders({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      search: search as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    })

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    })
  }
}

/**
 * 获取单个订单
 */
export const getOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const order = getOrderById(id)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }

    res.json({
      success: true,
      data: order
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单信息失败'
    })
  }
}

/**
 * 创建订单
 */
export const addOrder = (req: Request, res: Response) => {
  try {
    const orderData = req.body

    if (!orderData.userId || !orderData.fortuneType || !orderData.amount) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      })
    }

    const newOrder = createOrder(orderData)

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: newOrder
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    })
  }
}

/**
 * 更新订单
 */
export const modifyOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const orderData = req.body

    const updatedOrder = updateOrder(id, orderData)

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }

    res.json({
      success: true,
      message: '订单更新成功',
      data: updatedOrder
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新订单失败'
    })
  }
}

/**
 * 更新订单状态
 */
export const changeOrderStatus = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['pending', 'completed', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效'
      })
    }

    const updatedOrder = updateOrderStatus(id, status)

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: updatedOrder
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新订单状态失败'
    })
  }
}

/**
 * 删除订单
 */
export const removeOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = deleteOrder(id)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }

    res.json({
      success: true,
      message: '订单删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除订单失败'
    })
  }
}

/**
 * 获取订单统计
 */
export const getStats = (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query

    const stats = getOrderStats({
      startDate: startDate as string,
      endDate: endDate as string
    })

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    })
  }
}

/**
 * 获取今日订单统计
 */
export const getTodayStats = (req: Request, res: Response) => {
  try {
    const stats = getTodayOrderStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取今日统计失败'
    })
  }
}
