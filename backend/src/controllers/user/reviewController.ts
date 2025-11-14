import { Request, Response, NextFunction } from 'express'
import * as reviewService from '../../services/user/reviewService'

/**
 * 创建评价
 */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { orderId, rating, content, images, tags, isAnonymous } = req.body

    // 验证必填字段
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供订单号',
      })
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间',
      })
    }

    const review = await reviewService.createReview(req.user.id, {
      orderId,
      rating,
      content,
      images,
      tags,
      isAnonymous,
    })

    res.status(201).json({
      success: true,
      message: '评价成功',
      data: review,
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
 * 获取用户的评价列表
 */
export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await reviewService.getUserReviews(req.user.id, {
      page,
      limit,
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
 * 获取算命服务的评价列表（公开接口）
 */
export const getFortuneReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fortuneType } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined

    const result = await reviewService.getFortuneReviews(fortuneType, {
      page,
      limit,
      rating,
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
 * 获取评价详情
 */
export const getReviewDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const reviewId = parseInt(id)

    if (isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: '无效的评价ID',
      })
    }

    const review = await reviewService.getReviewDetail(reviewId)

    res.json({
      success: true,
      data: review,
    })
  } catch (error) {
    if (error instanceof Error && error.message === '评价不存在') {
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
 * 删除评价
 */
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params
    const reviewId = parseInt(id)

    if (isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: '无效的评价ID',
      })
    }

    await reviewService.deleteReview(req.user.id, reviewId)

    res.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '评价不存在') {
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
 * 点赞评价
 */
export const markHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const reviewId = parseInt(id)

    if (isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: '无效的评价ID',
      })
    }

    const result = await reviewService.markHelpful(reviewId)

    res.json({
      success: true,
      message: '标记成功',
      data: result,
    })
  } catch (error) {
    if (error instanceof Error && error.message === '评价不存在') {
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
 * 检查订单是否可以评价
 */
export const canReviewOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { orderId } = req.params

    const result = await reviewService.canReviewOrder(req.user.id, orderId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
