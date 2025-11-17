/**
 * 管理员邀请控制器
 */

import { Request, Response } from 'express'
import {
  createInvitation,
  getPendingInvitations,
  getAllInvitations,
  validateInvitationToken,
  acceptInvitation,
  cancelInvitation,
  resendInvitation,
} from '../services/invitationService'

/**
 * 发送管理员邀请
 * @openapi
 * /api/manage/invitations/send:
 *   post:
 *     tags: [Admin - Invitations]
 *     summary: 发送管理员邀请
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, manager, operator, viewer]
 *     responses:
 *       200:
 *         description: 邀请发送成功
 */
export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { email, username, role } = req.body
    const invitedBy = (req as any).admin.username

    // 验证必填字段
    if (!email || !username || !role) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱、用户名和角色',
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      })
    }

    // 验证角色
    const validRoles = ['super_admin', 'admin', 'manager', 'operator', 'viewer']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色',
      })
    }

    const invitation = await createInvitation(email, username, role, invitedBy)

    res.json({
      success: true,
      message: '邀请邮件已发送',
      data: invitation,
    })
  } catch (error: any) {
    console.error('发送邀请失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '发送邀请失败',
    })
  }
}

/**
 * 获取待处理的邀请列表
 * @openapi
 * /api/manage/invitations/pending:
 *   get:
 *     tags: [Admin - Invitations]
 *     summary: 获取待处理的邀请列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
export const listPendingInvitations = async (req: Request, res: Response) => {
  try {
    const invitations = await getPendingInvitations()

    res.json({
      success: true,
      data: invitations,
    })
  } catch (error: any) {
    console.error('获取邀请列表失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取邀请列表失败',
    })
  }
}

/**
 * 获取所有邀请（分页）
 * @openapi
 * /api/manage/invitations:
 *   get:
 *     tags: [Admin - Invitations]
 *     summary: 获取所有邀请（分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
export const listAllInvitations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await getAllInvitations(page, limit)

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('获取邀请列表失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取邀请列表失败',
    })
  }
}

/**
 * 验证邀请令牌（公开接口，无需认证）
 * @openapi
 * /api/public/invitations/validate:
 *   get:
 *     tags: [Public - Invitations]
 *     summary: 验证邀请令牌
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 验证成功
 */
export const validateToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '请提供邀请令牌',
      })
    }

    const invitation = await validateInvitationToken(token as string)

    res.json({
      success: true,
      data: {
        email: invitation.email,
        username: invitation.username,
        role: invitation.role,
        invited_by: invitation.invited_by,
        expires_at: invitation.expires_at,
      },
    })
  } catch (error: any) {
    console.error('验证邀请令牌失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '验证邀请令牌失败',
    })
  }
}

/**
 * 接受邀请并设置密码（公开接口，无需认证）
 * @openapi
 * /api/public/invitations/accept:
 *   post:
 *     tags: [Public - Invitations]
 *     summary: 接受邀请并设置密码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: 接受成功
 */
export const acceptInvitationHandler = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供邀请令牌和密码',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位',
      })
    }

    const admin = await acceptInvitation(token, password)

    res.json({
      success: true,
      message: '账号创建成功，请使用用户名和密码登录',
      data: admin,
    })
  } catch (error: any) {
    console.error('接受邀请失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '接受邀请失败',
    })
  }
}

/**
 * 取消邀请
 * @openapi
 * /api/manage/invitations/{id}/cancel:
 *   post:
 *     tags: [Admin - Invitations]
 *     summary: 取消邀请
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 取消成功
 */
export const cancelInvitationHandler = async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id)

    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: '无效的邀请ID',
      })
    }

    await cancelInvitation(invitationId)

    res.json({
      success: true,
      message: '邀请已取消',
    })
  } catch (error: any) {
    console.error('取消邀请失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '取消邀请失败',
    })
  }
}

/**
 * 重新发送邀请邮件
 * @openapi
 * /api/manage/invitations/{id}/resend:
 *   post:
 *     tags: [Admin - Invitations]
 *     summary: 重新发送邀请邮件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 发送成功
 */
export const resendInvitationHandler = async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id)

    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: '无效的邀请ID',
      })
    }

    await resendInvitation(invitationId)

    res.json({
      success: true,
      message: '邀请邮件已重新发送',
    })
  } catch (error: any) {
    console.error('重新发送邀请失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '重新发送邀请失败',
    })
  }
}
