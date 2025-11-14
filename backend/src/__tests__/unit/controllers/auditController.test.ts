import { Request, Response } from 'express';
import * as auditController from '../../../controllers/auditController';
import * as auditService from '../../../services/auditService';

jest.mock('../../../services/auditService');

describe('auditController - 审计日志控制器', () => {
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
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
      user: { id: 'admin1', username: 'admin' } as any,
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
  });

  describe('getLogs - 获取审计日志', () => {
    it('应该成功获取审计日志列表', () => {
      const mockData = {
        data: [
          {
            id: '1',
            userId: 'admin1',
            action: 'CREATE',
            resource: 'user',
            status: 'success',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      (auditService.getAuditLogs as jest.Mock).mockReturnValue(mockData);

      auditController.getLogs(mockRequest as Request, mockResponse as Response);

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

    it('应该支持分页参数', () => {
      mockRequest.query = { page: '2', pageSize: '10' };
      const mockData = { data: [], total: 0, page: 2, pageSize: 10, totalPages: 0 };
      (auditService.getAuditLogs as jest.Mock).mockReturnValue(mockData);

      auditController.getLogs(mockRequest as Request, mockResponse as Response);

      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        })
      );
    });

    it('应该支持筛选参数', () => {
      mockRequest.query = {
        userId: 'admin1',
        action: 'CREATE',
        resource: 'user',
        status: 'success',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      (auditService.getAuditLogs as jest.Mock).mockReturnValue({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });

      auditController.getLogs(mockRequest as Request, mockResponse as Response);

      expect(auditService.getAuditLogs).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
        userId: 'admin1',
        action: 'CREATE',
        resource: 'user',
        status: 'success',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });
    });

    it('应该在发生错误时返回500', () => {
      (auditService.getAuditLogs as jest.Mock).mockImplementation(() => {
        throw new Error('Service Error');
      });

      auditController.getLogs(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '获取审计日志失败',
      });
    });
  });

  describe('addLog - 添加审计日志', () => {
    it('应该成功添加审计日志', () => {
      mockRequest.body = {
        action: 'CREATE',
        resource: 'user',
        resourceId: '123',
        details: { name: 'Test User' },
      };
      const mockNewLog = {
        id: '1',
        userId: 'admin1',
        username: 'admin',
        action: 'CREATE',
        resource: 'user',
        ip: '127.0.0.1',
      };
      (auditService.addAuditLog as jest.Mock).mockReturnValue(mockNewLog);

      auditController.addLog(mockRequest as Request, mockResponse as Response);

      expect(auditService.addAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin1',
          username: 'admin',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          action: 'CREATE',
          resource: 'user',
          resourceId: '123',
          details: { name: 'Test User' },
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '审计日志添加成功',
        data: mockNewLog,
      });
    });

    it('应该在缺少action时返回400', () => {
      mockRequest.body = { resource: 'user' };

      auditController.addLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要字段',
      });
    });

    it('应该在缺少resource时返回400', () => {
      mockRequest.body = { action: 'CREATE' };

      auditController.addLog(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要字段',
      });
    });

    it('应该处理无user的情况', () => {
      mockRequest.user = undefined;
      mockRequest.body = { action: 'CREATE', resource: 'user' };
      (auditService.addAuditLog as jest.Mock).mockReturnValue({ id: '1' });

      auditController.addLog(mockRequest as Request, mockResponse as Response);

      expect(auditService.addAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'unknown',
          username: 'unknown',
        })
      );
    });

    it('应该处理x-forwarded-for头', () => {
      mockRequest.headers = {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
      };
      mockRequest.body = { action: 'CREATE', resource: 'user' };
      (auditService.addAuditLog as jest.Mock).mockReturnValue({ id: '1' });

      auditController.addLog(mockRequest as Request, mockResponse as Response);

      expect(auditService.addAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.1',
        })
      );
    });
  });

  describe('cleanLogs - 清空审计日志', () => {
    it('应该成功清理审计日志', () => {
      mockRequest.body = { keepCount: 500 };
      (auditService.cleanAuditLogs as jest.Mock).mockReturnValue(100);

      auditController.cleanLogs(mockRequest as Request, mockResponse as Response);

      expect(auditService.cleanAuditLogs).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '已清理100条历史日志',
        data: { deletedCount: 100 },
      });
    });

    it('应该使用默认keepCount为1000', () => {
      mockRequest.body = {};
      (auditService.cleanAuditLogs as jest.Mock).mockReturnValue(50);

      auditController.cleanLogs(mockRequest as Request, mockResponse as Response);

      expect(auditService.cleanAuditLogs).toHaveBeenCalledWith(1000);
    });

    it('应该在发生错误时返回500', () => {
      mockRequest.body = { keepCount: 500 };
      (auditService.cleanAuditLogs as jest.Mock).mockImplementation(() => {
        throw new Error('Clean Error');
      });

      auditController.cleanLogs(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '清理审计日志失败',
      });
    });
  });
});
