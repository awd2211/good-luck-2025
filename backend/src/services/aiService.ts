import axios, { AxiosInstance } from 'axios';
import { query } from '../config/database';

interface AIModel {
  id: number;
  name: string;
  provider: string;
  model_name: string;
  api_key: string;
  api_base_url: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt?: string;
  daily_limit?: number;
  monthly_limit?: number;
  priority?: number;
  status?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages?: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  retry?: number;
  timeout?: number;
  enableCache?: boolean;
}

interface UsageLog {
  model_id: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  duration_ms: number;
  success: boolean;
  error_message?: string;
}

export class AIService {
  private axiosInstance: AxiosInstance;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL = 300000; // 5分钟缓存

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 定期清理过期缓存
    setInterval(() => this.cleanCache(), 60000);
  }

  /**
   * 发送聊天请求（带缓存和重试）
   */
  async chat(model: AIModel, userMessage: string, options: ChatOptions = {}): Promise<any> {
    const enableCache = options.enableCache !== false; // 默认启用缓存
    const maxRetries = options.retry || 3;

    // 检查缓存
    if (enableCache) {
      const cacheKey = this.generateCacheKey(model, userMessage, options);
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log('返回缓存结果');
        return cached.data;
      }
    }

    // 带重试的请求
    let lastError: Error | null = null;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const startTime = Date.now();
        const result = await this.executeChatRequest(model, userMessage, options);
        const duration = Date.now() - startTime;

        // 记录成功日志
        await this.logUsage({
          model_id: model.id,
          prompt_tokens: result.usage?.prompt_tokens || 0,
          completion_tokens: result.usage?.completion_tokens || 0,
          total_tokens: result.usage?.total_tokens || 0,
          cost: this.estimateCost(model, result.usage?.total_tokens || 0),
          duration_ms: duration,
          success: true,
        });

        // 缓存结果
        if (enableCache) {
          const cacheKey = this.generateCacheKey(model, userMessage, options);
          this.requestCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }

        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`重试 ${i + 1}/${maxRetries} 失败:`, error.message);

        // 记录失败日志
        await this.logUsage({
          model_id: model.id,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost: 0,
          duration_ms: 0,
          success: false,
          error_message: error.message,
        });

        // 等待后重试（指数退避）
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * 执行实际的聊天请求
   */
  private async executeChatRequest(model: AIModel, userMessage: string, options: ChatOptions = {}): Promise<any> {
    const messages: ChatMessage[] = options.messages || [];

    // 添加系统提示词
    if (model.system_prompt && messages.length === 0) {
      messages.push({
        role: 'system',
        content: model.system_prompt,
      });
    }

    // 添加用户消息
    messages.push({
      role: 'user',
      content: userMessage,
    });

    switch (model.provider) {
      case 'openai':
        return this.chatOpenAI(model, messages, options);
      case 'grok':
        return this.chatGrok(model, messages, options);
      case 'qwen':
        return this.chatQwen(model, messages, options);
      case 'deepseek':
        return this.chatDeepSeek(model, messages, options);
      default:
        throw new Error(`不支持的AI供应商: ${model.provider}`);
    }
  }

  /**
   * OpenAI API调用
   */
  private async chatOpenAI(model: AIModel, messages: ChatMessage[], options: ChatOptions): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `${model.api_base_url}/chat/completions`,
        {
          model: model.model_name,
          messages,
          max_tokens: options.max_tokens || model.max_tokens,
          temperature: options.temperature || model.temperature,
          top_p: options.top_p || model.top_p,
          frequency_penalty: model.frequency_penalty,
          presence_penalty: model.presence_penalty,
          stream: options.stream || false,
        },
        {
          headers: {
            'Authorization': `Bearer ${model.api_key}`,
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        finish_reason: response.data.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error('OpenAI API调用失败:', error.response?.data || error.message);
      throw new Error(`OpenAI API调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Grok API调用
   */
  private async chatGrok(model: AIModel, messages: ChatMessage[], options: ChatOptions): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `${model.api_base_url}/chat/completions`,
        {
          model: model.model_name,
          messages,
          max_tokens: options.max_tokens || model.max_tokens,
          temperature: options.temperature || model.temperature,
          top_p: options.top_p || model.top_p,
          stream: options.stream || false,
        },
        {
          headers: {
            'Authorization': `Bearer ${model.api_key}`,
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        finish_reason: response.data.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error('Grok API调用失败:', error.response?.data || error.message);
      throw new Error(`Grok API调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Qwen API调用 (通义千问)
   */
  private async chatQwen(model: AIModel, messages: ChatMessage[], options: ChatOptions): Promise<any> {
    try {
      // 通义千问API格式
      const response = await this.axiosInstance.post(
        `${model.api_base_url}/services/aigc/text-generation/generation`,
        {
          model: model.model_name,
          input: {
            messages,
          },
          parameters: {
            max_tokens: options.max_tokens || model.max_tokens,
            temperature: options.temperature || model.temperature,
            top_p: options.top_p || model.top_p,
            result_format: 'message',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${model.api_key}`,
            'X-DashScope-SSE': 'disable',
          },
        }
      );

      return {
        content: response.data.output.choices[0].message.content,
        usage: response.data.usage,
        model: model.model_name,
        finish_reason: response.data.output.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error('Qwen API调用失败:', error.response?.data || error.message);
      throw new Error(`Qwen API调用失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * DeepSeek API调用
   * 兼容OpenAI格式，支持deepseek-chat、deepseek-coder、deepseek-reasoner等模型
   */
  private async chatDeepSeek(model: AIModel, messages: ChatMessage[], options: ChatOptions): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `${model.api_base_url}/chat/completions`,
        {
          model: model.model_name,
          messages,
          max_tokens: options.max_tokens || model.max_tokens,
          temperature: options.temperature || model.temperature,
          top_p: options.top_p || model.top_p,
          frequency_penalty: model.frequency_penalty,
          presence_penalty: model.presence_penalty,
          stream: options.stream || false,
        },
        {
          headers: {
            'Authorization': `Bearer ${model.api_key}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        finish_reason: response.data.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error('DeepSeek API调用失败:', error.response?.data || error.message);
      throw new Error(`DeepSeek API调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 流式聊天 (支持SSE)
   */
  async *chatStream(model: AIModel, userMessage: string, options: ChatOptions = {}): AsyncGenerator<string> {
    const messages: ChatMessage[] = options.messages || [];

    if (model.system_prompt && messages.length === 0) {
      messages.push({
        role: 'system',
        content: model.system_prompt,
      });
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    const requestBody = {
      model: model.model_name,
      messages,
      max_tokens: options.max_tokens || model.max_tokens,
      temperature: options.temperature || model.temperature,
      top_p: options.top_p || model.top_p,
      stream: true,
    };

    let headers: any = {
      'Content-Type': 'application/json',
    };

    let url = '';

    switch (model.provider) {
      case 'openai':
      case 'grok':
      case 'deepseek':
        url = `${model.api_base_url}/chat/completions`;
        headers['Authorization'] = `Bearer ${model.api_key}`;
        break;
      case 'qwen':
        url = `${model.api_base_url}/services/aigc/text-generation/generation`;
        headers['Authorization'] = `Bearer ${model.api_key}`;
        headers['X-DashScope-SSE'] = 'enable';
        break;
      default:
        throw new Error(`不支持的AI供应商: ${model.provider}`);
    }

    try {
      const response = await axios.post(url, requestBody, {
        headers,
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');

        for (const line of lines) {
          const trimmedLine = line.replace(/^data: /, '');

          if (trimmedLine === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(trimmedLine);
            const content = parsed.choices?.[0]?.delta?.content || parsed.output?.choices?.[0]?.message?.content;

            if (content) {
              yield content;
            }
          } catch (error) {
            // 忽略解析错误
          }
        }
      }
    } catch (error: any) {
      console.error('流式聊天失败:', error);
      throw new Error(`流式聊天失败: ${error.message}`);
    }
  }

  /**
   * 计算token数量 (粗略估算)
   */
  estimateTokens(text: string): number {
    // 简单估算: 中文1字符≈1.5token,英文1单词≈1.3token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;

    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
  }

  /**
   * 估算成本
   */
  estimateCost(model: AIModel, tokens: number): number {
    // 这里可以根据不同模型设置不同的价格（美元/1K tokens）
    const pricePerThousandTokens: { [key: string]: number } = {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002,
      'grok-beta': 0.01,
      'qwen-plus': 0.002,
      'qwen-turbo': 0.001,
      'deepseek-chat': 0.00014,      // $0.14/1M tokens (输入) / $0.28/1M tokens (输出)
      'deepseek-coder': 0.00014,     // 同上
      'deepseek-reasoner': 0.00055,  // $0.55/1M tokens (输入) / $2.19/1M tokens (输出)
    };

    const price = pricePerThousandTokens[model.model_name] || 0.002;
    return (tokens / 1000) * price;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(model: AIModel, userMessage: string, options: ChatOptions): string {
    const key = JSON.stringify({
      model_id: model.id,
      message: userMessage,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
    });
    return Buffer.from(key).toString('base64');
  }

  /**
   * 清理过期缓存
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * 记录使用日志
   */
  private async logUsage(log: UsageLog): Promise<void> {
    try {
      await query(
        `INSERT INTO ai_model_usage_logs
         (model_id, prompt_tokens, completion_tokens, total_tokens, cost, duration_ms, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          log.model_id,
          log.prompt_tokens,
          log.completion_tokens,
          log.total_tokens,
          log.cost,
          log.duration_ms,
          log.success,
          log.error_message || null,
        ]
      );

      // 更新模型的使用次数
      if (log.success) {
        await query(
          `UPDATE ai_models
           SET usage_count = COALESCE(usage_count, 0) + 1, last_used_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [log.model_id]
        );
      }
    } catch (error) {
      console.error('记录使用日志失败:', error);
    }
  }

  /**
   * 检查使用限额
   */
  async checkUsageLimit(model: AIModel): Promise<boolean> {
    // 检查每日限额
    if (model.daily_limit) {
      const todayUsage = await query(
        `SELECT COUNT(*) as count FROM ai_model_usage_logs
         WHERE model_id = $1
         AND created_at >= CURRENT_DATE
         AND success = true`,
        [model.id]
      );

      if (parseInt(todayUsage.rows[0].count) >= model.daily_limit) {
        return false;
      }
    }

    // 检查每月限额
    if (model.monthly_limit) {
      const monthUsage = await query(
        `SELECT COUNT(*) as count FROM ai_model_usage_logs
         WHERE model_id = $1
         AND created_at >= date_trunc('month', CURRENT_DATE)
         AND success = true`,
        [model.id]
      );

      if (parseInt(monthUsage.rows[0].count) >= model.monthly_limit) {
        return false;
      }
    }

    return true;
  }

  /**
   * 智能路由 - 自动选择最优模型
   */
  async chatSmart(provider: string, userMessage: string, options: ChatOptions = {}): Promise<any> {
    // 获取该供应商的所有可用模型
    const result = await query(
      `SELECT * FROM ai_models
       WHERE provider = $1 AND is_active = true
       ORDER BY priority DESC, created_at DESC`,
      [provider]
    );

    const models = result.rows;

    if (models.length === 0) {
      throw new Error(`没有可用的${provider}模型`);
    }

    // 按优先级和健康状态排序
    const sortedModels = models.sort((a, b) => {
      // 优先使用健康的模型
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      // 然后按优先级
      return (b.priority || 0) - (a.priority || 0);
    });

    // 尝试使用第一个可用模型
    let lastError: Error | null = null;

    for (const model of sortedModels) {
      try {
        // 检查限额
        const canUse = await this.checkUsageLimit(model);
        if (!canUse) {
          console.log(`模型 ${model.name} 已达到使用限额`);
          continue;
        }

        return await this.chat(model, userMessage, options);
      } catch (error: any) {
        lastError = error;
        console.error(`模型 ${model.name} 调用失败:`, error.message);
      }
    }

    throw lastError || new Error('所有模型都不可用');
  }

  /**
   * 健康检查
   */
  async healthCheck(modelId: number): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
  }> {
    try {
      const modelResult = await query('SELECT * FROM ai_models WHERE id = $1', [modelId]);

      if (modelResult.rows.length === 0) {
        return { healthy: false, latency: 0, error: '模型不存在' };
      }

      const model = modelResult.rows[0];
      const startTime = Date.now();

      await this.chat(model, '健康检查测试', { max_tokens: 10, enableCache: false });

      const latency = Date.now() - startTime;

      // 更新模型状态
      await query(
        `UPDATE ai_models SET status = 'active', error_message = NULL WHERE id = $1`,
        [modelId]
      );

      return { healthy: true, latency };
    } catch (error: any) {
      // 更新模型状态为错误
      await query(
        `UPDATE ai_models SET status = 'error', error_message = $1 WHERE id = $2`,
        [error.message, modelId]
      );

      return { healthy: false, latency: 0, error: error.message };
    }
  }
}

export default AIService;
