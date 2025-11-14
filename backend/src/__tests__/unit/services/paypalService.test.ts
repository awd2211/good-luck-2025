/**
 * paypalService 单元测试
 */

import * as paypalService from '../../../services/paypalService'
import pool from '../../../config/database'
import {
  Client,
  OrdersController,
  Environment,
  CheckoutPaymentIntent,
} from '@paypal/paypal-server-sdk'

// Mock dependencies
jest.mock('../../../config/database')
jest.mock('@paypal/paypal-server-sdk')

describe('paypalService - PayPal支付服务', () => {
  const mockQuery = pool.query as jest.Mock
  const MockClient = Client as jest.MockedClass<typeof Client>
  const MockOrdersController = OrdersController as jest.MockedClass<typeof OrdersController>

  let mockOrdersController: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock OrdersController
    mockOrdersController = {
      createOrder: jest.fn(),
      captureOrder: jest.fn(),
      getOrder: jest.fn(),
    }

    MockOrdersController.mockImplementation(() => mockOrdersController)
  })

  describe('createPayPalOrder - 创建PayPal订单', () => {
    it('应该成功创建PayPal订单', async () => {
      // Mock PayPal配置
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'test_client_id' },
          { config_key: 'client_secret', config_value: 'test_client_secret' },
          { config_key: 'mode', config_value: 'sandbox' },
        ],
      })

      // Mock PayPal订单响应
      const mockPayPalOrder = {
        id: 'PAYPAL123',
        links: [
          { rel: 'approve', href: 'https://paypal.com/approve/PAYPAL123' },
          { rel: 'self', href: 'https://api.paypal.com/v2/checkout/orders/PAYPAL123' },
        ],
      }

      mockOrdersController.createOrder.mockResolvedValue({
        body: mockPayPalOrder,
      })

      const result = await paypalService.createPayPalOrder({
        amount: 100,
        currency: 'USD',
        orderId: 'ORD123',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(result.paypalOrderId).toBe('PAYPAL123')
      expect(result.approvalUrl).toBe('https://paypal.com/approve/PAYPAL123')

      // 验证查询配置
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT config_key, config_value'),
        [false]
      )

      // 验证创建订单请求
      expect(mockOrdersController.createOrder).toHaveBeenCalledWith({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              referenceId: 'ORD123',
              amount: {
                currencyCode: 'USD',
                value: '100.00',
              },
            },
          ],
          applicationContext: {
            returnUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel',
          },
        },
        prefer: 'return=representation',
      })
    })

    it('应该在配置不完整时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ config_key: 'client_id', config_value: 'test_client_id' }],
      })

      await expect(
        paypalService.createPayPalOrder({
          amount: 100,
          currency: 'USD',
          orderId: 'ORD123',
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('PayPal配置不完整')
    })

    it('应该在未返回approval URL时抛出异常', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'test_client_id' },
          { config_key: 'client_secret', config_value: 'test_client_secret' },
        ],
      })

      mockOrdersController.createOrder.mockResolvedValue({
        body: {
          id: 'PAYPAL123',
          links: [], // 没有approval链接
        },
      })

      await expect(
        paypalService.createPayPalOrder({
          amount: 100,
          currency: 'USD',
          orderId: 'ORD123',
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('PayPal未返回approval URL')
    })

    it('应该正确格式化金额', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'test_client_id' },
          { config_key: 'client_secret', config_value: 'test_client_secret' },
        ],
      })

      mockOrdersController.createOrder.mockResolvedValue({
        body: {
          id: 'PAYPAL123',
          links: [{ rel: 'approve', href: 'https://paypal.com/approve' }],
        },
      })

      await paypalService.createPayPalOrder({
        amount: 99.99,
        currency: 'USD',
        orderId: 'ORD123',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(mockOrdersController.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            purchaseUnits: [
              expect.objectContaining({
                amount: {
                  currencyCode: 'USD',
                  value: '99.99',
                },
              }),
            ],
          }),
        })
      )
    })

    it('应该支持生产环境模式', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'prod_client_id' },
          { config_key: 'client_secret', config_value: 'prod_client_secret' },
          { config_key: 'mode', config_value: 'live' },
        ],
      })

      mockOrdersController.createOrder.mockResolvedValue({
        body: {
          id: 'PAYPAL123',
          links: [{ rel: 'approve', href: 'https://paypal.com/approve' }],
        },
      })

      await paypalService.createPayPalOrder({
        amount: 100,
        currency: 'USD',
        orderId: 'ORD123',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        isProduction: true,
      })

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [true])
    })
  })

  describe('capturePayPalOrder - 捕获PayPal订单', () => {
    it('应该成功捕获PayPal订单', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'test_client_id' },
          { config_key: 'client_secret', config_value: 'test_client_secret' },
        ],
      })

      const mockCapturedOrder = {
        id: 'PAYPAL123',
        status: 'COMPLETED',
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: 'CAPTURE123',
                  status: 'COMPLETED',
                  amount: {
                    currency_code: 'USD',
                    value: '100.00',
                  },
                },
              ],
            },
          },
        ],
      }

      mockOrdersController.captureOrder.mockResolvedValue({
        body: mockCapturedOrder,
      })

      const result = await paypalService.capturePayPalOrder('PAYPAL123')

      expect(result).toEqual(mockCapturedOrder)
      expect(mockOrdersController.captureOrder).toHaveBeenCalledWith({
        id: 'PAYPAL123',
        prefer: 'return=representation',
      })
    })
  })

  describe('getPayPalOrderDetails - 获取PayPal订单详情', () => {
    it('应该成功获取PayPal订单详情', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'test_client_id' },
          { config_key: 'client_secret', config_value: 'test_client_secret' },
        ],
      })

      const mockOrderDetails = {
        id: 'PAYPAL123',
        status: 'APPROVED',
        intent: 'CAPTURE',
        purchase_units: [],
      }

      mockOrdersController.getOrder.mockResolvedValue({
        body: mockOrderDetails,
      })

      const result = await paypalService.getPayPalOrderDetails('PAYPAL123')

      expect(result).toEqual(mockOrderDetails)
      expect(mockOrdersController.getOrder).toHaveBeenCalledWith({
        id: 'PAYPAL123',
      })
    })
  })

  describe('testPayPalConfig - 测试PayPal配置', () => {
    it('应该在配置正确时返回true', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'test_client_id' },
          { config_key: 'client_secret', config_value: 'test_client_secret' },
        ],
      })

      mockOrdersController.createOrder.mockResolvedValue({
        body: {
          id: 'TEST_ORDER',
        },
      })

      const result = await paypalService.testPayPalConfig()

      expect(result).toBe(true)
      expect(mockOrdersController.createOrder).toHaveBeenCalledWith({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              amount: {
                currencyCode: 'USD',
                value: '0.01',
              },
            },
          ],
        },
      })
    })

    it('应该在配置错误时返回false', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { config_key: 'client_id', config_value: 'invalid_client_id' },
          { config_key: 'client_secret', config_value: 'invalid_secret' },
        ],
      })

      mockOrdersController.createOrder.mockRejectedValue(new Error('认证失败'))

      jest.spyOn(console, 'error').mockImplementation()

      const result = await paypalService.testPayPalConfig()

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'PayPal配置测试失败:',
        expect.any(Error)
      )

      ;(console.error as jest.Mock).mockRestore()
    })
  })
})
