import axios, { AxiosInstance } from 'axios';

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
}

export class AIService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 发送聊天请求
   */
  async chat(model: AIModel, userMessage: string, options: ChatOptions = {}): Promise<any> {
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
    // 这里可以根据不同模型设置不同的价格
    const pricePerThousandTokens: { [key: string]: number } = {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002,
      'grok-beta': 0.01,
      'qwen-plus': 0.002,
      'qwen-turbo': 0.001,
    };

    const price = pricePerThousandTokens[model.model_name] || 0.002;
    return (tokens / 1000) * price;
  }
}

export default AIService;
