import { Router } from 'express';
import {
  getRefunds,
  getRefund,
  addRefund,
  handleReviewRefund,
  modifyRefundStatus,
  removeRefund,
} from '../controllers/refundController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * 退款管理 - 所有接口都需要认证
 */

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.REFUNDS, Action.VIEW), getRefunds);
router.get('/:id', authenticate, requirePermission(Resource.REFUNDS, Action.VIEW), getRefund);

// 创建操作 - 需要创建权限
router.post('/', authenticate, requirePermission(Resource.REFUNDS, Action.CREATE), addRefund);

// 审核操作 - 需要更新权限
router.post('/:id/review', authenticate, requirePermission(Resource.REFUNDS, Action.EDIT), handleReviewRefund);

// 更新操作 - 需要更新权限
router.patch('/:id/status', authenticate, requirePermission(Resource.REFUNDS, Action.EDIT), modifyRefundStatus);

// 删除操作 - 需要删除权限
router.delete('/:id', authenticate, requirePermission(Resource.REFUNDS, Action.DELETE), removeRefund);

export default router;
