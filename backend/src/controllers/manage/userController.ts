import { Request, Response, NextFunction } from 'express';
import * as userService from '../../services/manage/userService';

/**
 * 获取用户列表
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;

    const params = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await userService.getUsers(params);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户详情
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户信息
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const user = await userService.updateUser(id, userData);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量更新用户状态
 */
export const batchUpdateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const result = await userService.batchUpdateUserStatus(ids, status);

    res.json({
      success: true,
      message: `成功更新 ${result.updated} 个用户状态`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除用户
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id);

    res.json({
      success: true,
      message: '用户已删除',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户统计信息
 */
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await userService.getUserStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 导出用户数据
 */
export const exportUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status } = req.query;

    const params = {
      search: search as string,
      status: status as string
    };

    const users = await userService.exportUsers(params);

    // 设置响应头，提示下载CSV文件
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');

    // 写入CSV头部
    const headers = ['ID', '用户名', '手机号', '邮箱', '昵称', '注册日期', '状态', '订单数', '消费金额', '余额', '最后登录'];
    res.write('\uFEFF'); // UTF-8 BOM
    res.write(headers.join(',') + '\n');

    // 写入数据
    users.forEach((user: any) => {
      const row = [
        user.id,
        user.username || '',
        user.phone,
        user.email || '',
        user.nickname || '',
        user.register_date,
        user.status,
        user.order_count,
        user.total_spent,
        user.balance,
        user.last_login_date || ''
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * 创建新用户
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, username, password, email, nickname, balance } = req.body;

    // 验证必填字段
    if (!phone || !username || !password) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：phone, username, password'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位'
      });
    }

    const userData = {
      phone,
      username,
      password,
      email,
      nickname,
      balance: balance !== undefined ? balance : 0
    };

    const user = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user
    });
  } catch (error: any) {
    if (error.message?.includes('已存在')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 重置用户密码
 */
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // 验证必填字段
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供新密码'
      });
    }

    // 验证密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位'
      });
    }

    await userService.resetUserPassword(id, newPassword);

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error: any) {
    if (error.message?.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
