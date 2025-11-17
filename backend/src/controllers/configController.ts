/**
 * 配置管理控制器
 */

import { Request, Response, NextFunction } from 'express';
import configService from '../services/configService';

/**
 * @openapi
 * /api/manage/configs:
 *   get:
 *     tags:
 *       - 配置管理
 *     summary: 获取所有配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 配置分类
 *     responses:
 *       200:
 *         description: 成功
 */
export const getAllConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category } = req.query;

    if (category) {
      const configs = await configService.getByCategory(category as string);
      res.json({
        success: true,
        data: configs,
      });
    } else {
      const stats = await configService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/public:
 *   get:
 *     tags:
 *       - 配置管理
 *     summary: 获取公开配置（无需认证）
 *     responses:
 *       200:
 *         description: 成功
 */
export const getPublicConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const configs = await configService.getPublicConfigs();
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/{key}:
 *   get:
 *     tags:
 *       - 配置管理
 *     summary: 获取单个配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
export const getConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;
    const value = await configService.get(key);

    res.json({
      success: true,
      data: {
        key,
        value,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/{key}:
 *   put:
 *     tags:
 *       - 配置管理
 *     summary: 更新配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功
 */
export const updateConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updatedBy = (req as any).admin?.username || 'system';

    const success = await configService.set(key, value, updatedBy);

    if (success) {
      res.json({
        success: true,
        message: '配置更新成功',
      });
    } else {
      res.status(400).json({
        success: false,
        message: '配置更新失败',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/batch:
 *   put:
 *     tags:
 *       - 配置管理
 *     summary: 批量更新配置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: 成功
 */
export const batchUpdateConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const configs = req.body;
    const updatedBy = (req as any).admin?.username || 'system';

    const result = await configService.setMany(configs, updatedBy);

    res.json({
      success: true,
      message: `成功更新 ${result.success.length} 个配置`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/reload:
 *   post:
 *     tags:
 *       - 配置管理
 *     summary: 重新加载配置
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
export const reloadConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await configService.reload();

    res.json({
      success: true,
      message: '配置已重新加载',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/history:
 *   get:
 *     tags:
 *       - 配置管理
 *     summary: 获取配置变更历史
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 成功
 */
export const getConfigHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key, limit } = req.query;
    const history = await configService.getHistory(
      key as string,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/cs:
 *   get:
 *     tags:
 *       - 配置管理
 *     summary: 获取客服配置
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
export const getCSConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await configService.getCSConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /api/manage/configs/cs:
 *   put:
 *     tags:
 *       - 配置管理
 *     summary: 更新客服配置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功
 */
export const updateCSConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updates = req.body;
    const updatedBy = (req as any).admin?.username || 'system';

    const config = await configService.updateCSConfig(updates, updatedBy);

    res.json({
      success: true,
      message: '客服配置更新成功',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};
