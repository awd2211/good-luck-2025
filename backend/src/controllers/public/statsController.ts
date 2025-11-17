import { Request, Response, NextFunction } from 'express'
import pool from '../../config/database'

/**
 * @openapi
 * /api/public/stats:
 *   get:
 *     tags:
 *       - Public
 *     summary: 获取平台统计数据
 *     description: 获取平台的用户数、订单数、评分等统计信息,用于展示信任度
 *     responses:
 *       200:
 *         description: 成功获取统计数据
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
 *                     totalUsers:
 *                       type: number
 *                       description: 总用户数
 *                       example: 108650
 *                     totalOrders:
 *                       type: number
 *                       description: 总订单数
 *                       example: 256380
 *                     averageRating:
 *                       type: number
 *                       description: 平均评分
 *                       example: 4.8
 *                     yearEstablished:
 *                       type: number
 *                       description: 成立年份
 *                       example: 2015
 *                     totalReviews:
 *                       type: number
 *                       description: 总评价数
 *                       example: 45230
 *       500:
 *         description: 服务器错误
 */
export const getPublicStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const client = await pool.connect()

    try {
      // 获取用户总数
      const usersResult = await client.query(
        'SELECT COUNT(*) as total FROM users WHERE status = $1',
        ['active']
      )
      const totalUsers = parseInt(usersResult.rows[0]?.total || '0', 10)

      // 获取订单总数
      const ordersResult = await client.query(
        'SELECT COUNT(*) as total FROM orders WHERE status IN ($1, $2)',
        ['completed', 'paid']
      )
      const totalOrders = parseInt(ordersResult.rows[0]?.total || '0', 10)

      // 获取平均评分和评价总数
      const reviewsResult = await client.query(`
        SELECT
          COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating,
          COUNT(*) as total
        FROM reviews
        WHERE status = $1
      `, ['approved'])

      const averageRating = parseFloat(reviewsResult.rows[0]?.avg_rating || '0')
      const totalReviews = parseInt(reviewsResult.rows[0]?.total || '0', 10)

      // 成立年份 (固定值)
      const yearEstablished = 2015

      res.json({
        success: true,
        data: {
          totalUsers,
          totalOrders,
          averageRating,
          yearEstablished,
          totalReviews,
        },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('获取公开统计数据失败:', error)
    next(error)
  }
}
