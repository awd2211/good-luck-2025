/**
 * 用户端反馈路由
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { authenticateUser } from '../../middleware/userAuth';

const router = Router();

/**
 * @openapi
 * /api/feedbacks:
 *   post:
 *     summary: 提交反馈
 *     description: 用户提交反馈意见
 *     tags:
 *       - User - Feedbacks
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [bug, suggestion, complaint, praise, other]
 *                 description: 反馈类型
 *                 example: suggestion
 *               title:
 *                 type: string
 *                 description: 反馈标题
 *                 example: 希望增加更多算命类型
 *               content:
 *                 type: string
 *                 description: 反馈内容
 *                 example: 希望能增加塔罗牌占卜功能
 *               contact_info:
 *                 type: string
 *                 description: 联系方式（可选）
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: 提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 反馈提交成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: feedback_123
 *       400:
 *         description: 参数错误
 */
router.post('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { type, title, content, contact_info } = req.body;

    // 参数验证
    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: '反馈类型、标题和内容不能为空'
      });
    }

    // 验证反馈类型
    const validTypes = ['bug', 'suggestion', 'complaint', 'praise', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '反馈类型无效'
      });
    }

    // 插入反馈记录
    const result = await pool.query(
      `INSERT INTO feedbacks (user_id, type, title, content, contact_info, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING id`,
      [userId, type, title, content, contact_info || null]
    );

    res.status(201).json({
      success: true,
      message: '反馈提交成功，我们会尽快处理',
      data: {
        id: result.rows[0].id
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/feedbacks/my:
 *   get:
 *     summary: 获取我的反馈列表
 *     description: 获取当前用户的所有反馈记录
 *     tags:
 *       - User - Feedbacks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, resolved, closed]
 *         description: 按状态筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       status:
 *                         type: string
 *                       reply:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       updated_at:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/my', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM feedbacks ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取反馈列表
    const result = await pool.query(
      `SELECT id, type, title, content, status, reply, contact_info,
              created_at, updated_at
       FROM feedbacks
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/feedbacks/{id}:
 *   get:
 *     summary: 获取反馈详情
 *     description: 获取指定反馈的详细信息（仅限自己的反馈）
 *     tags:
 *       - User - Feedbacks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 反馈不存在
 *       403:
 *         description: 无权访问
 */
router.get('/:id', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, type, title, content, status, reply, contact_info,
              created_at, updated_at
       FROM feedbacks
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '反馈不存在或无权访问'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
