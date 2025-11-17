/**
 * 配置管理服务
 * 负责从数据库加载和管理应用配置
 * 支持多层缓存：L1内存缓存 + L2 Redis缓存
 * 支持热更新和跨实例缓存同步
 */

import pool from '../config/database';
import { config as envConfig } from '../config';
import { redisCache } from '../config/redis';

interface AppConfig {
  id: number;
  config_key: string;
  config_value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  is_public: boolean;
  is_editable: boolean;
  default_value?: string;
}

interface CSConfig {
  id: number;
  max_concurrent_chats: number;
  agent_inactive_timeout_minutes: number;
  agent_cleanup_interval_minutes: number;
  session_timeout_minutes: number;
  auto_assign_enabled: boolean;
  working_hours_start: string;
  working_hours_end: string;
  max_queue_size: number;
  priority_routing_enabled: boolean;
  ai_assistant_enabled: boolean;
  satisfaction_survey_enabled: boolean;
}

class ConfigService {
  private configCache: Map<string, any> = new Map();
  private csConfigCache: CSConfig | null = null;
  private lastLoadTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1分钟缓存

  /**
   * 初始化配置服务，从数据库加载所有配置
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAllConfigs();
      console.log('✅ 配置服务初始化成功');
      console.log(`📦 已加载 ${this.configCache.size} 个配置项`);
    } catch (error) {
      console.error('❌ 配置服务初始化失败:', error);
      // 初始化失败时使用环境变量作为后备
      console.warn('⚠️  使用环境变量作为后备配置');
    }
  }

  /**
   * 从数据库加载所有配置
   * 写入多层缓存：内存 + Redis
   */
  private async loadAllConfigs(): Promise<void> {
    const client = await pool.connect();
    try {
      // 加载通用配置
      const result = await client.query<AppConfig>(
        'SELECT * FROM app_configs ORDER BY category, config_key'
      );

      this.configCache.clear();
      const redisOps: Promise<void>[] = [];

      for (const row of result.rows) {
        const value = this.parseConfigValue(row.config_value, row.value_type);

        // L1: 写入内存缓存
        this.configCache.set(row.config_key, value);

        // L2: 写入 Redis 缓存（1小时TTL）
        redisOps.push(
          redisCache.set(`config:${row.config_key}`, value, 3600).catch(err => {
            console.warn(`⚠️ Redis缓存配置失败 (${row.config_key}):`, err.message);
          })
        );
      }

      // 加载客服配置
      const csResult = await client.query<CSConfig>(
        'SELECT * FROM customer_service_configs LIMIT 1'
      );

      if (csResult.rows.length > 0) {
        this.csConfigCache = csResult.rows[0];

        // L2: 写入 Redis 缓存
        redisOps.push(
          redisCache.set('config:cs_config', csResult.rows[0], 3600).catch(err => {
            console.warn('⚠️ Redis缓存客服配置失败:', err.message);
          })
        );
      }

      // 等待所有 Redis 写入完成（不阻塞主流程）
      Promise.all(redisOps).catch(() => {
        console.warn('⚠️ 部分配置写入 Redis 失败');
      });

      this.lastLoadTime = Date.now();
    } finally {
      client.release();
    }
  }

  /**
   * 解析配置值
   */
  private parseConfigValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * 获取配置值
   * 多层缓存策略：L1 内存 → L2 Redis → 数据库
   * @param key 配置键
   * @param defaultValue 默认值
   * @param useEnvFallback 是否使用环境变量作为后备
   */
  async get<T = any>(
    key: string,
    defaultValue?: T,
    useEnvFallback: boolean = true
  ): Promise<T> {
    // 检查缓存是否过期
    if (Date.now() - this.lastLoadTime > this.CACHE_TTL) {
      await this.reload();
    }

    // L1: 从内存缓存获取
    if (this.configCache.has(key)) {
      return this.configCache.get(key) as T;
    }

    // L2: 从 Redis 缓存获取
    try {
      const redisKey = `config:${key}`;
      const cachedValue = await redisCache.get<T>(redisKey);

      if (cachedValue !== null) {
        // 写回内存缓存
        this.configCache.set(key, cachedValue);
        return cachedValue;
      }
    } catch (error) {
      console.warn(`⚠️ Redis读取配置失败 (${key}):`, error instanceof Error ? error.message : error);
    }

    // 使用环境变量后备
    if (useEnvFallback) {
      const envValue = this.getFromEnv(key);
      if (envValue !== undefined) {
        return envValue as T;
      }
    }

    // 返回默认值
    return defaultValue as T;
  }

  /**
   * 从环境变量获取配置（向后兼容）
   */
  private getFromEnv(key: string): any {
    // 映射数据库配置键到环境变量配置
    const envMap: Record<string, any> = {
      'cache.global.ttl': envConfig.cache.ttl,
      'cache.global.maxKeys': envConfig.cache.maxKeys,
      'rateLimit.window': envConfig.rateLimit.windowMs,
      'rateLimit.api.max': envConfig.rateLimit.max,
      'jwt.admin.expiresIn': envConfig.jwt.expiresIn,
      'jwt.user.expiresIn': envConfig.jwt.expiresIn,
    };

    return envMap[key];
  }

  /**
   * 获取客服配置
   * 多层缓存策略：L1 内存 → L2 Redis → 数据库
   */
  async getCSConfig(): Promise<CSConfig | null> {
    if (Date.now() - this.lastLoadTime > this.CACHE_TTL) {
      await this.reload();
    }

    // L1: 从内存缓存获取
    if (this.csConfigCache) {
      return this.csConfigCache;
    }

    // L2: 从 Redis 缓存获取
    try {
      const cached = await redisCache.get<CSConfig>('config:cs_config');
      if (cached) {
        this.csConfigCache = cached;
        return cached;
      }
    } catch (error) {
      console.warn('⚠️ Redis读取客服配置失败:', error instanceof Error ? error.message : error);
    }

    return null;
  }

  /**
   * 获取指定分类的所有配置
   */
  async getByCategory(category: string): Promise<Record<string, any>> {
    const client = await pool.connect();
    try {
      const result = await client.query<AppConfig>(
        'SELECT * FROM app_configs WHERE category = $1 ORDER BY config_key',
        [category]
      );

      const configs: Record<string, any> = {};
      for (const row of result.rows) {
        const value = this.parseConfigValue(row.config_value, row.value_type);
        configs[row.config_key] = value;
      }

      return configs;
    } finally {
      client.release();
    }
  }

  /**
   * 获取公开配置（前端可访问）
   */
  async getPublicConfigs(): Promise<Record<string, any>> {
    const client = await pool.connect();
    try {
      const result = await client.query<AppConfig>(
        'SELECT config_key, config_value, value_type, description FROM app_configs WHERE is_public = true'
      );

      const configs: Record<string, any> = {};
      for (const row of result.rows) {
        const value = this.parseConfigValue(row.config_value, row.value_type);
        configs[row.config_key] = {
          value,
          description: row.description,
        };
      }

      return configs;
    } finally {
      client.release();
    }
  }

  /**
   * 设置配置值
   */
  async set(
    key: string,
    value: any,
    updatedBy: string = 'system'
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      // 获取配置元数据
      const metaResult = await client.query<AppConfig>(
        'SELECT value_type, is_editable FROM app_configs WHERE config_key = $1',
        [key]
      );

      if (metaResult.rows.length === 0) {
        throw new Error(`配置键 ${key} 不存在`);
      }

      const { value_type, is_editable } = metaResult.rows[0];

      if (!is_editable) {
        throw new Error(`配置 ${key} 不可编辑`);
      }

      // 转换值为字符串
      let strValue: string;
      if (value_type === 'json') {
        strValue = JSON.stringify(value);
      } else {
        strValue = String(value);
      }

      // 更新配置
      const result = await client.query(
        `UPDATE app_configs
         SET config_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE config_key = $3 AND is_editable = true`,
        [strValue, updatedBy, key]
      );

      if (result.rowCount && result.rowCount > 0) {
        // 更新L1缓存
        const parsedValue = this.parseConfigValue(strValue, value_type);
        this.configCache.set(key, parsedValue);

        // 清除L2缓存（下次访问时重新加载）
        try {
          await redisCache.del(`config:${key}`);
        } catch (error) {
          console.warn(`⚠️ Redis清除配置失败 (${key}):`, error instanceof Error ? error.message : error);
        }

        return true;
      }

      return false;
    } finally {
      client.release();
    }
  }

  /**
   * 批量设置配置
   */
  async setMany(
    configs: Record<string, any>,
    updatedBy: string = 'system'
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const [key, value] of Object.entries(configs)) {
      try {
        await this.set(key, value, updatedBy);
        success.push(key);
      } catch (error) {
        failed.push(key);
        console.error(`设置配置 ${key} 失败:`, error);
      }
    }

    return { success, failed };
  }

  /**
   * 更新客服配置
   */
  async updateCSConfig(
    updates: Partial<CSConfig>,
    updatedBy: string = 'system'
  ): Promise<CSConfig> {
    const client = await pool.connect();
    try {
      // 构建更新语句
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      const query = `
        UPDATE customer_service_configs
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        RETURNING *
      `;

      const result = await client.query<CSConfig>(query, values);

      if (result.rows.length > 0) {
        // 更新L1缓存
        this.csConfigCache = result.rows[0];

        // 清除L2缓存（下次访问时重新加载）
        try {
          await redisCache.del('config:cs_config');
        } catch (error) {
          console.warn('⚠️ Redis清除客服配置失败:', error instanceof Error ? error.message : error);
        }

        return result.rows[0];
      }

      throw new Error('更新客服配置失败');
    } finally {
      client.release();
    }
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<void> {
    await this.loadAllConfigs();
    console.log('🔄 配置已重新加载');
  }

  /**
   * 获取配置统计信息
   */
  async getStats(): Promise<{
    totalConfigs: number;
    byCategory: Record<string, number>;
    cacheSize: number;
    lastLoadTime: Date;
  }> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT category, COUNT(*) as count
        FROM app_configs
        GROUP BY category
        ORDER BY category
      `);

      const byCategory: Record<string, number> = {};
      let total = 0;

      for (const row of result.rows) {
        byCategory[row.category] = parseInt(row.count);
        total += parseInt(row.count);
      }

      return {
        totalConfigs: total,
        byCategory,
        cacheSize: this.configCache.size,
        lastLoadTime: new Date(this.lastLoadTime),
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取配置变更历史
   */
  async getHistory(
    configKey?: string,
    limit: number = 50
  ): Promise<any[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT
          h.id,
          h.config_key,
          h.old_value,
          h.new_value,
          h.changed_by,
          h.changed_at,
          h.change_reason,
          c.category,
          c.description
        FROM app_config_history h
        LEFT JOIN app_configs c ON h.config_id = c.id
      `;

      const params: any[] = [];
      if (configKey) {
        query += ' WHERE h.config_key = $1';
        params.push(configKey);
      }

      query += ' ORDER BY h.changed_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 清空缓存（L1 内存 + L2 Redis）
   */
  async clearCache(): Promise<void> {
    // 清空L1缓存
    this.configCache.clear();
    this.csConfigCache = null;
    this.lastLoadTime = 0;

    // 清空L2缓存（删除所有config:*键）
    try {
      const deletedCount = await redisCache.delPattern('config:*');
      console.log(`🗑️  配置缓存已清空 (内存 + Redis ${deletedCount}个键)`);
    } catch (error) {
      console.warn('⚠️ Redis清除配置缓存失败:', error instanceof Error ? error.message : error);
      console.log('🗑️  配置内存缓存已清空');
    }
  }
}

// 导出单例
export const configService = new ConfigService();
export default configService;
