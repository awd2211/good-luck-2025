import { Router } from 'express';
import { getActiveBannersPublic } from '../../controllers/bannerController';

const router = Router();

/**
 * @openapi
 * /api/public/banners:
 *   get:
 *     summary: 获取激活的横幅列表
 *     description: 公开接口，无需认证，返回所有激活状态的横幅广告，按排序顺序返回
 *     tags:
 *       - Public - Banners
 *     responses:
 *       200:
 *         description: 成功返回横幅列表
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
 *                     $ref: '#/components/schemas/Banner'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getActiveBannersPublic);

export default router;
