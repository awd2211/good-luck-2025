-- =====================================================
-- 应用配置系统迁移脚本
-- 混合方案：通用键值对表 + 客服系统专用表
-- =====================================================

-- 1. 通用配置表（方案A）
CREATE TABLE IF NOT EXISTS app_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,        -- 配置键（使用点分隔命名：category.module.key）
  config_value TEXT NOT NULL,                     -- 配置值（支持JSON格式）
  value_type VARCHAR(20) DEFAULT 'string',        -- 值类型：string, number, boolean, json
  category VARCHAR(50) NOT NULL,                  -- 分类：cache, rateLimit, jwt, websocket, security等
  description TEXT,                                -- 配置说明
  is_public BOOLEAN DEFAULT false,                -- 是否公开（前端可见）
  is_editable BOOLEAN DEFAULT true,               -- 是否可编辑
  validation_rule TEXT,                           -- 验证规则（正则表达式或JSON schema）
  default_value TEXT,                             -- 默认值
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50),                         -- 创建人
  updated_by VARCHAR(50)                          -- 最后修改人
);

-- 创建索引
CREATE INDEX idx_app_configs_category ON app_configs(category);
CREATE INDEX idx_app_configs_key ON app_configs(config_key);

-- 添加注释
COMMENT ON TABLE app_configs IS '应用配置表 - 通用键值对存储';
COMMENT ON COLUMN app_configs.config_key IS '配置键，使用点分隔命名，如：cache.articles.ttl';
COMMENT ON COLUMN app_configs.value_type IS '值类型：string(字符串), number(数字), boolean(布尔), json(JSON对象)';
COMMENT ON COLUMN app_configs.is_public IS '是否公开配置，公开配置可通过API查询';

-- 2. 配置变更历史表
CREATE TABLE IF NOT EXISTS app_config_history (
  id SERIAL PRIMARY KEY,
  config_id INTEGER REFERENCES app_configs(id) ON DELETE CASCADE,
  config_key VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(50),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_reason TEXT,
  ip_address VARCHAR(45)                          -- 操作IP
);

CREATE INDEX idx_config_history_config_id ON app_config_history(config_id);
CREATE INDEX idx_config_history_changed_at ON app_config_history(changed_at DESC);

COMMENT ON TABLE app_config_history IS '配置变更历史记录';

-- 3. 客服系统配置表（方案B - 专用表）
CREATE TABLE IF NOT EXISTS customer_service_configs (
  id SERIAL PRIMARY KEY,
  max_concurrent_chats INTEGER DEFAULT 5 CHECK (max_concurrent_chats > 0),
  agent_inactive_timeout_minutes INTEGER DEFAULT 30 CHECK (agent_inactive_timeout_minutes > 0),
  agent_cleanup_interval_minutes INTEGER DEFAULT 10 CHECK (agent_cleanup_interval_minutes > 0),
  session_timeout_minutes INTEGER DEFAULT 30 CHECK (session_timeout_minutes > 0),
  auto_assign_enabled BOOLEAN DEFAULT true,
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '18:00:00',
  max_queue_size INTEGER DEFAULT 100,
  priority_routing_enabled BOOLEAN DEFAULT false,
  ai_assistant_enabled BOOLEAN DEFAULT true,
  satisfaction_survey_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_working_hours CHECK (working_hours_end > working_hours_start)
);

COMMENT ON TABLE customer_service_configs IS '客服系统配置表 - 单记录表';

-- 插入默认客服配置
INSERT INTO customer_service_configs DEFAULT VALUES;

-- 4. 创建触发器 - 自动记录配置变更
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.config_value != NEW.config_value) THEN
    INSERT INTO app_config_history (
      config_id,
      config_key,
      old_value,
      new_value,
      changed_by,
      change_reason
    )
    VALUES (
      OLD.id,
      OLD.config_key,
      OLD.config_value,
      NEW.config_value,
      NEW.updated_by,
      '配置更新'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_config_change
AFTER UPDATE ON app_configs
FOR EACH ROW
EXECUTE FUNCTION log_config_change();

-- 5. 创建触发器 - 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_configs_updated_at
BEFORE UPDATE ON app_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cs_configs_updated_at
BEFORE UPDATE ON customer_service_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 初始化配置数据
-- =====================================================

-- 缓存配置
INSERT INTO app_configs (config_key, config_value, value_type, category, description, is_public, is_editable, default_value) VALUES
-- 全局缓存
('cache.global.ttl', '300000', 'number', 'cache', '全局缓存过期时间（毫秒）', false, true, '300000'),
('cache.global.maxKeys', '1000', 'number', 'cache', '最大缓存条目数', false, true, '1000'),
('cache.cleanupInterval', '60000', 'number', 'cache', '缓存清理间隔（毫秒）', false, true, '60000'),

-- 各模块缓存TTL（秒）
('cache.articles.ttl', '300', 'number', 'cache', '文章缓存过期时间（秒）', false, true, '300'),
('cache.horoscopes.ttl', '1800', 'number', 'cache', '每日运势缓存过期时间（秒）', false, true, '1800'),
('cache.systemConfigs.ttl', '7200', 'number', 'cache', '系统配置缓存过期时间（秒）', false, true, '7200'),
('cache.fortuneTemplates.ttl', '3600', 'number', 'cache', '算命模板缓存过期时间（秒）', false, true, '3600'),
('cache.fortuneServices.ttl', '3600', 'number', 'cache', '算命服务缓存过期时间（秒）', false, true, '3600'),
('cache.fortuneCategories.ttl', '3600', 'number', 'cache', '算命分类缓存过期时间（秒）', false, true, '3600'),
('cache.enabled', 'true', 'boolean', 'cache', '是否启用缓存', false, true, 'true'),

-- 限流配置
('rateLimit.window', '60000', 'number', 'rateLimit', '限流时间窗口（毫秒）', false, true, '60000'),
('rateLimit.api.max', '60', 'number', 'rateLimit', 'API通用限流次数', false, true, '60'),
('rateLimit.strict.max', '20', 'number', 'rateLimit', '严格限流次数（计算密集型接口）', false, true, '20'),
('rateLimit.loose.max', '100', 'number', 'rateLimit', '宽松限流次数（查询类接口）', false, true, '100'),
('rateLimit.enabled', 'true', 'boolean', 'rateLimit', '是否启用限流', false, true, 'true'),

-- JWT配置
('jwt.admin.expiresIn', '24h', 'string', 'jwt', '管理员Token过期时间', false, true, '24h'),
('jwt.user.expiresIn', '30d', 'string', 'jwt', '用户Token过期时间', false, true, '30d'),
('jwt.refreshToken.expiresIn', '7d', 'string', 'jwt', '刷新Token过期时间', false, true, '7d'),

-- WebSocket配置
('websocket.pingTimeout', '60000', 'number', 'websocket', 'Socket ping超时（毫秒）', false, true, '60000'),
('websocket.pingInterval', '25000', 'number', 'websocket', 'Socket ping间隔（毫秒）', false, true, '25000'),
('websocket.maxConnections', '10000', 'number', 'websocket', '最大WebSocket连接数', false, true, '10000'),
('websocket.enabled', 'true', 'boolean', 'websocket', '是否启用WebSocket', false, true, 'true'),

-- 安全配置
('security.bcryptSaltRounds', '10', 'number', 'security', 'Bcrypt密码加密强度', false, true, '10'),
('security.maxLoginAttempts', '5', 'number', 'security', '最大登录尝试次数', false, true, '5'),
('security.lockoutDuration', '15', 'number', 'security', '账号锁定时长（分钟）', false, true, '15'),
('security.passwordMinLength', '6', 'number', 'security', '密码最小长度', true, true, '6'),
('security.sessionTimeout', '30', 'number', 'security', '会话超时时间（分钟）', false, true, '30'),

-- 数据库连接池配置
('database.pool.max', '10', 'number', 'database', '最大数据库连接数', false, true, '10'),
('database.pool.min', '2', 'number', 'database', '最小数据库连接数', false, true, '2'),
('database.pool.idleTimeout', '30000', 'number', 'database', '连接空闲超时（毫秒）', false, true, '30000'),
('database.pool.connectionTimeout', '5000', 'number', 'database', '连接超时（毫秒）', false, true, '5000'),

-- 审计日志配置
('audit.bodyMaxLength', '1000', 'number', 'audit', '审计日志请求体最大长度', false, true, '1000'),
('audit.enabled', 'true', 'boolean', 'audit', '是否启用审计日志', false, true, 'true'),
('audit.retentionDays', '90', 'number', 'audit', '审计日志保留天数', false, true, '90'),

-- 业务配置
('business.freeTrialLimit', '3', 'number', 'business', '免费试用每日限制', true, true, '3'),
('business.referralReward', '10', 'number', 'business', '推荐奖励金额', true, true, '10'),
('business.minWithdrawAmount', '100', 'number', 'business', '最小提现金额', true, true, '100'),

-- 通知配置
('notification.dailyLimit', '100', 'number', 'notification', '每日通知发送限制', false, true, '100'),
('notification.enabled', 'true', 'boolean', 'notification', '是否启用通知', false, true, 'true'),

-- 邮件配置
('email.dailyLimit', '1000', 'number', 'email', '每日邮件发送限制', false, true, '1000'),
('email.retryAttempts', '3', 'number', 'email', '邮件发送失败重试次数', false, true, '3'),

-- 文件上传配置
('upload.maxFileSize', '5242880', 'number', 'upload', '最大文件上传大小（字节，5MB）', true, true, '5242880'),
('upload.allowedExtensions', '["jpg","jpeg","png","gif","pdf"]', 'json', 'upload', '允许的文件扩展名', true, true, '["jpg","jpeg","png","gif","pdf"]'),

-- 系统维护配置
('system.maintenanceMode', 'false', 'boolean', 'system', '维护模式', true, true, 'false'),
('system.maintenanceMessage', '系统维护中，请稍后访问', 'string', 'system', '维护提示消息', true, true, '系统维护中，请稍后访问');

-- =====================================================
-- 创建视图 - 便于查询
-- =====================================================

-- 按分类查看配置
CREATE OR REPLACE VIEW v_configs_by_category AS
SELECT
  category,
  COUNT(*) as config_count,
  COUNT(CASE WHEN is_editable THEN 1 END) as editable_count,
  COUNT(CASE WHEN is_public THEN 1 END) as public_count
FROM app_configs
GROUP BY category
ORDER BY category;

-- 最近变更的配置
CREATE OR REPLACE VIEW v_recent_config_changes AS
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
ORDER BY h.changed_at DESC
LIMIT 100;

-- =====================================================
-- 创建配置管理函数
-- =====================================================

-- 获取配置值函数
CREATE OR REPLACE FUNCTION get_config(p_key VARCHAR, p_default TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT config_value INTO v_value
  FROM app_configs
  WHERE config_key = p_key;

  RETURN COALESCE(v_value, p_default);
END;
$$ LANGUAGE plpgsql;

-- 设置配置值函数（重命名避免与PostgreSQL内置函数冲突）
CREATE OR REPLACE FUNCTION update_app_config(
  p_key VARCHAR,
  p_value TEXT,
  p_updated_by VARCHAR DEFAULT 'system'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE app_configs
  SET
    config_value = p_value,
    updated_by = p_updated_by,
    updated_at = CURRENT_TIMESTAMP
  WHERE config_key = p_key AND is_editable = true;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 授权（可选）
-- =====================================================

-- 授予配置查询权限给应用用户
-- GRANT SELECT ON app_configs TO fortune_user;
-- GRANT SELECT ON customer_service_configs TO fortune_user;

COMMENT ON FUNCTION get_config IS '获取配置值，如果不存在则返回默认值';
COMMENT ON FUNCTION update_app_config IS '设置配置值，仅更新可编辑的配置';
