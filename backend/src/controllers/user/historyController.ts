import { Request, Response, NextFunction } from 'express'
import * as historyService from '../../services/user/historyService'

/**
 * 获取浏览历史
 */
export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await historyService.getUserHistory(req.user.id, page, limit)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 添加浏览记录
 */
export const addHistory = async (req: Request, res: Response, next: NextFunction) => {
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

    const history = await historyService.addHistory(req.user.id, fortuneId)

    res.json({
      success: true,
      message: '已记录',
      data: history,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 删除单条浏览记录
 */
export const removeHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { id } = req.params
    await historyService.removeHistory(req.user.id, id)

    res.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 清空浏览历史
 */
export const clearHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const result = await historyService.clearHistory(req.user.id)

    res.json({
      success: true,
      message: '浏览历史已清空',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 批量删除浏览记录
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
        message: '请选择要删除的记录',
      })
    }

    const result = await historyService.batchRemoveHistory(req.user.id, ids)

    res.json({
      success: true,
      message: `成功删除${result.deletedCount}条记录`,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
