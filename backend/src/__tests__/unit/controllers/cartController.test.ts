/**
 * cartController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as cartController from '../../../controllers/user/cartController'
import * as cartService from '../../../services/user/cartService'

// Mock cartService
jest.mock('../../../services/user/cartService')

describe('cartController - 购物车控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user_123', phone: '13900000001' },
      body: {},
      params: {},
    }
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('getCart - 获取购物车', () => {
    it('应该成功获取购物车', async () => {
      const mockCart = {
        items: [
          {
            id: 'cart_1',
            fortune_id: 'fortune_1',
            title: '生肖运势',
            price: '88.00',
            quantity: 1,
            subtotal: '88.00',
          },
        ],
        totalAmount: '88.00',
      }

      ;(cartService.getUserCart as jest.Mock).mockResolvedValue(mockCart)

      await cartController.getCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.getUserCart).toHaveBeenCalledWith('user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCart,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await cartController.getCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未登录',
      })
      expect(cartService.getUserCart).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(cartService.getUserCart as jest.Mock).mockRejectedValue(error)

      await cartController.getCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('addToCart - 添加到购物车', () => {
    it('应该成功添加商品到购物车', async () => {
      mockRequest.body = { fortuneId: 'fortune_1', quantity: 2 }

      const mockItem = {
        id: 'cart_1',
        fortune_id: 'fortune_1',
        quantity: 2,
      }

      ;(cartService.addToCart as jest.Mock).mockResolvedValue(mockItem)

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.addToCart).toHaveBeenCalledWith('user_123', 'fortune_1', 2)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '添加成功',
        data: mockItem,
      })
    })

    it('应该使用默认数量1', async () => {
      mockRequest.body = { fortuneId: 'fortune_1' }

      ;(cartService.addToCart as jest.Mock).mockResolvedValue({})

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.addToCart).toHaveBeenCalledWith('user_123', 'fortune_1', 1)
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { fortuneId: 'fortune_1' }

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(cartService.addToCart).not.toHaveBeenCalled()
    })

    it('应该在fortuneId为空时返回400', async () => {
      mockRequest.body = {}

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '商品ID不能为空',
      })
    })

    it('应该在数量小于1时返回400', async () => {
      mockRequest.body = { fortuneId: 'fortune_1', quantity: 0 }

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '数量必须在1-99之间',
      })
    })

    it('应该在数量大于99时返回400', async () => {
      mockRequest.body = { fortuneId: 'fortune_1', quantity: 100 }

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '数量必须在1-99之间',
      })
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.body = { fortuneId: 'fortune_1' }
      const error = new Error('商品不存在')
      ;(cartService.addToCart as jest.Mock).mockRejectedValue(error)

      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('updateCartItem - 更新购物车商品数量', () => {
    it('应该成功更新商品数量', async () => {
      mockRequest.params = { id: 'cart_1' }
      mockRequest.body = { quantity: 3 }

      const mockItem = {
        id: 'cart_1',
        quantity: 3,
      }

      ;(cartService.updateCartItem as jest.Mock).mockResolvedValue(mockItem)

      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.updateCartItem).toHaveBeenCalledWith('user_123', 'cart_1', 3)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '更新成功',
        data: mockItem,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'cart_1' }
      mockRequest.body = { quantity: 3 }

      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(cartService.updateCartItem).not.toHaveBeenCalled()
    })

    it('应该在数量为空时返回400', async () => {
      mockRequest.params = { id: 'cart_1' }
      mockRequest.body = {}

      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '数量必须大于0',
      })
    })

    it('应该在数量小于1时返回400', async () => {
      mockRequest.params = { id: 'cart_1' }
      mockRequest.body = { quantity: 0 }

      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { id: 'cart_1' }
      mockRequest.body = { quantity: 3 }
      const error = new Error('商品不存在')
      ;(cartService.updateCartItem as jest.Mock).mockRejectedValue(error)

      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('removeFromCart - 删除购物车商品', () => {
    it('应该成功删除商品', async () => {
      mockRequest.params = { id: 'cart_1' }

      ;(cartService.removeFromCart as jest.Mock).mockResolvedValue(undefined)

      await cartController.removeFromCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.removeFromCart).toHaveBeenCalledWith('user_123', 'cart_1')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '删除成功',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'cart_1' }

      await cartController.removeFromCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(cartService.removeFromCart).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { id: 'cart_1' }
      const error = new Error('商品不存在')
      ;(cartService.removeFromCart as jest.Mock).mockRejectedValue(error)

      await cartController.removeFromCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('batchRemove - 批量删除购物车商品', () => {
    it('应该成功批量删除商品', async () => {
      mockRequest.body = { ids: ['cart_1', 'cart_2'] }

      const mockResult = {
        deletedCount: 2,
        deletedIds: ['cart_1', 'cart_2'],
      }

      ;(cartService.batchRemoveFromCart as jest.Mock).mockResolvedValue(mockResult)

      await cartController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.batchRemoveFromCart).toHaveBeenCalledWith('user_123', [
        'cart_1',
        'cart_2',
      ])
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '成功删除2件商品',
        data: mockResult,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { ids: ['cart_1'] }

      await cartController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(cartService.batchRemoveFromCart).not.toHaveBeenCalled()
    })

    it('应该在ids不是数组时返回400', async () => {
      mockRequest.body = { ids: 'not-an-array' }

      await cartController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请选择要删除的商品',
      })
    })

    it('应该在ids为空数组时返回400', async () => {
      mockRequest.body = { ids: [] }

      await cartController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.body = { ids: ['cart_1'] }
      const error = new Error('删除失败')
      ;(cartService.batchRemoveFromCart as jest.Mock).mockRejectedValue(error)

      await cartController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('clearCart - 清空购物车', () => {
    it('应该成功清空购物车', async () => {
      const mockResult = { deletedCount: 5 }

      ;(cartService.clearCart as jest.Mock).mockResolvedValue(mockResult)

      await cartController.clearCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(cartService.clearCart).toHaveBeenCalledWith('user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '购物车已清空',
        data: mockResult,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await cartController.clearCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(cartService.clearCart).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('清空失败')
      ;(cartService.clearCart as jest.Mock).mockRejectedValue(error)

      await cartController.clearCart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
