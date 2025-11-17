import { Request, Response } from 'express';
import { query } from '../config/database';
import { redisCache } from '../config/redis';
import configService from '../services/configService';

const CACHE_KEY_PREFIX = 'fortune_services';
// CACHE_TTL已迁移到数据库配置：cache.fortuneServices.ttl（默认3600秒）

/**
 * 获取所有算命服务（支持筛选和分页）
 */
export const getFortuneServices = async (req: Request, res: Response) => {
  try {
    const {
      category_id,
      status,
      is_hot,
      is_new,
      is_recommended,
      page = 1,
      limit = 20,
      keyword
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (category_id) {
      conditions.push(`category_id = $${paramIndex++}`);
      params.push(category_id);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (is_hot !== undefined) {
      conditions.push(`is_hot = $${paramIndex++}`);
      params.push(is_hot === 'true');
    }

    if (is_new !== undefined) {
      conditions.push(`is_new = $${paramIndex++}`);
      params.push(is_new === 'true');
    }

    if (is_recommended !== undefined) {
      conditions.push(`is_recommended = $${paramIndex++}`);
      params.push(is_recommended === 'true');
    }

    if (keyword) {
      conditions.push(`(name ILIKE $${paramIndex} OR subtitle ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) FROM fortune_services ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 查询数据
    const dataParams = [...params, Number(limit), offset];
    const dataResult = await query(
      `SELECT fs.*, fc.name as category_name
       FROM fortune_services fs
       LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
       ${whereClause}
       ORDER BY fs.sort_order ASC, fs.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    res.json({
      success: true,
      data: {
        list: dataResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('获取服务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务列表失败',
      error: error.message
    });
  }
};

/**
 * 获取单个算命服务详情
 */
export const getFortuneService = async (req: Request, res: Response) => {
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
      `SELECT fs.*, fc.name as category_name, fc.code as category_code
       FROM fortune_services fs
       LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
       WHERE fs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    // 缓存结果
    const cacheTTL = await configService.get<number>("cache.fortuneServices.ttl", 3600);
    await redisCache.set(cacheKey, result.rows[0], cacheTTL);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取服务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务详情失败',
      error: error.message
    });
  }
};

/**
 * 创建算命服务
 */
export const createFortuneService = async (req: Request, res: Response) => {
  try {
    const {
      category_id,
      name,
      code,
      subtitle,
      description,
      detail_content,
      cover_image,
      images,
      original_price,
      current_price,
      vip_price,
      duration,
      is_free_trial,
      trial_times,
      status = 'draft',
      scheduled_start,
      scheduled_end,
      sort_order = 0,
      is_hot = false,
      is_new = false,
      is_recommended = false,
      tags
    } = req.body;

    // 验证必填字段
    if (!name || !code || !category_id || original_price === undefined || current_price === undefined) {
      return res.status(400).json({
        success: false,
        message: '名称、代码、分类、原价和现价为必填项'
      });
    }

    // 检查代码是否已存在
    const checkResult = await query(
      'SELECT id FROM fortune_services WHERE code = $1',
      [code]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该代码已存在'
      });
    }

    // 验证分类是否存在
    const categoryResult = await query(
      'SELECT id FROM fortune_categories WHERE id = $1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '所选分类不存在'
      });
    }

    const result = await query(
      `INSERT INTO fortune_services (
        category_id, name, code, subtitle, description, detail_content,
        cover_image, images, original_price, current_price, vip_price,
        duration, is_free_trial, trial_times, status, scheduled_start, scheduled_end,
        sort_order, is_hot, is_new, is_recommended, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        category_id, name, code, subtitle, description, detail_content,
        cover_image, images, original_price, current_price, vip_price,
        duration, is_free_trial, trial_times, status, scheduled_start, scheduled_end,
        sort_order, is_hot, is_new, is_recommended, tags
      ]
    );

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.status(201).json({
      success: true,
      message: '服务创建成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('创建服务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建服务失败',
      error: error.message
    });
  }
};

/**
 * 更新算命服务
 */
export const updateFortuneService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 检查服务是否存在
    const checkResult = await query(
      'SELECT id FROM fortune_services WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    // 如果修改了代码，检查新代码是否已被使用
    if (updates.code) {
      const codeCheckResult = await query(
        'SELECT id FROM fortune_services WHERE code = $1 AND id != $2',
        [updates.code, id]
      );

      if (codeCheckResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该代码已被其他服务使用'
        });
      }
    }

    // 如果修改了分类，验证分类是否存在
    if (updates.category_id) {
      const categoryResult = await query(
        'SELECT id FROM fortune_categories WHERE id = $1',
        [updates.category_id]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '所选分类不存在'
        });
      }
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'category_id', 'name', 'code', 'subtitle', 'description', 'detail_content',
      'cover_image', 'images', 'original_price', 'current_price', 'vip_price',
      'duration', 'is_free_trial', 'trial_times', 'status', 'scheduled_start',
      'scheduled_end', 'sort_order', 'is_hot', 'is_new', 'is_recommended', 'tags'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    params.push(id);
    const sql = `UPDATE fortune_services SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '服务更新成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('更新服务失败:', error);
    res.status(500).json({
      success: false,
      message: '更新服务失败',
      error: error.message
    });
  }
};

/**
 * 删除算命服务
 */
export const deleteFortuneService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查是否有模板使用该服务
    const templateCheck = await query(
      'SELECT COUNT(*) FROM fortune_templates WHERE service_id = $1',
      [id]
    );

    if (parseInt(templateCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: '该服务下还有模板，无法删除'
      });
    }

    const result = await query(
      'DELETE FROM fortune_services WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '服务删除成功'
    });
  } catch (error: any) {
    console.error('删除服务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除服务失败',
      error: error.message
    });
  }
};

/**
 * 批量更新服务状态（上下架）
 */
export const batchUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要更新的服务'
      });
    }

    if (!['draft', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    await query('BEGIN');

    try {
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      const result = await query(
        `UPDATE fortune_services SET status = $${ids.length + 1} WHERE id IN (${placeholders}) RETURNING id`,
        [...ids, status]
      );

      await query('COMMIT');

      // 清除缓存
      await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

      res.json({
        success: true,
        message: `成功更新 ${result.rows.length} 个服务的状态`,
        data: {
          updated: result.rows.length
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('批量更新状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新状态失败',
      error: error.message
    });
  }
};

/**
 * 更新服务浏览量
 */
export const incrementViewCount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE fortune_services SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:detail:${id}`);

    res.json({
      success: true,
      data: {
        view_count: result.rows[0].view_count
      }
    });
  } catch (error: any) {
    console.error('更新浏览量失败:', error);
    res.status(500).json({
      success: false,
      message: '更新浏览量失败',
      error: error.message
    });
  }
};

/**
 * 获取服务统计数据
 */
export const getServiceStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        view_count,
        order_count,
        rating,
        review_count
       FROM fortune_services
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取服务统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务统计失败',
      error: error.message
    });
  }
};

/**
 * 获取所有服务的统计概览
 */
export const getAllServicesStats = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_hot = true THEN 1 END) as hot_count,
        COUNT(CASE WHEN is_new = true THEN 1 END) as new_count,
        COUNT(CASE WHEN is_recommended = true THEN 1 END) as recommended_count,
        COALESCE(SUM(order_count * current_price), 0) as total_sales,
        COALESCE(AVG(rating), 0) as avg_rating
       FROM fortune_services`
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取统计概览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计概览失败',
      error: error.message
    });
  }
};

/**
 * 批量更新服务（支持更新任意字段）
 */
export const batchUpdateServices = async (req: Request, res: Response) => {
  try {
    const { ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要更新的服务'
      });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要更新的数据'
      });
    }

    await query('BEGIN');

    try {
      // 构建更新语句
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      const allowedFields = [
        'status', 'is_hot', 'is_new', 'is_recommended',
        'original_price', 'current_price', 'vip_price',
        'sort_order', 'category_id'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex++}`);
          params.push(data[field]);
        }
      }

      // 处理折扣率
      if (data.discount_rate !== undefined && data.discount_rate > 0 && data.discount_rate <= 100) {
        const discountMultiplier = data.discount_rate / 100;
        updateFields.push(`current_price = original_price * $${paramIndex++}`);
        params.push(discountMultiplier);
      }

      if (updateFields.length === 0) {
        await query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '没有有效的更新字段'
        });
      }

      const placeholders = ids.map((_, index) => `$${paramIndex + index}`).join(',');
      params.push(...ids);

      const sql = `UPDATE fortune_services SET ${updateFields.join(', ')} WHERE id IN (${placeholders}) RETURNING id`;
      const result = await query(sql, params);

      await query('COMMIT');

      // 清除缓存
      await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

      res.json({
        success: true,
        message: `成功更新 ${result.rows.length} 个服务`,
        data: {
          updated: result.rows.length
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('批量更新服务失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新服务失败',
      error: error.message
    });
  }
};

/**
 * 批量删除服务
 */
export const batchDeleteServices = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要删除的服务'
      });
    }

    await query('BEGIN');

    try {
      // 检查是否有模板使用这些服务
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      const templateCheck = await query(
        `SELECT COUNT(*) FROM fortune_templates WHERE service_id IN (${placeholders})`,
        ids
      );

      if (parseInt(templateCheck.rows[0].count) > 0) {
        await query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '部分服务下还有模板，无法删除'
        });
      }

      const result = await query(
        `DELETE FROM fortune_services WHERE id IN (${placeholders}) RETURNING id`,
        ids
      );

      await query('COMMIT');

      // 清除缓存
      await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

      res.json({
        success: true,
        message: `成功删除 ${result.rows.length} 个服务`,
        data: {
          deleted: result.rows.length
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('批量删除服务失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除服务失败',
      error: error.message
    });
  }
};

/**
 * 导出服务数据
 */
export const exportServices = async (req: Request, res: Response) => {
  try {
    const {
      category_id,
      status,
      is_hot,
      is_new,
      is_recommended,
      keyword
    } = req.query;

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (category_id) {
      conditions.push(`category_id = $${paramIndex++}`);
      params.push(category_id);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (is_hot !== undefined) {
      conditions.push(`is_hot = $${paramIndex++}`);
      params.push(is_hot === 'true');
    }

    if (is_new !== undefined) {
      conditions.push(`is_new = $${paramIndex++}`);
      params.push(is_new === 'true');
    }

    if (is_recommended !== undefined) {
      conditions.push(`is_recommended = $${paramIndex++}`);
      params.push(is_recommended === 'true');
    }

    if (keyword) {
      conditions.push(`(name ILIKE $${paramIndex} OR subtitle ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT fs.*, fc.name as category_name
       FROM fortune_services fs
       LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
       ${whereClause}
       ORDER BY fs.sort_order ASC, fs.created_at DESC`,
      params
    );

    // 设置响应头为JSON文件下载
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=fortune_services_${Date.now()}.json`);

    res.json({
      success: true,
      data: result.rows,
      exported_at: new Date().toISOString(),
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('导出服务失败:', error);
    res.status(500).json({
      success: false,
      message: '导出服务失败',
      error: error.message
    });
  }
};

/**
 * 导入服务数据
 */
export const importServices = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的导入数据'
      });
    }

    await query('BEGIN');

    try {
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const service of data) {
        try {
          // 检查代码是否已存在
          const checkResult = await query(
            'SELECT id FROM fortune_services WHERE code = $1',
            [service.code]
          );

          if (checkResult.rows.length > 0) {
            skipped++;
            continue;
          }

          // 验证分类是否存在
          if (service.category_id) {
            const categoryResult = await query(
              'SELECT id FROM fortune_categories WHERE id = $1',
              [service.category_id]
            );

            if (categoryResult.rows.length === 0) {
              errors.push(`服务 ${service.name}: 分类不存在`);
              continue;
            }
          }

          // 插入数据
          await query(
            `INSERT INTO fortune_services (
              category_id, name, code, subtitle, description, detail_content,
              cover_image, images, original_price, current_price, vip_price,
              duration, is_free_trial, trial_times, status, scheduled_start, scheduled_end,
              sort_order, is_hot, is_new, is_recommended, tags
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
              service.category_id,
              service.name,
              service.code,
              service.subtitle || null,
              service.description || null,
              service.detail_content || null,
              service.cover_image || null,
              service.images || null,
              service.original_price,
              service.current_price,
              service.vip_price || null,
              service.duration || null,
              service.is_free_trial || false,
              service.trial_times || null,
              service.status || 'draft',
              service.scheduled_start || null,
              service.scheduled_end || null,
              service.sort_order || 0,
              service.is_hot || false,
              service.is_new || false,
              service.is_recommended || false,
              service.tags || null
            ]
          );

          imported++;
        } catch (error: any) {
          errors.push(`服务 ${service.name}: ${error.message}`);
        }
      }

      await query('COMMIT');

      // 清除缓存
      await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

      res.json({
        success: true,
        message: `导入完成: 成功 ${imported} 个, 跳过 ${skipped} 个, 失败 ${errors.length} 个`,
        data: {
          imported,
          skipped,
          errors: errors.slice(0, 10) // 只返回前10条错误
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('导入服务失败:', error);
    res.status(500).json({
      success: false,
      message: '导入服务失败',
      error: error.message
    });
  }
};
