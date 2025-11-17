/**
 * 敏感词过滤服务层
 * 负责敏感词管理、内容检测、命中记录等功能
 */

import { query } from '../../config/database';

/**
 * 敏感词接口
 */
export interface SensitiveWord {
  id: number;
  word: string;
  category: string;  // 分类: 政治、色情、暴力、广告等
  severity: 'low' | 'medium' | 'high' | 'critical';  // 严重程度
  action: 'warn' | 'replace' | 'block';  // 处理动作
  replacement?: string;  // 替换词
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 敏感词命中记录
 */
export interface SensitiveWordHit {
  id: number;
  wordId: number;
  word: string;
  sessionId?: number;
  agentId?: number;
  userId?: string;
  message: string;
  hitCount: number;
  action: string;
  createdAt: Date;
}

/**
 * 添加敏感词
 */
export const addSensitiveWord = async (data: {
  word: string;
  category: string;
  severity: string;
  action: string;
  replacement?: string;
  createdBy: number;
}): Promise<SensitiveWord> => {
  const result = await query(
    `INSERT INTO sensitive_words (
      word, category, severity, action, replacement, is_active, created_by
    ) VALUES ($1, $2, $3, $4, $5, true, $6)
    RETURNING *`,
    [
      data.word.toLowerCase(),
      data.category,
      data.severity,
      data.action,
      data.replacement || null,
      data.createdBy
    ]
  );

  return mapRowToSensitiveWord(result.rows[0]);
};

/**
 * 获取敏感词列表
 */
export const getSensitiveWords = async (filters: {
  category?: string;
  severity?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ words: SensitiveWord[]; total: number }> => {
  const {
    category,
    severity,
    isActive,
    page = 1,
    limit = 50
  } = filters;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(category);
  }

  if (severity) {
    conditions.push(`severity = $${paramIndex++}`);
    params.push(severity);
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM sensitive_words WHERE ${conditions.join(' AND ')}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // 获取分页数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataResult = await query(
    `SELECT * FROM sensitive_words
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  const words = dataResult.rows.map(mapRowToSensitiveWord);

  return { words, total };
};

/**
 * 获取所有激活的敏感词 (用于检测)
 */
export const getActiveSensitiveWords = async (): Promise<SensitiveWord[]> => {
  const result = await query(
    `SELECT * FROM sensitive_words WHERE is_active = true ORDER BY word`,
    []
  );

  return result.rows.map(mapRowToSensitiveWord);
};

/**
 * 检测文本中的敏感词
 */
export const detectSensitiveWords = async (
  text: string
): Promise<{
  hasSensitiveWords: boolean;
  detectedWords: Array<{
    word: string;
    category: string;
    severity: string;
    action: string;
    replacement?: string;
  }>;
  filteredText: string;
  shouldBlock: boolean;
}> => {
  const words = await getActiveSensitiveWords();
  const textLower = text.toLowerCase();
  const detectedWords: Array<{
    word: string;
    category: string;
    severity: string;
    action: string;
    replacement?: string;
  }> = [];

  let filteredText = text;
  let shouldBlock = false;

  for (const word of words) {
    if (textLower.includes(word.word.toLowerCase())) {
      detectedWords.push({
        word: word.word,
        category: word.category,
        severity: word.severity,
        action: word.action,
        replacement: word.replacement
      });

      // 处理动作
      if (word.action === 'block') {
        shouldBlock = true;
      } else if (word.action === 'replace' && word.replacement) {
        // 替换敏感词
        const regex = new RegExp(word.word, 'gi');
        filteredText = filteredText.replace(regex, word.replacement);
      }
    }
  }

  return {
    hasSensitiveWords: detectedWords.length > 0,
    detectedWords,
    filteredText,
    shouldBlock
  };
};

/**
 * 记录敏感词命中
 */
export const recordSensitiveWordHit = async (data: {
  wordId: number;
  word: string;
  sessionId?: number;
  agentId?: number;
  userId?: string;
  message: string;
  action: string;
}): Promise<SensitiveWordHit> => {
  const result = await query(
    `INSERT INTO sensitive_word_logs (
      word_id, word, session_id, agent_id, user_id, message, hit_count, action
    ) VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
    RETURNING *`,
    [
      data.wordId,
      data.word,
      data.sessionId || null,
      data.agentId || null,
      data.userId || null,
      data.message,
      data.action
    ]
  );

  return mapRowToSensitiveWordHit(result.rows[0]);
};

/**
 * 获取敏感词命中记录
 */
export const getSensitiveWordHits = async (filters: {
  wordId?: number;
  sessionId?: number;
  agentId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ hits: SensitiveWordHit[]; total: number }> => {
  const {
    wordId,
    sessionId,
    agentId,
    startDate,
    endDate,
    page = 1,
    limit = 20
  } = filters;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (wordId) {
    conditions.push(`word_id = $${paramIndex++}`);
    params.push(wordId);
  }

  if (sessionId) {
    conditions.push(`session_id = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (agentId) {
    conditions.push(`agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM sensitive_word_logs WHERE ${conditions.join(' AND ')}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // 获取分页数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataResult = await query(
    `SELECT * FROM sensitive_word_logs
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  const hits = dataResult.rows.map(mapRowToSensitiveWordHit);

  return { hits, total };
};

/**
 * 获取敏感词统计
 */
export const getSensitiveWordStatistics = async (filters: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalWords: number;
  activeWords: number;
  totalHits: number;
  topHitWords: Array<{ word: string; category: string; hitCount: number }>;
  hitsBySeverity: Array<{ severity: string; count: number }>;
  hitsByCategory: Array<{ category: string; count: number }>;
}> => {
  const { startDate, endDate } = filters;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  // 基础统计
  const wordsResult = await query(
    `SELECT
       COUNT(*) as total_words,
       COUNT(*) FILTER (WHERE is_active = true) as active_words
     FROM sensitive_words`,
    []
  );

  const hitsResult = await query(
    `SELECT COUNT(*) as total_hits FROM sensitive_word_logs
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  // 命中最多的词（使用unnest展开数组）
  const topWordsResult = await query(
    `SELECT
       unnest(detected_words) as word,
       COUNT(*) as hit_count
     FROM sensitive_word_logs
     WHERE ${conditions.join(' AND ')}
     GROUP BY word
     ORDER BY hit_count DESC
     LIMIT 10`,
    params
  );

  // 按严重程度统计（简化版本，暂时返回总数）
  const bySeverityResult = await query(
    `SELECT
       'medium' as severity,
       COUNT(*) as count
     FROM sensitive_word_logs
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  // 按分类统计（简化版本，暂时返回总数）
  const byCategoryResult = await query(
    `SELECT
       'general' as category,
       COUNT(*) as count
     FROM sensitive_word_logs
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  return {
    totalWords: parseInt(wordsResult.rows[0]?.total_words || 0),
    activeWords: parseInt(wordsResult.rows[0]?.active_words || 0),
    totalHits: parseInt(hitsResult.rows[0]?.total_hits || 0),
    topHitWords: topWordsResult.rows.map(row => ({
      word: row.word,
      category: 'general',  // 暂时使用固定值，未来可以从sensitive_words表关联
      hitCount: parseInt(row.hit_count)
    })),
    hitsBySeverity: bySeverityResult.rows.map(row => ({
      severity: row.severity,
      count: parseInt(row.count)
    })),
    hitsByCategory: byCategoryResult.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    }))
  };
};

/**
 * 更新敏感词
 */
export const updateSensitiveWord = async (
  id: number,
  updates: Partial<{
    word: string;
    category: string;
    severity: string;
    action: string;
    replacement: string;
    isActive: boolean;
  }>
): Promise<SensitiveWord> => {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.word) {
    fields.push(`word = $${paramIndex++}`);
    params.push(updates.word.toLowerCase());
  }

  if (updates.category) {
    fields.push(`category = $${paramIndex++}`);
    params.push(updates.category);
  }

  if (updates.severity) {
    fields.push(`severity = $${paramIndex++}`);
    params.push(updates.severity);
  }

  if (updates.action) {
    fields.push(`action = $${paramIndex++}`);
    params.push(updates.action);
  }

  if (updates.replacement !== undefined) {
    fields.push(`replacement = $${paramIndex++}`);
    params.push(updates.replacement);
  }

  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    params.push(updates.isActive);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const result = await query(
    `UPDATE sensitive_words
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  return mapRowToSensitiveWord(result.rows[0]);
};

/**
 * 删除敏感词
 */
export const deleteSensitiveWord = async (id: number): Promise<boolean> => {
  const result = await query(
    'DELETE FROM sensitive_words WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * 辅助函数：将数据库行映射为敏感词对象
 */
function mapRowToSensitiveWord(row: any): SensitiveWord {
  return {
    id: row.id,
    word: row.word,
    category: row.category,
    severity: row.severity,
    action: row.action,
    replacement: row.replacement,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * 辅助函数：将数据库行映射为命中记录对象
 */
function mapRowToSensitiveWordHit(row: any): SensitiveWordHit {
  return {
    id: row.id,
    wordId: row.word_id,
    word: row.word,
    sessionId: row.session_id,
    agentId: row.agent_id,
    userId: row.user_id,
    message: row.message,
    hitCount: row.hit_count,
    action: row.action,
    createdAt: row.created_at
  };
}
