import { Request, Response } from 'express';
import {
  getAllRefunds,
  getRefundById,
  createRefund,
  reviewRefund,
  updateRefundStatus,
  deleteRefund,
} from '../services/refundService';

/**
 * 获取所有退款记录
 */
export const getRefunds = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, status, user_id } = req.query;

    const result = await getAllRefunds({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string,
      user_id: user_id as string,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('获取退款列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取退款列表失败',
    });
  }
};

/**
 * 获取单个退款
 */
export const getRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const refund = await getRefundById(parseInt(id));

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: '退款记录不存在',
      });
    }

    res.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    console.error('获取退款记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取退款记录失败',
    });
  }
};

/**
 * 创建退款
 */
export const addRefund = async (req: Request, res: Response) => {
  try {
    const refundData = req.body;

    if (!refundData.order_id || !refundData.user_id || !refundData.amount) {
      return res.status(400).json({
        success: false,
        message: '订单号、用户ID和退款金额不能为空',
      });
    }

    // 生成退款单号
    if (!refundData.refund_no) {
      const timestamp = Date.now();
      refundData.refund_no = `RF${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${timestamp}`;
    }

    const newRefund = await createRefund(refundData);

    res.status(201).json({
      success: true,
      message: '退款申请创建成功',
      data: newRefund,
    });
  } catch (error) {
    console.error('创建退款申请失败:', error);
    res.status(500).json({
      success: false,
      message: '创建退款申请失败',
    });
  }
};

/**
 * 审核退款
 */
export const handleReviewRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, review_comment, refund_method } = req.body;
    const user = (req as any).user;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '操作类型必须是approve或reject',
      });
    }

    if (action === 'approve' && !refund_method) {
      return res.status(400).json({
        success: false,
        message: '批准退款时必须指定退款方式',
      });
    }

    const updatedRefund = await reviewRefund(parseInt(id), {
      action,
      reviewer_id: user.id,
      reviewer_name: user.username,
      review_comment,
      refund_method: action === 'approve' ? refund_method : undefined,
    });

    if (!updatedRefund) {
      return res.status(404).json({
        success: false,
        message: '退款记录不存在',
      });
    }

    res.json({
      success: true,
      message: action === 'approve' ? '退款已批准' : '退款已拒绝',
      data: updatedRefund,
    });
  } catch (error) {
    console.error('审核退款失败:', error);
    res.status(500).json({
      success: false,
      message: '审核退款失败',
    });
  }
};

/**
 * 更新退款状态
 */
export const modifyRefundStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态不能为空',
      });
    }

    const updatedRefund = await updateRefundStatus(parseInt(id), status);

    if (!updatedRefund) {
      return res.status(404).json({
        success: false,
        message: '退款记录不存在',
      });
    }

    res.json({
      success: true,
      message: '退款状态更新成功',
      data: updatedRefund,
    });
  } catch (error) {
    console.error('更新退款状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新退款状态失败',
    });
  }
};

/**
 * 删除退款
 */
export const removeRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteRefund(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '退款记录不存在',
      });
    }

    res.json({
      success: true,
      message: '退款记录删除成功',
    });
  } catch (error) {
    console.error('删除退款记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除退款记录失败',
    });
  }
};
