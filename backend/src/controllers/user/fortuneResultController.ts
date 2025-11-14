import { Request, Response, NextFunction } from 'express'
import * as fortuneResultService from '../../services/user/fortuneResultService'
import * as fortuneService from '../../services/fortuneService'

/**
 * 计算并保存算命结果
 * POST /api/fortune-results
 */
export const calculateAndSave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { fortuneId, fortuneType, inputData, orderId } = req.body

    // 验证必填字段
    if (!fortuneId || !fortuneType || !inputData) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：fortuneId, fortuneType, inputData',
      })
    }

    // 根据不同类型调用相应的计算函数
    let resultData: any

    switch (fortuneType) {
      case 'birth-animal':
        if (!inputData.birthYear || !inputData.birthMonth || !inputData.birthDay) {
          return res.status(400).json({
            success: false,
            message: '生肖运势需要提供：birthYear, birthMonth, birthDay',
          })
        }
        resultData = fortuneService.calculateBirthFortune(inputData)
        break

      case 'bazi':
        if (!inputData.birthYear || !inputData.birthMonth || !inputData.birthDay || !inputData.birthHour || !inputData.gender) {
          return res.status(400).json({
            success: false,
            message: '八字精批需要提供：birthYear, birthMonth, birthDay, birthHour, gender',
          })
        }
        resultData = fortuneService.calculateBazi(inputData)
        break

      case 'flow-year':
        if (!inputData.birthYear || !inputData.targetYear) {
          return res.status(400).json({
            success: false,
            message: '流年运势需要提供：birthYear, targetYear',
          })
        }
        resultData = fortuneService.calculateFlowYear(inputData)
        break

      case 'name-detail':
        if (!inputData.name || !inputData.birthYear || !inputData.birthMonth || !inputData.birthDay) {
          return res.status(400).json({
            success: false,
            message: '姓名详批需要提供：name, birthYear, birthMonth, birthDay',
          })
        }
        resultData = fortuneService.calculateNameScore(inputData)
        break

      case 'marriage':
        if (!inputData.person1 || !inputData.person2) {
          return res.status(400).json({
            success: false,
            message: '婚姻分析需要提供：person1, person2（包含姓名和生日）',
          })
        }
        resultData = fortuneService.calculateMarriage(inputData)
        break

      default:
        return res.status(400).json({
          success: false,
          message: `不支持的算命类型：${fortuneType}`,
        })
    }

    // 保存算命结果到数据库
    const savedResult = await fortuneResultService.saveFortuneResult(
      req.user.id,
      fortuneId,
      fortuneType,
      inputData,
      resultData,
      orderId
    )

    res.status(201).json({
      success: true,
      message: '算命结果已保存',
      data: savedResult,
    })
  } catch (error) {
    console.error('计算并保存算命结果失败:', error)
    next(error)
  }
}

/**
 * 获取单个算命结果
 * GET /api/fortune-results/:resultId
 */
export const getResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resultId } = req.params
    const userId = req.user?.id

    const result = await fortuneResultService.getFortuneResult(resultId, userId)

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '算命结果不存在',
      })
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取我的算命结果列表
 * GET /api/fortune-results
 */
export const getMyResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const fortuneType = req.query.fortuneType as string

    const result = await fortuneResultService.getUserFortuneResults(req.user.id, {
      page,
      limit,
      fortuneType,
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
 * 删除算命结果
 * DELETE /api/fortune-results/:resultId
 */
export const deleteResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { resultId } = req.params

    const success = await fortuneResultService.deleteFortuneResult(resultId, req.user.id)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '算命结果不存在或无权限删除',
      })
    }

    res.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 根据订单ID获取算命结果
 * GET /api/fortune-results/order/:orderId
 */
export const getResultsByOrderId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { orderId } = req.params

    const results = await fortuneResultService.getFortuneResultByOrderId(orderId, req.user.id)

    res.json({
      success: true,
      data: results,
    })
  } catch (error) {
    next(error)
  }
}
