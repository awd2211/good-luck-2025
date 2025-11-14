import { Request, Response, NextFunction } from 'express'
import * as favoriteService from '../../services/user/favoriteService'

/**
 * 获取收藏列表
 */
export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await favoriteService.getUserFavorites(req.user.id, page, limit)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 添加收藏
 */
export const addFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { fortuneId } = req.body

    if (!fortuneId) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空',
      })
    }

    const favorite = await favoriteService.addFavorite(req.user.id, fortuneId)

    res.json({
      success: true,
      message: '收藏成功',
      data: favorite,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 取消收藏
 */
export const removeFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { fortuneId } = req.params
    await favoriteService.removeFavorite(req.user.id, fortuneId)

    res.json({
      success: true,
      message: '已取消收藏',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 检查是否收藏
 */
export const checkFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { fortuneId } = req.params
    const result = await favoriteService.checkFavorite(req.user.id, fortuneId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 批量检查收藏状态
 */
export const batchCheckFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { fortuneIds } = req.body

    if (!Array.isArray(fortuneIds)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误',
      })
    }

    const result = await favoriteService.batchCheckFavorites(req.user.id, fortuneIds)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
