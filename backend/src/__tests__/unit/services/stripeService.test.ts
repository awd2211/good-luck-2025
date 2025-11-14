/**
 * stripeService 单元测试
 */

import * as stripeService from '../../../services/stripeService'
import pool from '../../../config/database'
import Stripe from 'stripe'

// Mock dependencies
jest.mock('../../../config/database')
jest.mock('stripe')

describe('stripeService - Stripe支付服务', () => {
  const mockQuery = pool.query as jest.Mock
  const MockStripe = Stripe as jest.MockedClass<typeof Stripe>

  let mockStripeInstance: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Stripe instance methods
    mockStripeInstance = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        cancel: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      customers: {
        create: jest.fn(),
      },
    }

    MockStripe.mockImplementation(() => mockStripeInstance)
  })

  describe('createStripePaymentIntent - 创建支付意图', () => {
    it('应该成功创建Stripe支付意图', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'secret_key', config_value: 'sk_test_123' },
          { config_key: 'publishable_key', config_value: 'pk_test_123' },
        ],
      })

      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_456',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      }

      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent)

      const result = await stripeService.createStripePaymentIntent({
        amount: 100,
        currency: 'USD',
        orderId: 'ORD123',
        userEmail: 'user@example.com',
        description: '测试订单',
      })

      expect(result.paymentIntentId).toBe('pi_123')
      expect(result.clientSecret).toBe('pi_123_secret_456')
      expect(result.amount).toBe(100)
      expect(result.currency).toBe('USD')

      // 验证金额转换为分
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000, // 100 * 100
        currency: 'usd',
        description: '测试订单',
        metadata: {
          order_id: 'ORD123',
        },
        receipt_email: 'user@example.com',
        automatic_payment_methods: {
          enabled: true,
        },
      })
    })

    it('应该正确处理小数金额', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret',
      })

      await stripeService.createStripePaymentIntent({
        amount: 99.99,
        currency: 'USD',
        orderId: 'ORD123',
      })

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 9999, // Math.round(99.99 * 100)
        })
      )
    })

    it('应该支持自定义metadata', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret',
      })

      await stripeService.createStripePaymentIntent({
        amount: 100,
        currency: 'USD',
        orderId: 'ORD123',
        metadata: {
          user_id: 'user_123',
          fortune_type: 'zodiac',
        },
      })

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            order_id: 'ORD123',
            user_id: 'user_123',
            fortune_type: 'zodiac',
          },
        })
      )
    })

    it('应该在配置不完整时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [], // 没有配置
      })

      await expect(
        stripeService.createStripePaymentIntent({
          amount: 100,
          currency: 'USD',
          orderId: 'ORD123',
        })
      ).rejects.toThrow('Stripe配置不完整')
    })

    it('应该在未获取到client_secret时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: null, // 没有client_secret
      })

      await expect(
        stripeService.createStripePaymentIntent({
          amount: 100,
          currency: 'USD',
          orderId: 'ORD123',
        })
      ).rejects.toThrow('未能获取Stripe Client Secret')
    })

    it('应该在Stripe API调用失败时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.paymentIntents.create.mockRejectedValue(
        new Error('API密钥无效')
      )

      jest.spyOn(console, 'error').mockImplementation()

      await expect(
        stripeService.createStripePaymentIntent({
          amount: 100,
          currency: 'USD',
          orderId: 'ORD123',
        })
      ).rejects.toThrow('Stripe支付创建失败')

      ;(console.error as jest.Mock).mockRestore()
    })
  })

  describe('confirmStripePayment - 确认支付', () => {
    it('应该成功确认Stripe支付', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: 'ch_123',
      }

      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent)

      const result = await stripeService.confirmStripePayment('pi_123')

      expect(result.paymentIntentId).toBe('pi_123')
      expect(result.status).toBe('succeeded')
      expect(result.amount).toBe(100) // 10000 / 100
      expect(result.currency).toBe('USD')
      expect(result.chargeId).toBe('ch_123')
    })

    it('应该正确转换货币单位', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
        amount: 9999, // 99.99美元
        currency: 'usd',
      })

      const result = await stripeService.confirmStripePayment('pi_123')

      expect(result.amount).toBe(99.99)
    })
  })

  describe('getStripePaymentDetails - 获取支付详情', () => {
    it('应该成功获取支付详情', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: { id: 'ch_123' },
        payment_method: { id: 'pm_123', type: 'card' },
      }

      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent)

      const result = await stripeService.getStripePaymentDetails('pi_123')

      expect(result).toEqual(mockPaymentIntent)
      expect(mockStripeInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123', {
        expand: ['latest_charge', 'payment_method'],
      })
    })
  })

  describe('refundStripePayment - 退款', () => {
    it('应该成功使用paymentIntentId退款', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      const mockRefund = {
        id: 'ref_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      }

      mockStripeInstance.refunds.create.mockResolvedValue(mockRefund)

      const result = await stripeService.refundStripePayment({
        paymentIntentId: 'pi_123',
      })

      expect(result.refundId).toBe('ref_123')
      expect(result.status).toBe('succeeded')
      expect(result.amount).toBe(100)
      expect(result.currency).toBe('USD')

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        reason: 'requested_by_customer',
        metadata: undefined,
        payment_intent: 'pi_123',
      })
    })

    it('应该成功使用chargeId退款', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.refunds.create.mockResolvedValue({
        id: 'ref_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      })

      await stripeService.refundStripePayment({
        chargeId: 'ch_123',
      })

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        reason: 'requested_by_customer',
        metadata: undefined,
        charge: 'ch_123',
      })
    })

    it('应该支持部分退款', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.refunds.create.mockResolvedValue({
        id: 'ref_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      })

      await stripeService.refundStripePayment({
        paymentIntentId: 'pi_123',
        amount: 50,
      })

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000, // 50 * 100
        })
      )
    })

    it('应该支持指定退款原因', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      mockStripeInstance.refunds.create.mockResolvedValue({
        id: 'ref_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      })

      await stripeService.refundStripePayment({
        paymentIntentId: 'pi_123',
        reason: 'fraudulent',
      })

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'fraudulent',
        })
      )
    })

    it('应该在未提供paymentIntentId或chargeId时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      await expect(stripeService.refundStripePayment({})).rejects.toThrow(
        '必须提供 paymentIntentId 或 chargeId'
      )
    })
  })

  describe('verifyStripeWebhook - 验证Webhook', () => {
    it('应该成功验证Webhook签名', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'secret_key', config_value: 'sk_test_123' },
          { config_key: 'webhook_secret', config_value: 'whsec_123' },
        ],
      })

      const mockEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {},
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent)

      const result = await stripeService.verifyStripeWebhook(
        'payload',
        'signature'
      )

      expect(result).toEqual(mockEvent)
      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'whsec_123'
      )
    })

    it('应该在Webhook Secret未配置时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      await expect(
        stripeService.verifyStripeWebhook('payload', 'signature')
      ).rejects.toThrow('Stripe Webhook Secret未配置')
    })
  })

  describe('getStripePublishableKey - 获取可发布密钥', () => {
    it('应该返回可发布密钥', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'secret_key', config_value: 'sk_test_123' },
          { config_key: 'publishable_key', config_value: 'pk_test_123' },
        ],
      })

      const result = await stripeService.getStripePublishableKey()

      expect(result).toBe('pk_test_123')
    })
  })

  describe('createStripeCustomer - 创建客户', () => {
    it('应该成功创建Stripe客户', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      const mockCustomer = {
        id: 'cus_123',
        email: 'user@example.com',
        name: 'Test User',
      }

      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer)

      const result = await stripeService.createStripeCustomer({
        email: 'user@example.com',
        name: 'Test User',
        phone: '+1234567890',
        metadata: { user_id: 'user_123' },
      })

      expect(result.customerId).toBe('cus_123')
      expect(result.email).toBe('user@example.com')

      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'Test User',
        phone: '+1234567890',
        metadata: { user_id: 'user_123' },
      })
    })
  })

  describe('cancelStripePaymentIntent - 取消支付意图', () => {
    it('应该成功取消支付意图', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'secret_key', config_value: 'sk_test_123' }],
      })

      const mockCancelledIntent = {
        id: 'pi_123',
        status: 'canceled',
      }

      mockStripeInstance.paymentIntents.cancel.mockResolvedValue(mockCancelledIntent)

      const result = await stripeService.cancelStripePaymentIntent('pi_123')

      expect(result.paymentIntentId).toBe('pi_123')
      expect(result.status).toBe('canceled')

      expect(mockStripeInstance.paymentIntents.cancel).toHaveBeenCalledWith('pi_123')
    })
  })
})
