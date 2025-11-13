import { Request, Response } from 'express';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminStats,
} from '../services/adminService';

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, role, search } = req.query;
    const result = await getAllAdmins({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      role: role as string,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    res.status(500).json({ success: false, message: '获取管理员列表失败' });
  }
};

export const getAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await getAdminById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }
    res.json({ success: true, data: admin });
  } catch (error) {
    console.error('获取管理员详情失败:', error);
    res.status(500).json({ success: false, message: '获取管理员详情失败' });
  }
};

export const addAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, role, email } = req.body;

    // 验证必填字段
    if (!username || !role || !email) {
      return res.status(400).json({
        success: false,
        message: '用户名、角色和邮箱为必填项',
      });
    }

    // 验证角色
    const validRoles = ['super_admin', 'manager', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色',
      });
    }

    const newAdmin = await createAdmin({
      username,
      password: password || '123456',
      role,
      email,
    });

    res.json({
      success: true,
      message: '管理员创建成功',
      data: newAdmin,
    });
  } catch (error: any) {
    console.error('创建管理员失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建管理员失败',
    });
  }
};

export const modifyAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, role, email } = req.body;

    const currentUser = (req as any).user;

    // 不允许修改自己的角色
    if (currentUser.id === id && role !== undefined) {
      return res.status(403).json({
        success: false,
        message: '不能修改自己的角色',
      });
    }

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (password) updateData.password = password;
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email;

    const updatedAdmin = await updateAdmin(id, updateData);

    if (!updatedAdmin) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    res.json({
      success: true,
      message: '管理员更新成功',
      data: updatedAdmin,
    });
  } catch (error: any) {
    console.error('更新管理员失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新管理员失败',
    });
  }
};

export const removeAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // 不允许删除自己
    if (currentUser.id === id) {
      return res.status(403).json({
        success: false,
        message: '不能删除自己',
      });
    }

    const deleted = await deleteAdmin(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    res.json({ success: true, message: '管理员删除成功' });
  } catch (error: any) {
    console.error('删除管理员失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '删除管理员失败',
    });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取管理员统计失败:', error);
    res.status(500).json({ success: false, message: '获取管理员统计失败' });
  }
};
