import { Request, Response } from 'express';
import * as notificationController from '../../../controllers/notificationController';
import * as notificationService from '../../../services/notificationService';

jest.mock('../../../services/notificationService');

describe('notificationController - 通知管理控制器', () => {
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

  describe('getNotifications - 获取通知列表', () => {
    it('应该成功获取通知列表', async () => {
      const mockData = {
        data: [
          { id: 1, title: '系统通知', content: '测试内容', status: 'active' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      (notificationService.getAllNotifications as jest.Mock).mockResolvedValue(mockData);

      await notificationController.getNotifications(mockRequest as Request, mockResponse as Response);

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
      mockRequest.query = { page: '2', pageSize: '10', status: 'active', type: 'system' };
      const mockData = {
        data: [],
        total: 0,
        page: 2,
        pageSize: 10,
        totalPages: 0,
      };
      (notificationService.getAllNotifications as jest.Mock).mockResolvedValue(mockData);

      await notificationController.getNotifications(mockRequest as Request, mockResponse as Response);

      expect(notificationService.getAllNotifications).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        status: 'active',
        type: 'system',
      });
    });

    it('应该在发生错误时返回500', async () => {
      (notificationService.getAllNotifications as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await notificationController.getNotifications(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '获取通知列表失败',
      });
    });
  });

  describe('getActiveNotificationsPublic - 获取激活通知', () => {
    it('应该成功获取激活通知', async () => {
      const mockNotifications = [
        { id: 1, title: '通知1', status: 'active' },
        { id: 2, title: '通知2', status: 'active' },
      ];
      (notificationService.getActiveNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await notificationController.getActiveNotificationsPublic(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
      });
    });

    it('应该支持target参数', async () => {
      mockRequest.query = { target: 'vip' };
      (notificationService.getActiveNotifications as jest.Mock).mockResolvedValue([]);

      await notificationController.getActiveNotificationsPublic(mockRequest as Request, mockResponse as Response);

      expect(notificationService.getActiveNotifications).toHaveBeenCalledWith('vip');
    });
  });

  describe('getNotification - 获取单个通知', () => {
    it('应该成功获取单个通知', async () => {
      const mockNotification = { id: 1, title: '测试通知', content: '内容' };
      mockRequest.params = { id: '1' };
      (notificationService.getNotificationById as jest.Mock).mockResolvedValue(mockNotification);

      await notificationController.getNotification(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
      });
    });

    it('应该在通知不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      (notificationService.getNotificationById as jest.Mock).mockResolvedValue(null);

      await notificationController.getNotification(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '通知不存在',
      });
    });
  });

  describe('addNotification - 创建通知', () => {
    it('应该成功创建通知', async () => {
      mockRequest.body = { title: '新通知', content: '通知内容', target: 'all' };
      const mockNewNotification = { id: 1, ...mockRequest.body, created_by: 'admin1' };
      (notificationService.createNotification as jest.Mock).mockResolvedValue(mockNewNotification);

      await notificationController.addNotification(mockRequest as Request, mockResponse as Response);

      expect(notificationService.createNotification).toHaveBeenCalledWith({
        title: '新通知',
        content: '通知内容',
        target: 'all',
        created_by: 'admin1',
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '通知创建成功',
        data: mockNewNotification,
      });
    });

    it('应该在标题为空时返回400', async () => {
      mockRequest.body = { content: '内容' };

      await notificationController.addNotification(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '通知标题和内容不能为空',
      });
    });

    it('应该在内容为空时返回400', async () => {
      mockRequest.body = { title: '标题' };

      await notificationController.addNotification(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '通知标题和内容不能为空',
      });
    });
  });

  describe('modifyNotification - 更新通知', () => {
    it('应该成功更新通知', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { title: '更新后标题', status: 'inactive' };
      const mockUpdatedNotification = { id: 1, ...mockRequest.body };
      (notificationService.updateNotification as jest.Mock).mockResolvedValue(mockUpdatedNotification);

      await notificationController.modifyNotification(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '通知更新成功',
        data: mockUpdatedNotification,
      });
    });

    it('应该在通知不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { title: '更新标题' };
      (notificationService.updateNotification as jest.Mock).mockResolvedValue(null);

      await notificationController.modifyNotification(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '通知不存在',
      });
    });
  });

  describe('removeNotification - 删除通知', () => {
    it('应该成功删除通知', async () => {
      mockRequest.params = { id: '1' };
      (notificationService.deleteNotification as jest.Mock).mockResolvedValue(true);

      await notificationController.removeNotification(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '通知删除成功',
      });
    });

    it('应该在通知不存在时返回404', async () => {
      mockRequest.params = { id: '999' };
      (notificationService.deleteNotification as jest.Mock).mockResolvedValue(false);

      await notificationController.removeNotification(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '通知不存在',
      });
    });
  });

  describe('batchUpdateStatus - 批量更新状态', () => {
    it('应该成功批量更新状态', async () => {
      mockRequest.body = { ids: [1, 2, 3], status: 'active' };
      (notificationService.batchUpdateNotificationStatus as jest.Mock).mockResolvedValue(3);

      await notificationController.batchUpdateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '成功更新3条通知的状态',
        data: { count: 3 },
      });
    });

    it('应该在ids为空时返回400', async () => {
      mockRequest.body = { ids: [], status: 'active' };

      await notificationController.batchUpdateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '请提供通知ID列表',
      });
    });

    it('应该在ids不是数组时返回400', async () => {
      mockRequest.body = { ids: 'not-array', status: 'active' };

      await notificationController.batchUpdateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '请提供通知ID列表',
      });
    });

    it('应该在status无效时返回400', async () => {
      mockRequest.body = { ids: [1, 2], status: 'invalid' };

      await notificationController.batchUpdateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '状态值无效',
      });
    });
  });
});
