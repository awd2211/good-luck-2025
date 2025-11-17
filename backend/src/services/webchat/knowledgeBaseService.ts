/**
 * 知识库管理服务
 * 提供知识分类、文档、FAQ的CRUD和搜索功能
 */

import { query } from '../../config/database';

// ==================== 知识分类管理 ====================

export interface KnowledgeCategory {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCategories(params: {
  parentId?: number | null;
  isActive?: boolean;
}): Promise<KnowledgeCategory[]> {
  const { parentId, isActive } = params;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (parentId !== undefined) {
    if (parentId === null) {
      whereConditions.push('parent_id IS NULL');
    } else {
      whereConditions.push(`parent_id = $${paramIndex}`);
      queryParams.push(parentId);
      paramIndex++;
    }
  }

  if (isActive !== undefined) {
    whereConditions.push(`is_active = $${paramIndex}`);
    queryParams.push(isActive);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT * FROM knowledge_categories ${whereClause} ORDER BY sort_order, id`,
    queryParams
  );

  return result.rows;
}

export async function createCategory(data: {
  parentId?: number | null;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  createdBy?: string;
}): Promise<KnowledgeCategory> {
  const result = await query(
    `INSERT INTO knowledge_categories (parent_id, name, description, icon, sort_order, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.parentId || null,
      data.name,
      data.description || null,
      data.icon || null,
      data.sortOrder || 0,
      data.createdBy || null
    ]
  );

  return result.rows[0];
}

export async function updateCategory(id: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<KnowledgeCategory> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex++;
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(data.description);
    paramIndex++;
  }
  if (data.icon !== undefined) {
    updates.push(`icon = $${paramIndex}`);
    values.push(data.icon);
    paramIndex++;
  }
  if (data.sortOrder !== undefined) {
    updates.push(`sort_order = $${paramIndex}`);
    values.push(data.sortOrder);
    paramIndex++;
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex}`);
    values.push(data.isActive);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query(
    `UPDATE knowledge_categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Category not found');
  }

  return result.rows[0];
}

export async function deleteCategory(id: number): Promise<void> {
  await query('DELETE FROM knowledge_categories WHERE id = $1', [id]);
}

// ==================== 知识文档管理 ====================

export interface KnowledgeArticle {
  id: number;
  category_id: number | null;
  title: string;
  content: string;
  summary: string | null;
  tags: string[] | null;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getArticles(params: {
  categoryId?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  keyword?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}): Promise<{ data: KnowledgeArticle[]; total: number }> {
  const { categoryId, isPublished, isFeatured, keyword, tags, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (categoryId !== undefined) {
    whereConditions.push(`category_id = $${paramIndex}`);
    queryParams.push(categoryId);
    paramIndex++;
  }

  if (isPublished !== undefined) {
    whereConditions.push(`is_published = $${paramIndex}`);
    queryParams.push(isPublished);
    paramIndex++;
  }

  if (isFeatured !== undefined) {
    whereConditions.push(`is_featured = $${paramIndex}`);
    queryParams.push(isFeatured);
    paramIndex++;
  }

  if (keyword) {
    whereConditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
    queryParams.push(`%${keyword}%`);
    paramIndex++;
  }

  if (tags && tags.length > 0) {
    whereConditions.push(`tags && $${paramIndex}`);
    queryParams.push(tags);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM knowledge_articles ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // 获取数据
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT * FROM knowledge_articles ${whereClause}
    ORDER BY is_featured DESC, sort_order, created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  return {
    data: result.rows,
    total
  };
}

export async function getArticleById(id: number): Promise<KnowledgeArticle | null> {
  const result = await query('SELECT * FROM knowledge_articles WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createArticle(data: {
  categoryId?: number;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  createdBy?: string;
}): Promise<KnowledgeArticle> {
  const result = await query(
    `INSERT INTO knowledge_articles (
      category_id, title, content, summary, tags,
      is_published, is_featured, sort_order, created_by,
      published_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      data.categoryId || null,
      data.title,
      data.content,
      data.summary || null,
      data.tags || null,
      data.isPublished || false,
      data.isFeatured || false,
      data.sortOrder || 0,
      data.createdBy || null,
      data.isPublished ? new Date() : null
    ]
  );

  return result.rows[0];
}

export async function updateArticle(id: number, data: {
  categoryId?: number;
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  updatedBy?: string;
}): Promise<KnowledgeArticle> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.categoryId !== undefined) {
    updates.push(`category_id = $${paramIndex}`);
    values.push(data.categoryId);
    paramIndex++;
  }
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex}`);
    values.push(data.title);
    paramIndex++;
  }
  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex}`);
    values.push(data.content);
    paramIndex++;
  }
  if (data.summary !== undefined) {
    updates.push(`summary = $${paramIndex}`);
    values.push(data.summary);
    paramIndex++;
  }
  if (data.tags !== undefined) {
    updates.push(`tags = $${paramIndex}`);
    values.push(data.tags);
    paramIndex++;
  }
  if (data.isPublished !== undefined) {
    updates.push(`is_published = $${paramIndex}`);
    values.push(data.isPublished);
    paramIndex++;

    // 如果从未发布改为发布，设置发布时间
    if (data.isPublished) {
      updates.push(`published_at = CURRENT_TIMESTAMP`);
    }
  }
  if (data.isFeatured !== undefined) {
    updates.push(`is_featured = $${paramIndex}`);
    values.push(data.isFeatured);
    paramIndex++;
  }
  if (data.sortOrder !== undefined) {
    updates.push(`sort_order = $${paramIndex}`);
    values.push(data.sortOrder);
    paramIndex++;
  }
  if (data.updatedBy !== undefined) {
    updates.push(`updated_by = $${paramIndex}`);
    values.push(data.updatedBy);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query(
    `UPDATE knowledge_articles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Article not found');
  }

  return result.rows[0];
}

export async function deleteArticle(id: number): Promise<void> {
  await query('DELETE FROM knowledge_articles WHERE id = $1', [id]);
}

export async function incrementArticleView(id: number): Promise<void> {
  await query('UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = $1', [id]);
}

// ==================== FAQ管理 ====================

export interface FAQ {
  id: number;
  category_id: number | null;
  question: string;
  answer: string;
  tags: string[] | null;
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getFAQs(params: {
  categoryId?: number;
  isPublished?: boolean;
  keyword?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}): Promise<{ data: FAQ[]; total: number }> {
  const { categoryId, isPublished, keyword, tags, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (categoryId !== undefined) {
    whereConditions.push(`category_id = $${paramIndex}`);
    queryParams.push(categoryId);
    paramIndex++;
  }

  if (isPublished !== undefined) {
    whereConditions.push(`is_published = $${paramIndex}`);
    queryParams.push(isPublished);
    paramIndex++;
  }

  if (keyword) {
    whereConditions.push(`(question ILIKE $${paramIndex} OR answer ILIKE $${paramIndex})`);
    queryParams.push(`%${keyword}%`);
    paramIndex++;
  }

  if (tags && tags.length > 0) {
    whereConditions.push(`tags && $${paramIndex}`);
    queryParams.push(tags);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) as total FROM faqs ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  queryParams.push(limit, offset);
  const result = await query(
    `SELECT * FROM faqs ${whereClause}
    ORDER BY sort_order, created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  return {
    data: result.rows,
    total
  };
}

export async function createFAQ(data: {
  categoryId?: number;
  question: string;
  answer: string;
  tags?: string[];
  isPublished?: boolean;
  sortOrder?: number;
  createdBy?: string;
}): Promise<FAQ> {
  const result = await query(
    `INSERT INTO faqs (category_id, question, answer, tags, is_published, sort_order, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.categoryId || null,
      data.question,
      data.answer,
      data.tags || null,
      data.isPublished !== false,
      data.sortOrder || 0,
      data.createdBy || null
    ]
  );

  return result.rows[0];
}

export async function updateFAQ(id: number, data: {
  categoryId?: number;
  question?: string;
  answer?: string;
  tags?: string[];
  isPublished?: boolean;
  sortOrder?: number;
  updatedBy?: string;
}): Promise<FAQ> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.categoryId !== undefined) {
    updates.push(`category_id = $${paramIndex}`);
    values.push(data.categoryId);
    paramIndex++;
  }
  if (data.question !== undefined) {
    updates.push(`question = $${paramIndex}`);
    values.push(data.question);
    paramIndex++;
  }
  if (data.answer !== undefined) {
    updates.push(`answer = $${paramIndex}`);
    values.push(data.answer);
    paramIndex++;
  }
  if (data.tags !== undefined) {
    updates.push(`tags = $${paramIndex}`);
    values.push(data.tags);
    paramIndex++;
  }
  if (data.isPublished !== undefined) {
    updates.push(`is_published = $${paramIndex}`);
    values.push(data.isPublished);
    paramIndex++;
  }
  if (data.sortOrder !== undefined) {
    updates.push(`sort_order = $${paramIndex}`);
    values.push(data.sortOrder);
    paramIndex++;
  }
  if (data.updatedBy !== undefined) {
    updates.push(`updated_by = $${paramIndex}`);
    values.push(data.updatedBy);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query(
    `UPDATE faqs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
}

export async function deleteFAQ(id: number): Promise<void> {
  await query('DELETE FROM faqs WHERE id = $1', [id]);
}

// ==================== 搜索功能 ====================

export async function searchKnowledge(params: {
  keyword: string;
  page?: number;
  limit?: number;
}): Promise<{
  articles: KnowledgeArticle[];
  faqs: FAQ[];
  total: number;
}> {
  const { keyword, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  // 搜索文档
  const articlesResult = await query(
    `SELECT * FROM knowledge_articles
    WHERE is_published = true
    AND (title ILIKE $1 OR content ILIKE $1)
    ORDER BY view_count DESC
    LIMIT $2 OFFSET $3`,
    [`%${keyword}%`, limit, offset]
  );

  // 搜索FAQ
  const faqsResult = await query(
    `SELECT * FROM faqs
    WHERE is_published = true
    AND (question ILIKE $1 OR answer ILIKE $1)
    ORDER BY view_count DESC
    LIMIT $2 OFFSET $3`,
    [`%${keyword}%`, limit, offset]
  );

  const total = articlesResult.rows.length + faqsResult.rows.length;

  return {
    articles: articlesResult.rows,
    faqs: faqsResult.rows,
    total
  };
}

// ==================== 统计功能 ====================

export async function getKnowledgeStatistics(): Promise<{
  totalCategories: number;
  totalArticles: number;
  publishedArticles: number;
  totalFAQs: number;
  totalViews: number;
  topArticles: Array<{ id: number; title: string; view_count: number }>;
  topFAQs: Array<{ id: number; question: string; view_count: number }>;
}> {
  const categoriesCount = await query('SELECT COUNT(*) as total FROM knowledge_categories');
  const articlesCount = await query('SELECT COUNT(*) as total FROM knowledge_articles');
  const publishedCount = await query('SELECT COUNT(*) as total FROM knowledge_articles WHERE is_published = true');
  const faqsCount = await query('SELECT COUNT(*) as total FROM faqs');

  const totalViews = await query(
    `SELECT
      COALESCE(SUM(view_count), 0) as total
    FROM (
      SELECT view_count FROM knowledge_articles
      UNION ALL
      SELECT view_count FROM faqs
    ) as combined`
  );

  const topArticles = await query(
    `SELECT id, title, view_count
    FROM knowledge_articles
    WHERE is_published = true
    ORDER BY view_count DESC
    LIMIT 10`
  );

  const topFAQs = await query(
    `SELECT id, question, view_count
    FROM faqs
    WHERE is_published = true
    ORDER BY view_count DESC
    LIMIT 10`
  );

  return {
    totalCategories: parseInt(categoriesCount.rows[0].total),
    totalArticles: parseInt(articlesCount.rows[0].total),
    publishedArticles: parseInt(publishedCount.rows[0].total),
    totalFAQs: parseInt(faqsCount.rows[0].total),
    totalViews: parseInt(totalViews.rows[0].total),
    topArticles: topArticles.rows,
    topFAQs: topFAQs.rows
  };
}
