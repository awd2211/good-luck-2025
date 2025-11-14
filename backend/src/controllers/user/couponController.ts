import { Request, Response, NextFunction } from 'express'
import * as couponService from '../../services/user/couponService'

/**
 * 获取可领取的优惠券列表（公开接口）
 */
export const getAvailableCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id // 可选，用于检查是否已领取

    const coupons = await couponService.getAvailableCoupons(userId)

    res.json({
      success: true,
      data: coupons,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 领取优惠券
 */
export const receiveCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { couponId } = req.body

    if (!couponId || typeof couponId !== 'number') {
      return res.status(400).json({
        success: false,
        message: '请提供优惠券ID',
      })
    }

    const userCoupon = await couponService.receiveCoupon(req.user.id, couponId)

    res.json({
      success: true,
      message: '领取成功',
      data: userCoupon,
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
 * 获取用户的优惠券列表
 */
export const getUserCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string

    const result = await couponService.getUserCoupons(req.user.id, {
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
 * 获取用户可用的优惠券（用于下单）
 */
export const getUsableCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const amount = parseFloat(req.query.amount as string)
    const fortuneType = req.query.fortuneType as string

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的订单金额',
      })
    }

    const coupons = await couponService.getUsableCoupons(req.user.id, amount, fortuneType)

    res.json({
      success: true,
      data: coupons,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取优惠券统计
 */
export const getCouponStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const stats = await couponService.getCouponStats(req.user.id)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}
