/**
 * AI智能客服机器人服务层
 * 支持多AI模型(OpenAI GPT, Anthropic Claude, DeepSeek等)
 */

import { query } from '../../config/database';
import axios from 'axios';

export interface AIBotConfig {
  id: number;
  bot_name: string;
  provider: string;
  model_name: string;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIConversationLog {
  id: number;
  session_id: number | null;
  user_message: string;
  ai_response: string | null;
  bot_config_id: number | null;
  model_used: string | null;
  tokens_used: number | null;
  response_time: number | null;
  success: boolean;
  error_message: string | null;
  created_at: Date;
}

/**
 * 获取可用的AI配置(按优先级)
 */
export const getAvailableAIConfig = async (): Promise<AIBotConfig | null> => {
  const result = await query(
    `SELECT * FROM ai_bot_configs
     WHERE is_active = true
     ORDER BY priority DESC, id ASC
     LIMIT 1`
  );

  return result.rows[0] || null;
};

/**
 * 获取所有AI配置
 */
export const getAllAIConfigs = async (): Promise<AIBotConfig[]> => {
  const result = await query(
    `SELECT * FROM ai_bot_configs
     ORDER BY priority DESC, id ASC`
  );

  return result.rows;
};

/**
 * 创建AI配置
 */
export const createAIConfig = async (data: {
  botName: string;
  provider: string;
  modelName: string;
  apiEndpoint?: string;
  apiKey?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  priority?: number;
}): Promise<AIBotConfig> => {
  const {
    botName,
    provider,
    modelName,
    apiEndpoint,
    apiKey,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 500,
    priority = 0
  } = data;

  // 简单加密(生产环境应使用更安全的加密方式)
  const apiKeyEncrypted = apiKey ? Buffer.from(apiKey).toString('base64') : null;

  const result = await query(
    `INSERT INTO ai_bot_configs
     (bot_name, provider, model_name, api_endpoint, api_key_encrypted,
      system_prompt, temperature, max_tokens, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [botName, provider, modelName, apiEndpoint, apiKeyEncrypted,
     systemPrompt, temperature, maxTokens, priority]
  );

  return result.rows[0];
};

/**
 * 更新AI配置
 */
export const updateAIConfig = async (
  id: number,
  data: Partial<AIBotConfig>
): Promise<AIBotConfig | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return null;
  }

  values.push(id);

  const result = await query(
    `UPDATE ai_bot_configs
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * 删除AI配置
 */
export const deleteAIConfig = async (id: number): Promise<boolean> => {
  const result = await query(
    'DELETE FROM ai_bot_configs WHERE id = $1 RETURNING id',
    [id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * 简单解密API Key
 */
const decryptApiKey = (encrypted: string | null): string | null => {
  if (!encrypted) return null;
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return null;
  }
};

/**
 * 调用OpenAI GPT API
 */
const callOpenAI = async (
  config: AIBotConfig,
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{ response: string; tokensUsed: number }> => {
  const apiKey = decryptApiKey(config.api_key_encrypted);
  if (!apiKey) throw new Error('API Key未配置');

  const endpoint = config.api_endpoint || 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: config.system_prompt || '你是一个专业的客服助手,请礼貌、专业地回答用户问题。' },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await axios.post(
    endpoint,
    {
      model: config.model_name,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return {
    response: response.data.choices[0].message.content,
    tokensUsed: response.data.usage.total_tokens
  };
};

/**
 * 调用Anthropic Claude API
 */
const callClaude = async (
  config: AIBotConfig,
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{ response: string; tokensUsed: number }> => {
  const apiKey = decryptApiKey(config.api_key_encrypted);
  if (!apiKey) throw new Error('API Key未配置');

  const endpoint = config.api_endpoint || 'https://api.anthropic.com/v1/messages';

  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];

  const response = await axios.post(
    endpoint,
    {
      model: config.model_name,
      messages,
      system: config.system_prompt || '你是一个专业的客服助手,请礼貌、专业地回答用户问题。',
      temperature: config.temperature,
      max_tokens: config.max_tokens
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return {
    response: response.data.content[0].text,
    tokensUsed: response.data.usage.input_tokens + response.data.usage.output_tokens
  };
};

/**
 * 调用DeepSeek API
 */
const callDeepSeek = async (
  config: AIBotConfig,
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{ response: string; tokensUsed: number }> => {
  const apiKey = decryptApiKey(config.api_key_encrypted);
  if (!apiKey) throw new Error('API Key未配置');

  const endpoint = config.api_endpoint || 'https://api.deepseek.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: config.system_prompt || '你是一个专业的客服助手,请礼貌、专业地回答用户问题。' },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await axios.post(
    endpoint,
    {
      model: config.model_name,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return {
    response: response.data.choices[0].message.content,
    tokensUsed: response.data.usage.total_tokens
  };
};

/**
 * AI对话主函数
 */
export const chatWithAI = async (
  userMessage: string,
  sessionId?: number,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{
  response: string;
  botConfigId: number;
  modelUsed: string;
  tokensUsed: number;
  responseTime: number;
}> => {
  const startTime = Date.now();

  // 获取可用的AI配置
  const config = await getAvailableAIConfig();
  if (!config) {
    throw new Error('没有可用的AI配置');
  }

  let aiResponse: string;
  let tokensUsed: number;

  try {
    // 根据provider调用不同的API
    let result: { response: string; tokensUsed: number };

    switch (config.provider.toLowerCase()) {
      case 'openai':
        result = await callOpenAI(config, userMessage, conversationHistory);
        break;
      case 'anthropic':
      case 'claude':
        result = await callClaude(config, userMessage, conversationHistory);
        break;
      case 'deepseek':
        result = await callDeepSeek(config, userMessage, conversationHistory);
        break;
      default:
        throw new Error(`不支持的AI提供商: ${config.provider}`);
    }

    aiResponse = result.response;
    tokensUsed = result.tokensUsed;

    const responseTime = Date.now() - startTime;

    // 记录对话日志
    await query(
      `INSERT INTO ai_conversation_logs
       (session_id, user_message, ai_response, bot_config_id, model_used,
        tokens_used, response_time, success)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [sessionId || null, userMessage, aiResponse, config.id, config.model_name,
       tokensUsed, responseTime]
    );

    return {
      response: aiResponse,
      botConfigId: config.id,
      modelUsed: config.model_name,
      tokensUsed,
      responseTime
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // 记录错误日志
    await query(
      `INSERT INTO ai_conversation_logs
       (session_id, user_message, bot_config_id, model_used,
        response_time, success, error_message)
       VALUES ($1, $2, $3, $4, $5, false, $6)`,
      [sessionId || null, userMessage, config.id, config.model_name,
       responseTime, error.message]
    );

    throw error;
  }
};

/**
 * 获取AI对话日志
 */
export const getAILogs = async (filters?: {
  sessionId?: number;
  startDate?: string;
  endDate?: string;
  success?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: AIConversationLog[]; total: number }> => {
  const {
    sessionId,
    startDate,
    endDate,
    success,
    page = 1,
    limit = 50
  } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (sessionId) {
    whereConditions.push(`session_id = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  if (success !== undefined) {
    whereConditions.push(`success = $${paramIndex++}`);
    params.push(success);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // 查询总数
  const countResult = await query(
    `SELECT COUNT(*) FROM ai_conversation_logs ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 查询数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const result = await query(
    `SELECT * FROM ai_conversation_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  return {
    data: result.rows,
    total
  };
};

/**
 * 获取AI使用统计
 */
export const getAIStatistics = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalConversations: number;
  successfulConversations: number;
  failedConversations: number;
  successRate: number;
  totalTokensUsed: number;
  avgResponseTime: number;
  avgTokensPerConversation: number;
  modelUsageDistribution: { model: string; count: number; tokens: number }[];
}> => {
  const { startDate, endDate } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // 总体统计
  const overallResult = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
       SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
       SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as success_rate,
       SUM(tokens_used) as total_tokens,
       AVG(response_time) as avg_response_time,
       AVG(tokens_used) as avg_tokens
     FROM ai_conversation_logs
     ${whereClause}`,
    params
  );

  const stats = overallResult.rows[0];

  // 模型使用分布
  const modelDistResult = await query(
    `SELECT
       model_used as model,
       COUNT(*) as count,
       SUM(tokens_used) as tokens
     FROM ai_conversation_logs
     ${whereClause}
     GROUP BY model_used
     ORDER BY count DESC`,
    params
  );

  return {
    totalConversations: parseInt(stats.total),
    successfulConversations: parseInt(stats.successful || 0),
    failedConversations: parseInt(stats.failed || 0),
    successRate: parseFloat(stats.success_rate || 0),
    totalTokensUsed: parseInt(stats.total_tokens || 0),
    avgResponseTime: parseFloat(stats.avg_response_time || 0),
    avgTokensPerConversation: parseFloat(stats.avg_tokens || 0),
    modelUsageDistribution: modelDistResult.rows.map(row => ({
      model: row.model,
      count: parseInt(row.count),
      tokens: parseInt(row.tokens || 0)
    }))
  };
};

/**
 * 获取会话的完整AI对话历史
 */
export const getSessionAIHistory = async (
  sessionId: number
): Promise<{ role: string; content: string }[]> => {
  const result = await query(
    `SELECT user_message, ai_response
     FROM ai_conversation_logs
     WHERE session_id = $1 AND success = true
     ORDER BY created_at ASC`,
    [sessionId]
  );

  const history: { role: string; content: string }[] = [];

  result.rows.forEach(row => {
    history.push({ role: 'user', content: row.user_message });
    if (row.ai_response) {
      history.push({ role: 'assistant', content: row.ai_response });
    }
  });

  return history;
};
