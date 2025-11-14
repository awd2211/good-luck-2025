import { Request, Response, NextFunction } from 'express'
import * as fortuneListService from '../../services/user/fortuneListService'

/**
 * 获取算命服务列表
 */
export const getFortuneList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const sort = req.query.sort as string
    const keyword = req.query.keyword as string

    const result = await fortuneListService.getFortuneList({
      category,
      page,
      limit,
      sort,
      keyword,
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取算命服务详情
 */
export const getFortuneDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.id // 可选的用户ID

    const fortune = await fortuneListService.getFortuneDetail(id, userId)

    res.json({
      success: true,
      data: fortune,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取热门服务
 */
export const getPopularFortunes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    const fortunes = await fortuneListService.getPopularFortunes(limit)

    res.json({
      success: true,
      data: fortunes,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取推荐服务
 */
export const getRecommendedFortunes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    const fortunes = await fortuneListService.getRecommendedFortunes(limit)

    res.json({
      success: true,
      data: fortunes,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取分类列表
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await fortuneListService.getCategories()

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}
