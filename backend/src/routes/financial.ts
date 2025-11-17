import { Router } from 'express';
import { getStats, getData } from '../controllers/financialController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/financial/stats:
 *   get:
 *     summary: 获取财务统计信息
 *     description: 获取财务统计数据，包括收入、支出、利润等
 *     tags:
 *       - Admin - Financial
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 150000.00
 *                       description: 总收入
 *                     totalExpense:
 *                       type: number
 *                       example: 50000.00
 *                       description: 总支出
 *                     totalProfit:
 *                       type: number
 *                       example: 100000.00
 *                       description: 总利润
 *                     orderCount:
 *                       type: integer
 *                       example: 1500
 *                       description: 订单数量
 *                     averageOrderValue:
 *                       type: number
 *                       example: 100.00
 *                       description: 平均订单金额
 *                     refundTotal:
 *                       type: number
 *                       example: 5000.00
 *                       description: 退款总额
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticate, requirePermission(Resource.FINANCIAL, Action.VIEW), getStats);

/**
 * @openapi
 * /api/manage/financial/data:
 *   get:
 *     summary: 获取财务数据列表
 *     description: 分页获取财务流水记录
 *     tags:
 *       - Admin - Financial
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, refund]
 *         description: 记录类型
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [income, expense, refund]
 *                       amount:
 *                         type: number
 *                       order_id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       description:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/data', authenticate, requirePermission(Resource.FINANCIAL, Action.VIEW), getData);

export default router;
