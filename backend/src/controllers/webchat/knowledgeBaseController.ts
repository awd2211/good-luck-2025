/**
 * 知识库管理控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as knowledgeBaseService from '../../services/webchat/knowledgeBaseService';

// ==================== 知识分类 ====================

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parentId, isActive } = req.query;

    const categories = await knowledgeBaseService.getCategories({
      parentId: parentId ? parseInt(parentId as string) : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parentId, name, description, icon, sortOrder } = req.body;
    const createdBy = (req as any).user?.id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await knowledgeBaseService.createCategory({
      parentId,
      name,
      description,
      icon,
      sortOrder,
      createdBy
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sortOrder, isActive } = req.body;

    const category = await knowledgeBaseService.updateCategory(parseInt(id), {
      name,
      description,
      icon,
      sortOrder,
      isActive
    });

    res.json({ success: true, data: category });
  } catch (error: any) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await knowledgeBaseService.deleteCategory(parseInt(id));
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== 知识文档 ====================

export const getArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, isPublished, isFeatured, keyword, tags, page, limit } = req.query;

    const result = await knowledgeBaseService.getArticles({
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      keyword: keyword as string,
      tags: tags ? (tags as string).split(',') : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const article = await knowledgeBaseService.getArticleById(parseInt(id));

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // 增加浏览量
    await knowledgeBaseService.incrementArticleView(parseInt(id));

    res.json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, title, content, summary, tags, isPublished, isFeatured, sortOrder } = req.body;
    const createdBy = (req as any).user?.id;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const article = await knowledgeBaseService.createArticle({
      categoryId,
      title,
      content,
      summary,
      tags,
      isPublished,
      isFeatured,
      sortOrder,
      createdBy
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { categoryId, title, content, summary, tags, isPublished, isFeatured, sortOrder } = req.body;
    const updatedBy = (req as any).user?.id;

    const article = await knowledgeBaseService.updateArticle(parseInt(id), {
      categoryId,
      title,
      content,
      summary,
      tags,
      isPublished,
      isFeatured,
      sortOrder,
      updatedBy
    });

    res.json({ success: true, data: article });
  } catch (error: any) {
    if (error.message === 'Article not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await knowledgeBaseService.deleteArticle(parseInt(id));
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== FAQ ====================

export const getFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, isPublished, keyword, tags, page, limit } = req.query;

    const result = await knowledgeBaseService.getFAQs({
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      keyword: keyword as string,
      tags: tags ? (tags as string).split(',') : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, question, answer, tags, isPublished, sortOrder } = req.body;
    const createdBy = (req as any).user?.id;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const faq = await knowledgeBaseService.createFAQ({
      categoryId,
      question,
      answer,
      tags,
      isPublished,
      sortOrder,
      createdBy
    });

    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    next(error);
  }
};

export const updateFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { categoryId, question, answer, tags, isPublished, sortOrder } = req.body;
    const updatedBy = (req as any).user?.id;

    const faq = await knowledgeBaseService.updateFAQ(parseInt(id), {
      categoryId,
      question,
      answer,
      tags,
      isPublished,
      sortOrder,
      updatedBy
    });

    res.json({ success: true, data: faq });
  } catch (error: any) {
    if (error.message === 'FAQ not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await knowledgeBaseService.deleteFAQ(parseInt(id));
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== 搜索 ====================

export const searchKnowledge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, page, limit } = req.query;

    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }

    const result = await knowledgeBaseService.searchKnowledge({
      keyword: keyword as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ==================== 统计 ====================

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = await knowledgeBaseService.getKnowledgeStatistics();
    res.json({ success: true, data: statistics });
  } catch (error) {
    next(error);
  }
};
