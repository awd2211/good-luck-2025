import { Router } from 'express';
import * as userController from '../../controllers/manage/userController';
import { requirePermission } from '../../middleware/auth';
import { Resource, Action } from '../../config/permissions';

const router = Router();

/**
 * @route   GET /api/manage/users
 * @desc    获取用户列表
 * @access  Private (管理员)
 */
router.get('/', requirePermission(Resource.USERS, Action.VIEW), userController.getUsers);

/**
 * @route   GET /api/manage/users/stats
 * @desc    获取用户统计信息
 * @access  Private (管理员)
 */
router.get('/stats', requirePermission(Resource.USERS, Action.VIEW), userController.getUserStats);

/**
 * @route   GET /api/manage/users/export
 * @desc    导出用户数据
 * @access  Private (管理员)
 */
router.get('/export', requirePermission(Resource.USERS, Action.VIEW), userController.exportUsers);

/**
 * @route   GET /api/manage/users/:id
 * @desc    获取单个用户详情
 * @access  Private (管理员)
 */
router.get('/:id', requirePermission(Resource.USERS, Action.VIEW), userController.getUserById);

/**
 * @route   PUT /api/manage/users/:id
 * @desc    更新用户信息
 * @access  Private (管理员)
 */
router.put('/:id', requirePermission(Resource.USERS, Action.EDIT), userController.updateUser);

/**
 * @route   POST /api/manage/users/batch-status
 * @desc    批量更新用户状态
 * @access  Private (管理员)
 */
router.post('/batch-status', requirePermission(Resource.USERS, Action.EDIT), userController.batchUpdateUserStatus);

/**
 * @route   DELETE /api/manage/users/:id
 * @desc    删除用户
 * @access  Private (管理员)
 */
router.delete('/:id', requirePermission(Resource.USERS, Action.DELETE), userController.deleteUser);

export default router;
