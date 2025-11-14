import { Request, Response } from 'express';
import * as feedbackController from '../../../controllers/feedbackController';
import * as feedbackService from '../../../services/feedbackService';

jest.mock('../../../services/feedbackService');

describe('feedbackController - 反馈管理控制器', () => {
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

  describe('getFeedbacks - 获取反馈列表', () => {
    it('应该成功获取反馈列表', async () => {
      const mockData = {
        data: [
          { id: 1, title: '功能建议', content: '希望添加XX功能', type: 'feature', status: 'pending' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      (feedbackService.getAllFeedbacks as jest.Mock).mockResolvedValue(mockData);

      await feedbackController.getFeedbacks(mockRequest as Request, mockResponse as Response);

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
      mockRequest.query = {
        page: '2',
        pageSize: '10',
        status: 'resolved',
        type: 'bug',
        priority: 'high',
      };
      const mockData = { data: [], total: 0, page: 2, pageSize: 10, totalPages: 0 };
      (feedbackService.getAllFeedbacks as jest.Mock).mockResolvedValue(mockData);

      await feedbackController.getFeedbacks(mockRequest as Request, mockResponse as Response);

      expect(feedbackService.getAllFeedbacks).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        status: 'resolved',
        type: 'bug',
        priority: 'high',
      });
    });

    it('应该在发生错误时返回500', async () => {
      (feedbackService.getAllFeedbacks as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await feedbackController.getFeedbacks(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '获取反馈列表失败',
      });
    });
  });

  describe('getFeedback - 获取单个反馈', () => {
    it('应该成功获取单个反馈', async () => {
      const mockFeedback = { id: 1, title: '测试反馈', content: '内容' };
      mockRequest.params = { id: '1' };
      (feedbackService.getFeedbackById as jest.Mock).mockResolvedValue(mockFeedback);

      await feedbackController.getFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockFeedback,
      });
    });

    it('应该在反馈不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      (feedbackService.getFeedbackById as jest.Mock).mockResolvedValue(null);

      await feedbackController.getFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '反馈不存在',
      });
    });
  });

  describe('addFeedback - 创建反馈', () => {
    it('应该成功创建反馈', async () => {
      mockRequest.body = {
        title: '新反馈',
        content: '反馈内容',
        type: 'bug',
        priority: 'high',
      };
      const mockNewFeedback = { id: 1, ...mockRequest.body };
      (feedbackService.createFeedback as jest.Mock).mockResolvedValue(mockNewFeedback);

      await feedbackController.addFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '反馈提交成功',
        data: mockNewFeedback,
      });
    });

    it('应该在标题为空时返回400', async () => {
      mockRequest.body = { content: '内容' };

      await feedbackController.addFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '标题和内容不能为空',
      });
    });

    it('应该在内容为空时返回400', async () => {
      mockRequest.body = { title: '标题' };

      await feedbackController.addFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '标题和内容不能为空',
      });
    });
  });

  describe('modifyFeedback - 更新反馈', () => {
    it('应该成功更新反馈', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        status: 'resolved',
        handler_comment: '已解决',
      };
      const mockUpdatedFeedback = { id: 1, status: 'resolved' };
      (feedbackService.updateFeedback as jest.Mock).mockResolvedValue(mockUpdatedFeedback);

      await feedbackController.modifyFeedback(mockRequest as Request, mockResponse as Response);

      expect(feedbackService.updateFeedback).toHaveBeenCalledWith(1, {
        status: 'resolved',
        handler_id: 'admin1',
        handler_name: 'admin',
        handler_comment: '已解决',
      });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '反馈处理成功',
        data: mockUpdatedFeedback,
      });
    });

    it('应该在反馈不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'resolved' };
      (feedbackService.updateFeedback as jest.Mock).mockResolvedValue(null);

      await feedbackController.modifyFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '反馈不存在',
      });
    });
  });

  describe('removeFeedback - 删除反馈', () => {
    it('应该成功删除反馈', async () => {
      mockRequest.params = { id: '1' };
      (feedbackService.deleteFeedback as jest.Mock).mockResolvedValue(true);

      await feedbackController.removeFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '反馈删除成功',
      });
    });

    it('应该在反馈不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      (feedbackService.deleteFeedback as jest.Mock).mockResolvedValue(false);

      await feedbackController.removeFeedback(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '反馈不存在',
      });
    });
  });
});
