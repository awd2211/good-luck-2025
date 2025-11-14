/**
 * 快捷回复模板服务层
 * 负责快捷回复模板的CRUD操作、分类管理、使用统计等业务逻辑
 */

import { query } from '../../config/database';
import type { QuickReplyTemplate } from '../../types/webchat';

/**
 * 创建快捷回复模板
 */
export const createTemplate = async (data: {
  agentId?: number;
  category: string;
  title: string;
  content: string;
  shortcutKey?: string;
}): Promise<QuickReplyTemplate> => {
  const {
    agentId,
    category,
    title,
    content,
    shortcutKey
  } = data;

  const result = await query(
    `INSERT INTO quick_reply_templates
     (agent_id, category, title, content, shortcut_key)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [agentId, category, title, content, shortcutKey]
  );

  return result.rows[0];
};

/**
 * 根据ID获取模板
 */
export const getTemplateById = async (id: number): Promise<QuickReplyTemplate | null> => {
  const result = await query(
    'SELECT * FROM quick_reply_templates WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

/**
 * 获取模板列表
 */
export const getTemplates = async (filters?: {
  agentId?: number;
  category?: string;
  isActive?: boolean;
  includeGlobal?: boolean; // 是否包含全局模板(agent_id = NULL)
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<{ templates: QuickReplyTemplate[]; total: number }> => {
  const {
    agentId,
    category,
    isActive,
    includeGlobal = true,
    keyword,
    page = 1,
    limit = 50
  } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (agentId !== undefined) {
    if (includeGlobal) {
      // 包含个人模板和全局模板
      whereConditions.push(`(agent_id = $${paramIndex++} OR agent_id IS NULL)`);
      params.push(agentId);
    } else {
      // 只包含个人模板
      whereConditions.push(`agent_id = $${paramIndex++}`);
      params.push(agentId);
    }
  } else if (!includeGlobal) {
    // 只查询全局模板
    whereConditions.push('agent_id IS NULL');
  }

  if (category) {
    whereConditions.push(`category = $${paramIndex++}`);
    params.push(category);
  }

  if (isActive !== undefined) {
    whereConditions.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }

  if (keyword) {
    whereConditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
    params.push(`%${keyword}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM quick_reply_templates ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 获取数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataResult = await query(
    `SELECT * FROM quick_reply_templates
     ${whereClause}
     ORDER BY category, usage_count DESC, created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  return {
    templates: dataResult.rows,
    total
  };
};

/**
 * 获取所有分类
 */
export const getCategories = async (
  agentId?: number
): Promise<Array<{ category: string; count: number }>> => {
  let whereClause = 'WHERE is_active = true';
  const params: any[] = [];

  if (agentId !== undefined) {
    whereClause += ' AND (agent_id = $1 OR agent_id IS NULL)';
    params.push(agentId);
  }

  const result = await query(
    `SELECT category, COUNT(*) as count
     FROM quick_reply_templates
     ${whereClause}
     GROUP BY category
     ORDER BY category`,
    params
  );

  return result.rows.map(row => ({
    category: row.category,
    count: parseInt(row.count)
  }));
};

/**
 * 更新模板
 */
export const updateTemplate = async (
  id: number,
  data: Partial<Omit<QuickReplyTemplate, 'id' | 'agent_id' | 'created_at' | 'updated_at'>>
): Promise<QuickReplyTemplate | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return getTemplateById(id);
  }

  values.push(id);

  const result = await query(
    `UPDATE quick_reply_templates
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * 删除模板
 */
export const deleteTemplate = async (id: number): Promise<boolean> => {
  const result = await query(
    'DELETE FROM quick_reply_templates WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * 软删除模板(停用)
 */
export const deactivateTemplate = async (id: number): Promise<QuickReplyTemplate | null> => {
  const result = await query(
    `UPDATE quick_reply_templates
     SET is_active = false
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * 激活模板
 */
export const activateTemplate = async (id: number): Promise<QuickReplyTemplate | null> => {
  const result = await query(
    `UPDATE quick_reply_templates
     SET is_active = true
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * 增加模板使用次数
 */
export const incrementUsageCount = async (id: number): Promise<void> => {
  await query(
    `UPDATE quick_reply_templates
     SET usage_count = usage_count + 1
     WHERE id = $1`,
    [id]
  );
};

/**
 * 根据快捷键查找模板
 */
export const getTemplateByShortcut = async (
  shortcutKey: string,
  agentId?: number
): Promise<QuickReplyTemplate | null> => {
  let whereClause = 'WHERE shortcut_key = $1 AND is_active = true';
  const params: any[] = [shortcutKey];

  if (agentId !== undefined) {
    whereClause += ' AND (agent_id = $2 OR agent_id IS NULL)';
    params.push(agentId);
  }

  // 优先返回个人模板
  const result = await query(
    `SELECT * FROM quick_reply_templates
     ${whereClause}
     ORDER BY agent_id DESC NULLS LAST
     LIMIT 1`,
    params
  );

  return result.rows[0] || null;
};

/**
 * 获取热门模板(按使用次数排序)
 */
export const getPopularTemplates = async (
  limit: number = 10,
  agentId?: number
): Promise<QuickReplyTemplate[]> => {
  let whereClause = 'WHERE is_active = true';
  const params: any[] = [];

  if (agentId !== undefined) {
    whereClause += ' AND (agent_id = $1 OR agent_id IS NULL)';
    params.push(agentId);
  }

  params.push(limit);
  const paramIndex = params.length;

  const result = await query(
    `SELECT * FROM quick_reply_templates
     ${whereClause}
     ORDER BY usage_count DESC
     LIMIT $${paramIndex}`,
    params
  );

  return result.rows;
};

/**
 * 批量创建模板
 */
export const createBulkTemplates = async (
  templates: Array<{
    agentId?: number;
    category: string;
    title: string;
    content: string;
    shortcutKey?: string;
  }>
): Promise<QuickReplyTemplate[]> => {
  if (templates.length === 0) {
    return [];
  }

  // 构建批量插入语句
  const values: any[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  templates.forEach((template, index) => {
    placeholders.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
    );
    values.push(
      template.agentId,
      template.category,
      template.title,
      template.content,
      template.shortcutKey
    );
    paramIndex += 5;
  });

  const result = await query(
    `INSERT INTO quick_reply_templates
     (agent_id, category, title, content, shortcut_key)
     VALUES ${placeholders.join(', ')}
     RETURNING *`,
    values
  );

  return result.rows;
};

/**
 * 复制模板(从全局复制到个人,或从其他客服复制)
 */
export const copyTemplate = async (
  templateId: number,
  newAgentId?: number
): Promise<QuickReplyTemplate | null> => {
  // 获取原模板
  const original = await getTemplateById(templateId);

  if (!original) {
    return null;
  }

  // 创建副本
  const result = await query(
    `INSERT INTO quick_reply_templates
     (agent_id, category, title, content, shortcut_key)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      newAgentId,
      original.category,
      `${original.title} (副本)`,
      original.content,
      null // 清空快捷键,避免冲突
    ]
  );

  return result.rows[0];
};

/**
 * 导入默认模板到个人模板库
 */
export const importDefaultTemplates = async (
  agentId: number
): Promise<QuickReplyTemplate[]> => {
  // 获取所有全局模板
  const globalTemplates = await query(
    'SELECT * FROM quick_reply_templates WHERE agent_id IS NULL AND is_active = true'
  );

  if (globalTemplates.rows.length === 0) {
    return [];
  }

  // 批量创建个人模板
  const templates = globalTemplates.rows.map(t => ({
    agentId,
    category: t.category,
    title: t.title,
    content: t.content,
    shortcutKey: t.shortcut_key
  }));

  return createBulkTemplates(templates);
};

/**
 * 替换模板中的变量
 * 例如: "您好,我是{name}" → "您好,我是张三"
 */
export const replaceTemplateVariables = (
  content: string,
  variables: Record<string, string>
): string => {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
};

/**
 * 获取模板使用统计
 */
export const getUsageStatistics = async (
  agentId?: number,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  templateId: number;
  title: string;
  category: string;
  usageCount: number;
}>> => {
  let whereConditions: string[] = ["cm.message_type = 'quick_reply'"];
  const params: any[] = [];
  let paramIndex = 1;

  if (agentId !== undefined) {
    whereConditions.push(`cs.agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (startDate) {
    whereConditions.push(`cm.created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`cm.created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const result = await query(
    `SELECT
       (cm.metadata->>'template_id')::integer as template_id,
       qrt.title,
       qrt.category,
       COUNT(*) as usage_count
     FROM chat_messages cm
     JOIN chat_sessions cs ON cm.session_id = cs.id
     LEFT JOIN quick_reply_templates qrt ON (cm.metadata->>'template_id')::integer = qrt.id
     ${whereClause}
     GROUP BY template_id, qrt.title, qrt.category
     ORDER BY usage_count DESC`,
    params
  );

  return result.rows.map(row => ({
    templateId: row.template_id,
    title: row.title || '未知模板',
    category: row.category || '未分类',
    usageCount: parseInt(row.usage_count)
  }));
};

/**
 * 搜索模板内容
 */
export const searchTemplates = async (
  keyword: string,
  agentId?: number,
  limit: number = 20
): Promise<QuickReplyTemplate[]> => {
  let whereConditions: string[] = [
    '(title ILIKE $1 OR content ILIKE $1)',
    'is_active = true'
  ];
  const params: any[] = [`%${keyword}%`];
  let paramIndex = 2;

  if (agentId !== undefined) {
    whereConditions.push(`(agent_id = $${paramIndex++} OR agent_id IS NULL)`);
    params.push(agentId);
  }

  params.push(limit);

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const result = await query(
    `SELECT * FROM quick_reply_templates
     ${whereClause}
     ORDER BY usage_count DESC
     LIMIT $${paramIndex}`,
    params
  );

  return result.rows;
};

/**
 * 验证快捷键是否可用
 */
export const isShortcutAvailable = async (
  shortcutKey: string,
  agentId?: number,
  excludeId?: number
): Promise<boolean> => {
  let whereConditions: string[] = ['shortcut_key = $1'];
  const params: any[] = [shortcutKey];
  let paramIndex = 2;

  if (agentId !== undefined) {
    whereConditions.push(`(agent_id = $${paramIndex++} OR agent_id IS NULL)`);
    params.push(agentId);
  }

  if (excludeId !== undefined) {
    whereConditions.push(`id != $${paramIndex++}`);
    params.push(excludeId);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const result = await query(
    `SELECT COUNT(*) FROM quick_reply_templates ${whereClause}`,
    params
  );

  return parseInt(result.rows[0].count) === 0;
};
