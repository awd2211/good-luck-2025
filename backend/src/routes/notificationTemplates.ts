/**
 * 通知模板管理路由(管理端)
 */

import express from 'express';
import pool from '../config/database';

const router = express.Router();

/**
 * @openapi
 * /api/manage/notification-templates:
 *   get:
 *     summary: 获取通知模板列表
 *     description: 获取所有通知模板,支持分页
 *     tags:
 *       - Admin - Notification Templates
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取模板列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [system, promotion, announcement]
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high, urgent]
 *                           target:
 *                             type: string
 *                             enum: [all, specific, vip]
 *                           variables:
 *                             type: array
 *                             items:
 *                               type: string
 *                           isSystem:
 *                             type: boolean
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await pool.query('SELECT COUNT(*) as total FROM notification_templates');
    const total = parseInt(countResult.rows[0].total);

    const result = await pool.query(
      `SELECT * FROM notification_templates
       ORDER BY is_system DESC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // 解析 variables JSON
    const templates = result.rows.map((row: any) => ({
      ...row,
      variables: row.variables ? JSON.parse(row.variables) : [],
    }));

    res.json({
      success: true,
      data: {
        list: templates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/notification-templates/{id}:
 *   get:
 *     summary: 获取单个通知模板
 *     description: 根据ID获取通知模板详情
 *     tags:
 *       - Admin - Notification Templates
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 成功获取模板详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     type:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     target:
 *                       type: string
 *                     variables:
 *                       type: array
 *                       items:
 *                         type: string
 *                     description:
 *                       type: string
 *                     isSystem:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM notification_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    const template = {
      ...result.rows[0],
      variables: result.rows[0].variables ? JSON.parse(result.rows[0].variables) : [],
    };

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/notification-templates:
 *   post:
 *     summary: 创建通知模板
 *     description: 创建新的通知模板
 *     tags:
 *       - Admin - Notification Templates
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - title
 *               - content
 *               - type
 *               - priority
 *               - target
 *             properties:
 *               name:
 *                 type: string
 *                 description: 模板名称(唯一)
 *                 example: "order_completed"
 *               title:
 *                 type: string
 *                 description: 通知标题
 *                 example: "订单完成"
 *               content:
 *                 type: string
 *                 description: 通知内容,支持变量如{{orderNo}}
 *                 example: "您的订单{{orderNo}}已完成"
 *               type:
 *                 type: string
 *                 enum: [system, promotion, announcement]
 *                 description: 通知类型
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: 优先级
 *               target:
 *                 type: string
 *                 enum: [all, specific, vip]
 *                 description: 目标用户
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 模板变量列表
 *                 example: ["orderNo", "userName"]
 *               description:
 *                 type: string
 *                 description: 模板说明
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      title,
      content,
      type,
      priority,
      target,
      variables,
      description,
    } = req.body;

    // 检查模板名称是否已存在
    const existingResult = await pool.query(
      'SELECT id FROM notification_templates WHERE name = $1',
      [name]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: '模板名称已存在' });
    }

    const result = await pool.query(
      `INSERT INTO notification_templates (
        name, title, content, type, priority, target, variables, description, is_system
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
      RETURNING *`,
      [name, title, content, type, priority, target, variables || '[]', description]
    );

    const template = {
      ...result.rows[0],
      variables: result.rows[0].variables ? JSON.parse(result.rows[0].variables) : [],
    };

    res.json({
      success: true,
      message: '创建成功',
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/notification-templates/{id}:
 *   put:
 *     summary: 更新通知模板
 *     description: 更新指定的通知模板(系统模板不能修改)
 *     tags:
 *       - Admin - Notification Templates
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [system, promotion, announcement]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               target:
 *                 type: string
 *                 enum: [all, specific, vip]
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 不能修改系统模板
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "不能修改系统模板"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      title,
      content,
      type,
      priority,
      target,
      variables,
      description,
    } = req.body;

    // 检查是否为系统模板
    const checkResult = await pool.query(
      'SELECT is_system FROM notification_templates WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    if (checkResult.rows[0].is_system) {
      return res.status(403).json({ success: false, message: '不能修改系统模板' });
    }

    // 检查新名称是否已被使用
    if (name) {
      const existingResult = await pool.query(
        'SELECT id FROM notification_templates WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ success: false, message: '模板名称已存在' });
      }
    }

    const result = await pool.query(
      `UPDATE notification_templates
       SET name = $1, title = $2, content = $3, type = $4,
           priority = $5, target = $6, variables = $7, description = $8
       WHERE id = $9
       RETURNING *`,
      [name, title, content, type, priority, target, variables || '[]', description, id]
    );

    const template = {
      ...result.rows[0],
      variables: result.rows[0].variables ? JSON.parse(result.rows[0].variables) : [],
    };

    res.json({
      success: true,
      message: '更新成功',
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/notification-templates/{id}:
 *   delete:
 *     summary: 删除通知模板
 *     description: 删除指定的通知模板(系统模板不能删除)
 *     tags:
 *       - Admin - Notification Templates
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 不能删除系统模板
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "不能删除系统模板"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查是否为系统模板
    const checkResult = await pool.query(
      'SELECT is_system FROM notification_templates WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    if (checkResult.rows[0].is_system) {
      return res.status(403).json({ success: false, message: '不能删除系统模板' });
    }

    await pool.query('DELETE FROM notification_templates WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
