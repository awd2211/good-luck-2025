/**
 * 客户标签管理控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as customerTagService from '../../services/webchat/customerTagService';

/**
 * 获取标签列表
 */
export const getTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, keyword, isActive } = req.query;

    const params = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      keyword: keyword as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    };

    const result = await customerTagService.getTags(params);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: params.page || 1,
        limit: params.limit || 20
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取标签详情
 */
export const getTagById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tag = await customerTagService.getTagById(parseInt(id));

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建标签
 */
export const createTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagName, tagColor, description, isActive } = req.body;

    if (!tagName || !tagColor) {
      return res.status(400).json({
        success: false,
        message: 'Tag name and color are required'
      });
    }

    const tag = await customerTagService.createTag({
      tagName,
      tagColor,
      description,
      isActive
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新标签
 */
export const updateTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { tagName, tagColor, description, isActive } = req.body;

    const tag = await customerTagService.updateTag(parseInt(id), {
      tagName,
      tagColor,
      description,
      isActive
    });

    res.json({
      success: true,
      data: tag,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除标签
 */
export const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await customerTagService.deleteTag(parseInt(id));

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 为用户分配标签
 */
export const assignTagToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tagId } = req.body;
    const assignedBy = (req as any).user?.id;

    if (!userId || !tagId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Tag ID are required'
      });
    }

    if (!assignedBy) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const assignment = await customerTagService.assignTagToUser({
      userId,
      tagId: parseInt(tagId),
      assignedBy
    });

    res.json({
      success: true,
      data: assignment,
      message: 'Tag assigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 移除用户标签
 */
export const removeTagFromUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tagId } = req.body;

    if (!userId || !tagId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Tag ID are required'
      });
    }

    await customerTagService.removeTagFromUser({
      userId,
      tagId: parseInt(tagId)
    });

    res.json({
      success: true,
      message: 'Tag removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户的所有标签
 */
export const getUserTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const tags = await customerTagService.getUserTags(userId);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量分配标签
 */
export const batchAssignTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds, tagIds } = req.body;
    const assignedBy = (req as any).user?.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs array is required'
      });
    }

    if (!assignedBy) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const result = await customerTagService.batchAssignTags({
      userIds,
      tagIds: tagIds.map((id: any) => parseInt(id)),
      assignedBy
    });

    res.json({
      success: true,
      data: result,
      message: `Batch assignment completed: ${result.success} success, ${result.failed} failed`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取标签统计
 */
export const getTagStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = await customerTagService.getTagStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 搜索带有特定标签的用户
 */
export const searchUsersByTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagIds, matchAll, page, limit } = req.query;

    if (!tagIds) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs are required'
      });
    }

    const tagIdArray = Array.isArray(tagIds)
      ? tagIds.map(id => parseInt(id as string))
      : [parseInt(tagIds as string)];

    const params = {
      tagIds: tagIdArray,
      matchAll: matchAll === 'true',
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const result = await customerTagService.searchUsersByTags(params);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: params.page || 1,
        limit: params.limit || 20
      }
    });
  } catch (error) {
    next(error);
  }
};
