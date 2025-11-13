import { Request, Response } from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  batchUpdateUserStatus,
  getUserStats
} from '../services/userService'

/**
 * 获取所有用户
 */
export const getUsers = (req: Request, res: Response) => {
  try {
    const { page, pageSize, search, status } = req.query

    const result = getAllUsers({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      search: search as string,
      status: status as string
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
      message: '获取用户列表失败'
    })
  }
}

/**
 * 获取单个用户
 */
export const getUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
}

/**
 * 创建用户
 */
export const addUser = (req: Request, res: Response) => {
  try {
    const userData = req.body

    if (!userData.username || !userData.phone) {
      return res.status(400).json({
        success: false,
        message: '用户名和手机号不能为空'
      })
    }

    const newUser = createUser(userData)

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: newUser
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    })
  }
}

/**
 * 更新用户
 */
export const modifyUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userData = req.body

    const updatedUser = updateUser(id, userData)

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      message: '用户更新成功',
      data: updatedUser
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户失败'
    })
  }
}

/**
 * 删除用户
 */
export const removeUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = deleteUser(id)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      message: '用户删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    })
  }
}

/**
 * 批量更新用户状态
 */
export const batchUpdateStatus = (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供用户ID列表'
      })
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效'
      })
    }

    const count = batchUpdateUserStatus(ids, status)

    res.json({
      success: true,
      message: `成功更新${count}个用户的状态`,
      data: { count }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量更新失败'
    })
  }
}

/**
 * 获取用户统计
 */
export const getStats = (req: Request, res: Response) => {
  try {
    const stats = getUserStats()

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
