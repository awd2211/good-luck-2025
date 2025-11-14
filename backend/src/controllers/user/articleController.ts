import { Request, Response } from 'express'
import { getPublishedArticles, getArticleById, incrementViewCount } from '../../services/user/articleService'

/**
 * 获取文章列表
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const { page, limit, category } = req.query

    const result = await getPublishedArticles({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      category: category as string,
    })

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('获取文章列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取文章列表失败',
    })
  }
}

/**
 * 获取文章详情
 */
export const getArticleDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const article = await getArticleById(parseInt(id))

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在',
      })
    }

    // 增加浏览量
    await incrementViewCount(parseInt(id))

    res.json({
      success: true,
      data: article,
    })
  } catch (error) {
    console.error('获取文章详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取文章详情失败',
    })
  }
}
