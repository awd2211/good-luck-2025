import { Request, Response } from 'express';
import { query } from '../config/database';
import { redisCache } from '../config/redis';

const CACHE_KEY_PREFIX = 'fortune_templates';
const CACHE_TTL = 3600; // 1小时

/**
 * 获取算命模板列表（支持筛选和分页）
 */
export const getFortuneTemplates = async (req: Request, res: Response) => {
  try {
    const {
      service_id,
      template_type,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (service_id) {
      conditions.push(`service_id = $${paramIndex++}`);
      params.push(service_id);
    }

    if (template_type) {
      conditions.push(`template_type = $${paramIndex++}`);
      params.push(template_type);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) FROM fortune_templates ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 查询数据
    const dataParams = [...params, Number(limit), offset];
    const dataResult = await query(
      `SELECT ft.*, fs.name as service_name, fs.code as service_code
       FROM fortune_templates ft
       LEFT JOIN fortune_services fs ON ft.service_id = fs.id
       ${whereClause}
       ORDER BY ft.created_at DESC
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
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error.message
    });
  }
};

/**
 * 获取单个算命模板详情
 */
export const getFortuneTemplate = async (req: Request, res: Response) => {
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
      `SELECT ft.*, fs.name as service_name, fs.code as service_code
       FROM fortune_templates ft
       LEFT JOIN fortune_services fs ON ft.service_id = fs.id
       WHERE ft.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 缓存结果
    await redisCache.set(cacheKey, result.rows[0], CACHE_TTL);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板详情失败',
      error: error.message
    });
  }
};

/**
 * 根据服务ID获取模板
 */
export const getTemplatesByService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { status = 'active' } = req.query;

    // 尝试从缓存获取
    const cacheKey = `${CACHE_KEY_PREFIX}:service:${serviceId}:${status}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const result = await query(
      `SELECT * FROM fortune_templates
       WHERE service_id = $1 AND status = $2
       ORDER BY created_at DESC`,
      [serviceId, status]
    );

    // 缓存结果
    await redisCache.set(cacheKey, result.rows, CACHE_TTL);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('获取服务模板失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务模板失败',
      error: error.message
    });
  }
};

/**
 * 创建算命模板
 */
export const createFortuneTemplate = async (req: Request, res: Response) => {
  try {
    const {
      service_id,
      name,
      template_type,
      content,
      rules,
      status = 'active',
      version,
      created_by
    } = req.body;

    // 验证必填字段
    if (!service_id || !name || !template_type || !content) {
      return res.status(400).json({
        success: false,
        message: '服务ID、名称、模板类型和内容为必填项'
      });
    }

    // 验证服务是否存在
    const serviceResult = await query(
      'SELECT id FROM fortune_services WHERE id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '所选服务不存在'
      });
    }

    // 验证 content 是否为有效的 JSON
    if (typeof content !== 'object') {
      return res.status(400).json({
        success: false,
        message: '模板内容必须是有效的JSON对象'
      });
    }

    const result = await query(
      `INSERT INTO fortune_templates (
        service_id, name, template_type, content, rules,
        status, version, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        service_id, name, template_type,
        JSON.stringify(content),
        rules ? JSON.stringify(rules) : null,
        status, version, created_by
      ]
    );

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.status(201).json({
      success: true,
      message: '模板创建成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('创建模板失败:', error);
    res.status(500).json({
      success: false,
      message: '创建模板失败',
      error: error.message
    });
  }
};

/**
 * 更新算命模板
 */
export const updateFortuneTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 检查模板是否存在
    const checkResult = await query(
      'SELECT id FROM fortune_templates WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 如果修改了服务，验证服务是否存在
    if (updates.service_id) {
      const serviceResult = await query(
        'SELECT id FROM fortune_services WHERE id = $1',
        [updates.service_id]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '所选服务不存在'
        });
      }
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'service_id', 'name', 'template_type', 'status', 'version', 'created_by'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        params.push(updates[field]);
      }
    }

    // 处理 JSONB 字段
    if (updates.content !== undefined) {
      if (typeof updates.content !== 'object') {
        return res.status(400).json({
          success: false,
          message: '模板内容必须是有效的JSON对象'
        });
      }
      updateFields.push(`content = $${paramIndex++}`);
      params.push(JSON.stringify(updates.content));
    }

    if (updates.rules !== undefined) {
      updateFields.push(`rules = $${paramIndex++}`);
      params.push(updates.rules ? JSON.stringify(updates.rules) : null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    params.push(id);
    const sql = `UPDATE fortune_templates SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '模板更新成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('更新模板失败:', error);
    res.status(500).json({
      success: false,
      message: '更新模板失败',
      error: error.message
    });
  }
};

/**
 * 删除算命模板
 */
export const deleteFortuneTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM fortune_templates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error: any) {
    console.error('删除模板失败:', error);
    res.status(500).json({
      success: false,
      message: '删除模板失败',
      error: error.message
    });
  }
};

/**
 * 复制模板（创建副本）
 */
export const duplicateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // 获取原模板
    const originalResult = await query(
      'SELECT * FROM fortune_templates WHERE id = $1',
      [id]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '原模板不存在'
      });
    }

    const original = originalResult.rows[0];
    const newName = name || `${original.name} (副本)`;

    // 创建副本
    const result = await query(
      `INSERT INTO fortune_templates (
        service_id, name, template_type, content, rules,
        status, version, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        original.service_id,
        newName,
        original.template_type,
        original.content,
        original.rules,
        'draft', // 副本默认为草稿状态
        original.version,
        original.created_by
      ]
    );

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.status(201).json({
      success: true,
      message: '模板复制成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('复制模板失败:', error);
    res.status(500).json({
      success: false,
      message: '复制模板失败',
      error: error.message
    });
  }
};

/**
 * 获取模板类型列表
 */
export const getTemplateTypes = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT DISTINCT template_type FROM fortune_templates ORDER BY template_type'
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.template_type)
    });
  } catch (error: any) {
    console.error('获取模板类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板类型失败',
      error: error.message
    });
  }
};
