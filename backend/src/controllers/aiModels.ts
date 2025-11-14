import { Request, Response } from 'express';
import { query } from '../config/database';

/**
 * 按供应商获取AI模型（用于下拉选择）
 */
export const getAIModelsByProvider = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    const result = await query(
      `SELECT id, model_name, name, status, max_tokens, api_base_url
       FROM ai_models
       WHERE provider = $1
       ORDER BY priority DESC, created_at DESC`,
      [provider]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('获取供应商模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商模型列表失败',
      error: error.message
    });
  }
};

/**
 * 获取所有AI模型配置
 */
export const getAIModels = async (req: Request, res: Response) => {
  try {
    const { provider, status, is_active, page = 1, limit = 20 } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (provider) {
      conditions.push(`provider = $${paramIndex++}`);
      params.push(provider);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(is_active === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) FROM ai_models ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取分页数据
    const offset = (Number(page) - 1) * Number(limit);
    const dataParams = [...params, Number(limit), offset];
    const result = await query(
      `SELECT * FROM ai_models ${whereClause}
       ORDER BY priority DESC, created_at DESC
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
    console.error('获取AI模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取AI模型列表失败',
      error: error.message
    });
  }
};

/**
 * 获取单个AI模型详情
 */
export const getAIModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM ai_models WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI模型不存在'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取AI模型详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取AI模型详情失败',
      error: error.message
    });
  }
};

/**
 * 创建AI模型配置
 */
export const createAIModel = async (req: Request, res: Response) => {
  try {
    const {
      name,
      provider,
      model_name,
      api_key,
      api_base_url,
      max_tokens = 2000,
      temperature = 0.7,
      top_p = 1.0,
      frequency_penalty = 0.0,
      presence_penalty = 0.0,
      system_prompt,
      is_active = true,
      is_default = false,
      priority = 0,
      daily_limit,
      monthly_limit
    } = req.body;

    // 验证必填字段
    if (!name || !provider || !model_name || !api_key) {
      return res.status(400).json({
        success: false,
        message: '名称、供应商、模型名称和API密钥为必填项'
      });
    }

    // 检查是否已存在相同的provider和model_name
    const checkResult = await query(
      'SELECT id FROM ai_models WHERE provider = $1 AND model_name = $2',
      [provider, model_name]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该供应商和模型名称组合已存在'
      });
    }

    // 如果设置为默认模型，取消其他默认模型
    if (is_default) {
      await query(
        'UPDATE ai_models SET is_default = false WHERE provider = $1',
        [provider]
      );
    }

    const result = await query(
      `INSERT INTO ai_models (
        name, provider, model_name, api_key, api_base_url,
        max_tokens, temperature, top_p, frequency_penalty, presence_penalty,
        system_prompt, is_active, is_default, priority, daily_limit, monthly_limit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        name, provider, model_name, api_key, api_base_url,
        max_tokens, temperature, top_p, frequency_penalty, presence_penalty,
        system_prompt, is_active, is_default, priority, daily_limit, monthly_limit
      ]
    );

    res.status(201).json({
      success: true,
      message: 'AI模型创建成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('创建AI模型失败:', error);
    res.status(500).json({
      success: false,
      message: '创建AI模型失败',
      error: error.message
    });
  }
};

/**
 * 更新AI模型配置
 */
export const updateAIModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 检查模型是否存在
    const checkResult = await query(
      'SELECT * FROM ai_models WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI模型不存在'
      });
    }

    const existingModel = checkResult.rows[0];

    // 如果更新provider和model_name，检查是否重复
    if ((updates.provider && updates.provider !== existingModel.provider) ||
        (updates.model_name && updates.model_name !== existingModel.model_name)) {
      const duplicateCheck = await query(
        'SELECT id FROM ai_models WHERE provider = $1 AND model_name = $2 AND id != $3',
        [updates.provider || existingModel.provider, updates.model_name || existingModel.model_name, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该供应商和模型名称组合已存在'
        });
      }
    }

    // 如果设置为默认模型，取消其他默认模型
    if (updates.is_default === true) {
      await query(
        'UPDATE ai_models SET is_default = false WHERE provider = $1 AND id != $2',
        [updates.provider || existingModel.provider, id]
      );
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'provider', 'model_name', 'api_key', 'api_base_url',
      'max_tokens', 'temperature', 'top_p', 'frequency_penalty', 'presence_penalty',
      'system_prompt', 'is_active', 'is_default', 'priority', 'daily_limit',
      'monthly_limit', 'status', 'error_message'
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
    const sql = `UPDATE ai_models SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);

    res.json({
      success: true,
      message: 'AI模型更新成功',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('更新AI模型失败:', error);
    res.status(500).json({
      success: false,
      message: '更新AI模型失败',
      error: error.message
    });
  }
};

/**
 * 删除AI模型配置
 */
export const deleteAIModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM ai_models WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI模型不存在'
      });
    }

    res.json({
      success: true,
      message: 'AI模型删除成功'
    });
  } catch (error: any) {
    console.error('删除AI模型失败:', error);
    res.status(500).json({
      success: false,
      message: '删除AI模型失败',
      error: error.message
    });
  }
};

/**
 * 测试AI模型连接
 */
export const testAIModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { test_prompt = '你好，请简单介绍一下你自己。' } = req.body;

    const modelResult = await query(
      'SELECT * FROM ai_models WHERE id = $1',
      [id]
    );

    if (modelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI模型不存在'
      });
    }

    const model = modelResult.rows[0];

    // 导入AI服务进行测试
    const { AIService } = require('../services/aiService');
    const aiService = new AIService();

    const startTime = Date.now();
    const response = await aiService.chat(model, test_prompt);
    const duration = Date.now() - startTime;

    // 更新模型状态为正常
    await query(
      `UPDATE ai_models
       SET status = 'active', error_message = NULL, last_used_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'AI模型测试成功',
      data: {
        response,
        duration_ms: duration,
        model_info: {
          provider: model.provider,
          model_name: model.model_name
        }
      }
    });
  } catch (error: any) {
    console.error('测试AI模型失败:', error);

    // 更新模型状态为错误
    const { id } = req.params;
    await query(
      `UPDATE ai_models
       SET status = 'error', error_message = $1
       WHERE id = $2`,
      [error.message, id]
    );

    res.status(500).json({
      success: false,
      message: 'AI模型测试失败',
      error: error.message
    });
  }
};

/**
 * 获取AI模型使用统计
 */
export const getAIModelStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let dateCondition = '';
    const params: any[] = [id];
    let paramIndex = 2;

    if (start_date) {
      dateCondition += ` AND created_at >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      dateCondition += ` AND created_at <= $${paramIndex++}`;
      params.push(end_date);
    }

    const result = await query(
      `SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN success = true THEN 1 END) as success_count,
        COUNT(CASE WHEN success = false THEN 1 END) as error_count,
        COALESCE(SUM(total_tokens), 0) as total_tokens_used,
        COALESCE(SUM(cost), 0) as total_cost,
        COALESCE(AVG(duration_ms), 0) as avg_duration_ms
       FROM ai_model_usage_logs
       WHERE model_id = $1 ${dateCondition}`,
      params
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('获取AI模型统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取AI模型统计失败',
      error: error.message
    });
  }
};

/**
 * 设置默认AI模型
 */
export const setDefaultAIModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取模型信息
    const modelResult = await query(
      'SELECT provider FROM ai_models WHERE id = $1',
      [id]
    );

    if (modelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI模型不存在'
      });
    }

    const provider = modelResult.rows[0].provider;

    // 取消同provider的其他默认模型
    await query(
      'UPDATE ai_models SET is_default = false WHERE provider = $1',
      [provider]
    );

    // 设置当前模型为默认
    await query(
      'UPDATE ai_models SET is_default = true WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: '默认模型设置成功'
    });
  } catch (error: any) {
    console.error('设置默认模型失败:', error);
    res.status(500).json({
      success: false,
      message: '设置默认模型失败',
      error: error.message
    });
  }
};

/**
 * 批量更新AI模型
 */
export const batchUpdateAIModels = async (req: Request, res: Response) => {
  try {
    const { ids, data } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids参数必须是非空数组'
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'data参数必须是对象'
      });
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'is_active', 'max_tokens', 'temperature', 'top_p',
      'frequency_penalty', 'presence_penalty', 'priority',
      'daily_limit', 'monthly_limit'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        params.push(data[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    // 添加ids参数
    const placeholders = ids.map((_, index) => `$${paramIndex + index}`).join(',');
    params.push(...ids);

    const sql = `UPDATE ai_models SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;

    const result = await query(sql, params);

    res.json({
      success: true,
      message: `成功更新 ${result.rowCount} 个模型`
    });
  } catch (error: any) {
    console.error('批量更新AI模型失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新失败',
      error: error.message
    });
  }
};

/**
 * 批量删除AI模型
 */
export const batchDeleteAIModels = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids参数必须是非空数组'
      });
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');

    const result = await query(
      `DELETE FROM ai_models WHERE id IN (${placeholders})`,
      ids
    );

    res.json({
      success: true,
      message: `成功删除 ${result.rowCount} 个模型`
    });
  } catch (error: any) {
    console.error('批量删除AI模型失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  }
};
