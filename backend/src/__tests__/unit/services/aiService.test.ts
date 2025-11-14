/**
 * aiService 单元测试
 */

import AIService from '../../../services/aiService'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('aiService - AI模型服务', () => {
  let aiService: AIService
  let mockAxiosInstance: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
    }

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance)
    mockedAxios.post = jest.fn()

    aiService = new AIService()
  })

  const mockModel = {
    id: 1,
    name: 'GPT-4',
    provider: 'openai',
    model_name: 'gpt-4',
    api_key: 'test-api-key',
    api_base_url: 'https://api.openai.com/v1',
    max_tokens: 2000,
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    system_prompt: '你是一个算命大师',
  }

  describe('chat - 聊天', () => {
    it('应该成功调用OpenAI API', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: '您的运势不错',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
          model: 'gpt-4',
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await aiService.chat(mockModel, '帮我算一卦')

      expect(result.content).toBe('您的运势不错')
      expect(result.usage).toEqual(mockResponse.data.usage)
      expect(result.model).toBe('gpt-4')
      expect(result.finish_reason).toBe('stop')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一个算命大师' },
            { role: 'user', content: '帮我算一卦' },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        })
      )
    })

    it('应该支持自定义messages', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: '回复' }, finish_reason: 'stop' }],
          usage: {},
          model: 'gpt-4',
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      await aiService.chat(mockModel, '继续', {
        messages: [
          { role: 'user', content: '第一条消息' },
          { role: 'assistant', content: '第一条回复' },
        ],
      })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [
            { role: 'user', content: '第一条消息' },
            { role: 'assistant', content: '第一条回复' },
            { role: 'user', content: '继续' },
          ],
        }),
        expect.any(Object)
      )
    })

    it('应该支持自定义参数', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: '回复' }, finish_reason: 'stop' }],
          usage: {},
          model: 'gpt-4',
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      await aiService.chat(mockModel, '测试', {
        max_tokens: 500,
        temperature: 0.5,
        top_p: 0.8,
      })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          max_tokens: 500,
          temperature: 0.5,
          top_p: 0.8,
        }),
        expect.any(Object)
      )
    })

    it('应该成功调用Grok API', async () => {
      const grokModel = { ...mockModel, provider: 'grok', api_base_url: 'https://api.x.ai/v1' }

      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Grok回复' }, finish_reason: 'stop' }],
          usage: {},
          model: 'grok-beta',
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await aiService.chat(grokModel, '测试Grok')

      expect(result.content).toBe('Grok回复')
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('应该成功调用Qwen API', async () => {
      const qwenModel = {
        ...mockModel,
        provider: 'qwen',
        model_name: 'qwen-plus',
        api_base_url: 'https://dashscope.aliyuncs.com',
      }

      const mockResponse = {
        data: {
          output: {
            choices: [{ message: { content: 'Qwen回复' }, finish_reason: 'stop' }],
          },
          usage: {},
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await aiService.chat(qwenModel, '测试Qwen')

      expect(result.content).toBe('Qwen回复')
      expect(result.model).toBe('qwen-plus')
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://dashscope.aliyuncs.com/services/aigc/text-generation/generation',
        expect.objectContaining({
          model: 'qwen-plus',
          input: {
            messages: expect.any(Array),
          },
          parameters: expect.any(Object),
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
            'X-DashScope-SSE': 'disable',
          },
        })
      )
    })

    it('应该在不支持的供应商时抛出异常', async () => {
      const unsupportedModel = { ...mockModel, provider: 'unsupported' }

      await expect(aiService.chat(unsupportedModel, '测试')).rejects.toThrow(
        '不支持的AI供应商: unsupported'
      )
    })

    it('应该在OpenAI API调用失败时抛出异常', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'API密钥无效',
            },
          },
        },
        message: 'Request failed',
      })

      await expect(aiService.chat(mockModel, '测试')).rejects.toThrow('OpenAI API调用失败')
    })
  })

  describe('chatStream - 流式聊天', () => {
    it('应该支持流式响应', async () => {
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"你"}}]}\n',
        'data: {"choices":[{"delta":{"content":"好"}}]}\n',
        'data: [DONE]\n',
      ]

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield Buffer.from(chunk)
          }
        },
      }

      mockedAxios.post.mockResolvedValue({
        data: mockStream,
      })

      const chunks: string[] = []
      for await (const chunk of aiService.chatStream(mockModel, '你好')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['你', '好'])
    })

    it('应该在流式聊天失败时抛出异常', async () => {
      mockedAxios.post.mockRejectedValue(new Error('网络错误'))

      const generator = aiService.chatStream(mockModel, '测试')

      await expect(generator.next()).rejects.toThrow('流式聊天失败')
    })
  })

  describe('estimateTokens - 估算tokens', () => {
    it('应该正确估算中文tokens', () => {
      const tokens = aiService.estimateTokens('你好世界')

      expect(tokens).toBe(Math.ceil(4 * 1.5)) // 4个中文字符 * 1.5
    })

    it('应该正确估算英文tokens', () => {
      const tokens = aiService.estimateTokens('Hello world')

      expect(tokens).toBe(Math.ceil(2 * 1.3)) // 2个英文单词 * 1.3
    })

    it('应该正确估算中英文混合tokens', () => {
      const text = '你好 Hello 世界 World'
      const tokens = aiService.estimateTokens(text)

      // 4个中文字符 * 1.5 + 2个英文单词 * 1.3
      const expected = Math.ceil(4 * 1.5 + 2 * 1.3)
      expect(tokens).toBe(expected)
    })

    it('应该处理空字符串', () => {
      const tokens = aiService.estimateTokens('')

      expect(tokens).toBe(0)
    })
  })

  describe('estimateCost - 估算成本', () => {
    it('应该正确估算GPT-4成本', () => {
      const model = { ...mockModel, model_name: 'gpt-4' }
      const cost = aiService.estimateCost(model, 1000)

      expect(cost).toBe(0.03) // 1000 tokens / 1000 * 0.03
    })

    it('应该正确估算GPT-3.5成本', () => {
      const model = { ...mockModel, model_name: 'gpt-3.5-turbo' }
      const cost = aiService.estimateCost(model, 1000)

      expect(cost).toBe(0.002) // 1000 tokens / 1000 * 0.002
    })

    it('应该正确估算Grok成本', () => {
      const model = { ...mockModel, model_name: 'grok-beta' }
      const cost = aiService.estimateCost(model, 1000)

      expect(cost).toBe(0.01)
    })

    it('应该正确估算Qwen成本', () => {
      const model = { ...mockModel, model_name: 'qwen-plus' }
      const cost = aiService.estimateCost(model, 1000)

      expect(cost).toBe(0.002)
    })

    it('应该使用默认价格处理未知模型', () => {
      const model = { ...mockModel, model_name: 'unknown-model' }
      const cost = aiService.estimateCost(model, 1000)

      expect(cost).toBe(0.002) // 默认价格
    })

    it('应该正确计算不同token数量的成本', () => {
      const model = { ...mockModel, model_name: 'gpt-4' }

      expect(aiService.estimateCost(model, 500)).toBe(0.015)
      expect(aiService.estimateCost(model, 2000)).toBe(0.06)
    })
  })
})
