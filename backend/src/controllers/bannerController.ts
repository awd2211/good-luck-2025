import { Request, Response } from 'express';
import {
  getAllBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerPosition,
} from '../services/bannerService';

/**
 * 获取所有横幅
 */
export const getBanners = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, status } = req.query;

    const result = await getAllBanners({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string,
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
    console.error('获取横幅列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取横幅列表失败',
    });
  }
};

/**
 * 获取激活的横幅（公开API，无需认证）
 */
export const getActiveBannersPublic = async (req: Request, res: Response) => {
  try {
    const banners = await getActiveBanners();
    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('获取横幅失败:', error);
    res.status(500).json({
      success: false,
      message: '获取横幅失败',
    });
  }
};

/**
 * 获取单个横幅
 */
export const getBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await getBannerById(parseInt(id));

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '横幅不存在',
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('获取横幅失败:', error);
    res.status(500).json({
      success: false,
      message: '获取横幅失败',
    });
  }
};

/**
 * 创建横幅
 */
export const addBanner = async (req: Request, res: Response) => {
  try {
    const bannerData = req.body;

    if (!bannerData.title) {
      return res.status(400).json({
        success: false,
        message: '横幅标题不能为空',
      });
    }

    const newBanner = await createBanner(bannerData);

    res.status(201).json({
      success: true,
      message: '横幅创建成功',
      data: newBanner,
    });
  } catch (error) {
    console.error('创建横幅失败:', error);
    res.status(500).json({
      success: false,
      message: '创建横幅失败',
    });
  }
};

/**
 * 更新横幅
 */
export const modifyBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bannerData = req.body;

    const updatedBanner = await updateBanner(parseInt(id), bannerData);

    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: '横幅不存在',
      });
    }

    res.json({
      success: true,
      message: '横幅更新成功',
      data: updatedBanner,
    });
  } catch (error) {
    console.error('更新横幅失败:', error);
    res.status(500).json({
      success: false,
      message: '更新横幅失败',
    });
  }
};

/**
 * 删除横幅
 */
export const removeBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteBanner(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '横幅不存在',
      });
    }

    res.json({
      success: true,
      message: '横幅删除成功',
    });
  } catch (error) {
    console.error('删除横幅失败:', error);
    res.status(500).json({
      success: false,
      message: '删除横幅失败',
    });
  }
};

/**
 * 更新横幅位置
 */
export const changeBannerPosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined || position === null) {
      return res.status(400).json({
        success: false,
        message: '位置参数不能为空',
      });
    }

    const updatedBanner = await updateBannerPosition(parseInt(id), position);

    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: '横幅不存在',
      });
    }

    res.json({
      success: true,
      message: '位置更新成功',
      data: updatedBanner,
    });
  } catch (error) {
    console.error('更新横幅位置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新横幅位置失败',
    });
  }
};
