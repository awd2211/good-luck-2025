import { Request, Response } from 'express';
import { query } from '../config/database';
import { redisCache } from '../config/redis';
import configService from '../services/configService';

const CACHE_KEY_PREFIX = 'fortune_categories';
// CACHE_TTL已迁移到数据库配置：cache.fortuneCategories.ttl（默认3600秒）

/**
 * 获取所有算命服务分类
 */
export const getFortuneCategories = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE status = $${paramIndex++}`;
      params.push(status);
    }

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) FROM fortune_categories ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取分页数据
    const dataParams = [...params, Number(limit), offset];
    const result = await query(
      `SELECT * FROM fortune_categories ${whereClause}
       ORDER BY sort_order ASC, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('获取分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类失败',
      error: error.message
    });
  }
};

/**
 * 获取单个算命服务分类
 */
export const getFortuneCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 尝试从缓存获取
    const cacheKey = `${CACHE_KEY_PREFIX}:detail:${id}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const result = await query(
      'SELECT * FROM fortune_categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 缓存结果
    const cacheTTL = await configService.get<number>("cache.fortuneCategories.ttl", 3600);
    await redisCache.set(cacheKey, result.rows[0], cacheTTL);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类详情失败',
      error: error.message
    });
  }
};

/**
 * 创建算命服务分类
 */
export const createFortuneCategory = async (req: Request, res: Response) => {
  try {
    const { name, code, icon, description, sort_order } = req.body;

    // 验证必填字段
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: '名称和代码为必填项'
      });
    }

    // 检查代码是否已存在
    const checkResult = await query(
      'SELECT id FROM fortune_categories WHERE code = $1',
      [code]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该代码已存在'
      });
    }

    const result = await query(
      `INSERT INTO fortune_categories (name, code, icon, description, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [name, code, icon || null, description || null, sort_order || 0]
    );

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败',
      error: error.message
    });
  }
};

/**
 * 更新算命服务分类
 */
export const updateFortuneCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, icon, description, sort_order, status } = req.body;

    // 检查分类是否存在
    const checkResult = await query(
      'SELECT id FROM fortune_categories WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 如果修改了代码，检查新代码是否已被使用
    if (code) {
      const codeCheckResult = await query(
        'SELECT id FROM fortune_categories WHERE code = $1 AND id != $2',
        [code, id]
      );

      if (codeCheckResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该代码已被其他分类使用'
        });
      }
    }

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (code !== undefined) {
      updates.push(`code = $${paramIndex++}`);
      params.push(code);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      params.push(icon);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(sort_order);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    params.push(id);
    const sql = `UPDATE fortune_categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '分类更新成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error.message
    });
  }
};

/**
 * 删除算命服务分类
 */
export const deleteFortuneCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查是否有服务使用该分类
    const serviceCheck = await query(
      'SELECT COUNT(*) FROM fortune_services WHERE category_id = $1',
      [id]
    );

    if (parseInt(serviceCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: '该分类下还有服务，无法删除'
      });
    }

    const result = await query(
      'DELETE FROM fortune_categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error: any) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败',
      error: error.message
    });
  }
};

/**
 * 调整分类排序
 */
export const updateCategoriesOrder = async (req: Request, res: Response) => {
  try {
    const { orders } = req.body; // [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }]

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: '排序数据格式错误'
      });
    }

    // 使用事务更新排序
    await query('BEGIN');

    try {
      for (const item of orders) {
        await query(
          'UPDATE fortune_categories SET sort_order = $1 WHERE id = $2',
          [item.sort_order, item.id]
        );
      }

      await query('COMMIT');

      // 清除缓存
      await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

      res.json({
        success: true,
        message: '排序更新成功'
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('更新排序失败:', error);
    res.status(500).json({
      success: false,
      message: '更新排序失败',
      error: error.message
    });
  }
};
