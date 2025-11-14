/**
 * 通知模板管理路由（管理端）
 */

import express from 'express';
import pool from '../config/database';

const router = express.Router();

// 获取模板列表
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

// 获取单个模板
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

// 创建模板
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

// 更新模板
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

// 删除模板
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
