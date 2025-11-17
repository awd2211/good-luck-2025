import { Request, Response } from 'express';
import { query } from '../config/database';
import { redisCache } from '../config/redis';
import configService from '../services/configService';

const CACHE_KEY_PREFIX = 'system_configs';
// CACHE_TTL已迁移到数据库配置：cache.systemConfigs.ttl（默认7200秒）

/**
 * 获取所有系统配置（支持分页和搜索）
 */
export const getSystemConfigs = async (req: Request, res: Response) => {
  try {
    const { config_type, keyword, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (config_type) {
      conditions.push(`config_type = $${paramIndex++}`);
      params.push(config_type);
    }

    // 关键字搜索（config_key 或 description）
    if (keyword) {
      conditions.push(`(config_key ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) FROM system_configs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取分页数据
    const dataParams = [...params, Number(limit), offset];
    const result = await query(
      `SELECT * FROM system_configs ${whereClause}
       ORDER BY created_at DESC
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
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      error: error.message
    });
  }
};

/**
 * 根据配置键获取单个配置
 */
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    // 尝试从缓存获取
    const cacheKey = `${CACHE_KEY_PREFIX}:key:${key}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const result = await query(
      'SELECT * FROM system_configs WHERE config_key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    // 缓存结果
    const cacheTTL = await configService.get<number>('cache.systemConfigs.ttl', 7200);
    await redisCache.set(cacheKey, result.rows[0], cacheTTL);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取配置详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置详情失败',
      error: error.message
    });
  }
};

/**
 * 创建系统配置
 */
export const createSystemConfig = async (req: Request, res: Response) => {
  try {
    const {
      config_key,
      config_value,
      config_type,
      description,
      updated_by
    } = req.body;

    // 验证必填字段
    if (!config_key || !config_value || !config_type) {
      return res.status(400).json({
        success: false,
        message: '配置键、配置值和配置类型为必填项'
      });
    }

    // 检查配置键是否已存在
    const checkResult = await query(
      'SELECT id FROM system_configs WHERE config_key = $1',
      [config_key]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该配置键已存在'
      });
    }

    // 验证 config_value 是否为有效的 JSON
    if (typeof config_value !== 'object') {
      return res.status(400).json({
        success: false,
        message: '配置值必须是有效的JSON对象'
      });
    }

    const result = await query(
      `INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        config_key,
        JSON.stringify(config_value),
        config_type,
        description,
        updated_by
      ]
    );

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.status(201).json({
      success: true,
      message: '配置创建成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('创建配置失败:', error);
    res.status(500).json({
      success: false,
      message: '创建配置失败',
      error: error.message
    });
  }
};

/**
 * 更新系统配置
 */
export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const updates = req.body;

    // 检查配置是否存在
    const checkResult = await query(
      'SELECT id FROM system_configs WHERE config_key = $1',
      [key]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = ['config_type', 'description', 'updated_by'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        params.push(updates[field]);
      }
    }

    // 处理 JSONB 字段
    if (updates.config_value !== undefined) {
      if (typeof updates.config_value !== 'object') {
        return res.status(400).json({
          success: false,
          message: '配置值必须是有效的JSON对象'
        });
      }
      updateFields.push(`config_value = $${paramIndex++}`);
      params.push(JSON.stringify(updates.config_value));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    params.push(key);
    const sql = `UPDATE system_configs SET ${updateFields.join(', ')} WHERE config_key = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '配置更新成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('更新配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新配置失败',
      error: error.message
    });
  }
};

/**
 * 删除系统配置
 */
export const deleteSystemConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const result = await query(
      'DELETE FROM system_configs WHERE config_key = $1 RETURNING *',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    // 清除缓存
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);

    res.json({
      success: true,
      message: '配置删除成功'
    });
  } catch (error: any) {
    console.error('删除配置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除配置失败',
      error: error.message
    });
  }
};

/**
 * 获取所有配置类型
 */
export const getConfigTypes = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT DISTINCT config_type FROM system_configs ORDER BY config_type'
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.config_type)
    });
  } catch (error: any) {
    console.error('获取配置类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置类型失败',
      error: error.message
    });
  }
};

/**
 * 批量获取配置（供前端使用）
 */
export const getBatchConfigs = async (req: Request, res: Response) => {
  try {
    const { keys } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供配置键列表'
      });
    }

    const placeholders = keys.map((_, index) => `$${index + 1}`).join(',');
    const result = await query(
      `SELECT config_key, config_value FROM system_configs WHERE config_key IN (${placeholders})`,
      keys
    );

    // 转换为键值对格式
    const configs: Record<string, any> = {};
    result.rows.forEach(row => {
      configs[row.config_key] = row.config_value;
    });

    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    console.error('批量获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '批量获取配置失败',
      error: error.message
    });
  }
};
