/**
 * 客户备注管理控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as customerNoteService from '../../services/webchat/customerNoteService';

/**
 * 获取备注列表
 */
export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, isImportant, createdBy, keyword, page, limit } = req.query;

    const params = {
      userId: userId as string,
      isImportant: isImportant !== undefined ? isImportant === 'true' : undefined,
      createdBy: createdBy as string,
      keyword: keyword as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const result = await customerNoteService.getNotes(params);

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
 * 获取指定用户的所有备注
 */
export const getUserNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const notes = await customerNoteService.getUserNotes(userId);

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取备注详情
 */
export const getNoteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const note = await customerNoteService.getNoteById(parseInt(id));

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建备注
 */
export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, content, isImportant } = req.body;
    const createdBy = (req as any).user?.id;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: 'User ID and content are required'
      });
    }

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const note = await customerNoteService.createNote({
      userId,
      content,
      isImportant,
      createdBy
    });

    res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新备注
 */
export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, isImportant } = req.body;

    const note = await customerNoteService.updateNote(parseInt(id), {
      content,
      isImportant
    });

    res.json({
      success: true,
      data: note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除备注
 */
export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await customerNoteService.deleteNote(parseInt(id));

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 切换重要状态
 */
export const toggleImportant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const note = await customerNoteService.toggleImportant(parseInt(id));

    res.json({
      success: true,
      data: note,
      message: 'Importance status toggled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取备注统计
 */
export const getNoteStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = await customerNoteService.getNoteStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量删除备注
 */
export const batchDeleteNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noteIds } = req.body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note IDs array is required'
      });
    }

    const result = await customerNoteService.batchDeleteNotes(
      noteIds.map(id => parseInt(id))
    );

    res.json({
      success: true,
      data: result,
      message: `Batch deletion completed: ${result.success} success, ${result.failed} failed`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 搜索备注
 */
export const searchNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, userId, isImportant, page, limit } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required'
      });
    }

    const params = {
      keyword: keyword as string,
      userId: userId as string,
      isImportant: isImportant !== undefined ? isImportant === 'true' : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const result = await customerNoteService.searchNotes(params);

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
