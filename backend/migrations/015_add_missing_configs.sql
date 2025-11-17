-- =====================================================
-- 添加缺失的配置项
-- 包括：客服系统、WebSocket、安全配置
-- =====================================================

-- 客服系统配置
INSERT INTO app_configs (config_key, config_value, value_type, category, description, is_public, is_editable)
VALUES
  ('cs.maxConcurrentChats', '5', 'number', 'customer_service', '客服最大并发聊天数', false, true),
  ('cs.inactiveTimeoutMinutes', '30', 'number', 'customer_service', '客服不活跃超时（分钟）', false, true),
  ('cs.cleanupIntervalMinutes', '10', 'number', 'customer_service', '客服状态清理间隔（分钟）', false, true),
  ('cs.sessionTimeoutMinutes', '30', 'number', 'customer_service', '会话超时时间（分钟）', false, true)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- WebSocket 配置
INSERT INTO app_configs (config_key, config_value, value_type, category, description, is_public, is_editable)
VALUES
  ('websocket.pingTimeout', '60000', 'number', 'websocket', 'WebSocket ping 超时（毫秒）', false, true),
  ('websocket.pingInterval', '25000', 'number', 'websocket', 'WebSocket ping 间隔（毫秒）', false, true),
  ('websocket.timeoutCleanerInterval', '5', 'number', 'websocket', '超时会话清理间隔（分钟）', false, true)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 安全配置
INSERT INTO app_configs (config_key, config_value, value_type, category, description, is_public, is_editable)
VALUES
  ('security.bcryptSaltRounds', '10', 'number', 'security', 'bcrypt 密码加密轮数', false, true)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 显示插入结果
SELECT
  category,
  COUNT(*) as config_count
FROM app_configs
WHERE category IN ('customer_service', 'websocket', 'security')
GROUP BY category
ORDER BY category;

COMMENT ON COLUMN app_configs.config_key IS '配置键，使用点分隔的层级命名（如：cache.articles.ttl）';
COMMENT ON COLUMN app_configs.value_type IS '值类型：string, number, boolean, json';
COMMENT ON COLUMN app_configs.category IS '配置分类：cache, rateLimit, customer_service, websocket, security 等';
