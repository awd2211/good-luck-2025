import { Request, Response } from 'express';
import * as refundController from '../../../controllers/refundController';
import * as refundService from '../../../services/refundService';

jest.mock('../../../services/refundService');

describe('refundController - 退款管理控制器', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: { id: 'admin1', username: 'admin' } as any,
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRefunds - 获取退款列表', () => {
    it('应该成功获取退款列表', async () => {
      const mockData = {
        data: [
          { id: 1, refund_no: 'RF20250101001', amount: 100, status: 'pending' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      (refundService.getAllRefunds as jest.Mock).mockResolvedValue(mockData);

      await refundController.getRefunds(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockData.data,
        pagination: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });
    });

    it('应该支持分页和筛选参数', async () => {
      mockRequest.query = { page: '2', pageSize: '10', status: 'approved', user_id: 'user123' };
      const mockData = { data: [], total: 0, page: 2, pageSize: 10, totalPages: 0 };
      (refundService.getAllRefunds as jest.Mock).mockResolvedValue(mockData);

      await refundController.getRefunds(mockRequest as Request, mockResponse as Response);

      expect(refundService.getAllRefunds).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        status: 'approved',
        user_id: 'user123',
      });
    });
  });

  describe('getRefund - 获取单个退款', () => {
    it('应该成功获取单个退款', async () => {
      const mockRefund = { id: 1, refund_no: 'RF20250101001', amount: 100 };
      mockRequest.params = { id: '1' };
      (refundService.getRefundById as jest.Mock).mockResolvedValue(mockRefund);

      await refundController.getRefund(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRefund,
      });
    });

    it('应该在退款不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      (refundService.getRefundById as jest.Mock).mockResolvedValue(null);

      await refundController.getRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '退款记录不存在',
      });
    });
  });

  describe('addRefund - 创建退款', () => {
    it('应该成功创建退款', async () => {
      mockRequest.body = {
        order_id: '123',
        user_id: 'user1',
        amount: 100,
        reason: '不满意',
      };
      const mockNewRefund = { id: 1, ...mockRequest.body, refund_no: 'RF20250101001' };
      (refundService.createRefund as jest.Mock).mockResolvedValue(mockNewRefund);

      await refundController.addRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '退款申请创建成功',
        data: mockNewRefund,
      });
    });

    it('应该自动生成退款单号', async () => {
      mockRequest.body = { order_id: '123', user_id: 'user1', amount: 100 };
      (refundService.createRefund as jest.Mock).mockResolvedValue({ id: 1 });

      await refundController.addRefund(mockRequest as Request, mockResponse as Response);

      expect(refundService.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          refund_no: expect.stringMatching(/^RF\d{8}\d+$/),
        })
      );
    });

    it('应该在缺少必填字段时返回400', async () => {
      mockRequest.body = { order_id: '123' };

      await refundController.addRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '订单号、用户ID和退款金额不能为空',
      });
    });
  });

  describe('handleReviewRefund - 审核退款', () => {
    it('应该成功批准退款', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        action: 'approve',
        review_comment: '同意退款',
        refund_method: 'original',
      };
      const mockUpdatedRefund = { id: 1, status: 'approved' };
      (refundService.reviewRefund as jest.Mock).mockResolvedValue(mockUpdatedRefund);

      await refundController.handleReviewRefund(mockRequest as Request, mockResponse as Response);

      expect(refundService.reviewRefund).toHaveBeenCalledWith(1, {
        action: 'approve',
        reviewer_id: 'admin1',
        reviewer_name: 'admin',
        review_comment: '同意退款',
        refund_method: 'original',
      });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '退款已批准',
        data: mockUpdatedRefund,
      });
    });

    it('应该成功拒绝退款', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        action: 'reject',
        review_comment: '不符合退款条件',
      };
      const mockUpdatedRefund = { id: 1, status: 'rejected' };
      (refundService.reviewRefund as jest.Mock).mockResolvedValue(mockUpdatedRefund);

      await refundController.handleReviewRefund(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '退款已拒绝',
        data: mockUpdatedRefund,
      });
    });

    it('应该在action无效时返回400', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { action: 'invalid' };

      await refundController.handleReviewRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '操作类型必须是approve或reject',
      });
    });

    it('应该在批准时未提供退款方式返回400', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { action: 'approve' };

      await refundController.handleReviewRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '批准退款时必须指定退款方式',
      });
    });

    it('应该在退款不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { action: 'approve', refund_method: 'original' };
      (refundService.reviewRefund as jest.Mock).mockResolvedValue(null);

      await refundController.handleReviewRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '退款记录不存在',
      });
    });
  });

  describe('modifyRefundStatus - 更新退款状态', () => {
    it('应该成功更新退款状态', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'completed' };
      const mockUpdatedRefund = { id: 1, status: 'completed' };
      (refundService.updateRefundStatus as jest.Mock).mockResolvedValue(mockUpdatedRefund);

      await refundController.modifyRefundStatus(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '退款状态更新成功',
        data: mockUpdatedRefund,
      });
    });

    it('应该在status为空时返回400', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await refundController.modifyRefundStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '状态不能为空',
      });
    });

    it('应该在退款不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'completed' };
      (refundService.updateRefundStatus as jest.Mock).mockResolvedValue(null);

      await refundController.modifyRefundStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '退款记录不存在',
      });
    });
  });

  describe('removeRefund - 删除退款', () => {
    it('应该成功删除退款', async () => {
      mockRequest.params = { id: '1' };
      (refundService.deleteRefund as jest.Mock).mockResolvedValue(true);

      await refundController.removeRefund(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '退款记录删除成功',
      });
    });

    it('应该在退款不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      (refundService.deleteRefund as jest.Mock).mockResolvedValue(false);

      await refundController.removeRefund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '退款记录不存在',
      });
    });
  });
});
