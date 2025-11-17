-- 客服系统功能增强 - 数据库迁移脚本
-- 包含: 快捷回复模板、满意度评价、会话质检、绩效统计等功能

-- =====================================================
-- 1. 快捷回复模板表 (Quick Reply Templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_reply_templates (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE CASCADE,  -- NULL表示公共模板
  category VARCHAR(50) NOT NULL DEFAULT 'general',  -- 分类: general, greeting, product, after_sales, closing
  title VARCHAR(100) NOT NULL,  -- 模板标题
  content TEXT NOT NULL,  -- 回复内容
  shortcut_key VARCHAR(20),  -- 快捷键(如 /greeting)
  use_count INTEGER DEFAULT 0,  -- 使用次数统计
  is_active BOOLEAN DEFAULT true,  -- 是否启用
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quick_reply_agent ON quick_reply_templates(agent_id);
CREATE INDEX IF NOT EXISTS idx_quick_reply_category ON quick_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_quick_reply_shortcut ON quick_reply_templates(shortcut_key);

COMMENT ON TABLE quick_reply_templates IS '快捷回复模板表';
COMMENT ON COLUMN quick_reply_templates.agent_id IS '客服ID,NULL表示公共模板';
COMMENT ON COLUMN quick_reply_templates.shortcut_key IS '快捷键,如/greeting自动替换';

-- =====================================================
-- 2. 客户满意度评价表 (Customer Satisfaction Ratings)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_satisfaction_ratings (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),  -- 1-5星评分
  comment TEXT,  -- 文字评价
  tags TEXT[],  -- 评价标签(如['专业','耐心','响应快'])
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_session ON chat_satisfaction_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_agent ON chat_satisfaction_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_rating ON chat_satisfaction_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created ON chat_satisfaction_ratings(created_at);

COMMENT ON TABLE chat_satisfaction_ratings IS '客户满意度评价表';
COMMENT ON COLUMN chat_satisfaction_ratings.rating IS '评分1-5星';
COMMENT ON COLUMN chat_satisfaction_ratings.tags IS '评价标签数组';

-- =====================================================
-- 3. 会话质检评分表 (Quality Inspection)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_quality_inspections (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  inspector_id VARCHAR(255) NOT NULL,  -- 质检员ID
  agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),  -- 总分0-100
  response_speed_score INTEGER CHECK (response_speed_score BETWEEN 0 AND 20),  -- 响应速度20分
  service_attitude_score INTEGER CHECK (service_attitude_score BETWEEN 0 AND 30),  -- 服务态度30分
  problem_solving_score INTEGER CHECK (problem_solving_score BETWEEN 0 AND 30),  -- 问题解决30分
  professionalism_score INTEGER CHECK (professionalism_score BETWEEN 0 AND 20),  -- 专业程度20分
  comments TEXT,  -- 质检评语
  issues TEXT[],  -- 发现的问题列表
  suggestions TEXT,  -- 改进建议
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_session ON chat_quality_inspections(session_id);
CREATE INDEX IF NOT EXISTS idx_quality_agent ON chat_quality_inspections(agent_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspector ON chat_quality_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_quality_score ON chat_quality_inspections(overall_score);

COMMENT ON TABLE chat_quality_inspections IS '会话质检评分表';
COMMENT ON COLUMN chat_quality_inspections.overall_score IS '总分=响应速度+服务态度+问题解决+专业程度';

-- =====================================================
-- 4. 客服绩效统计表 (Agent Performance Stats)
-- =====================================================
CREATE TABLE IF NOT EXISTS cs_performance_daily_stats (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,

  -- 接待数据
  total_sessions INTEGER DEFAULT 0,  -- 总接待量
  completed_sessions INTEGER DEFAULT 0,  -- 已完成会话数
  transferred_out INTEGER DEFAULT 0,  -- 转出会话数
  transferred_in INTEGER DEFAULT 0,  -- 转入会话数

  -- 时间数据
  online_duration INTEGER DEFAULT 0,  -- 在线时长(秒)
  avg_response_time INTEGER DEFAULT 0,  -- 平均响应时间(秒)
  avg_session_duration INTEGER DEFAULT 0,  -- 平均会话时长(秒)

  -- 质量数据
  avg_satisfaction_rating DECIMAL(3,2),  -- 平均满意度(1-5)
  satisfaction_count INTEGER DEFAULT 0,  -- 收到评价数
  five_star_count INTEGER DEFAULT 0,  -- 五星评价数
  one_star_count INTEGER DEFAULT 0,  -- 一星评价数
  avg_quality_score DECIMAL(5,2),  -- 平均质检分数(0-100)
  quality_inspection_count INTEGER DEFAULT 0,  -- 质检次数

  -- 消息数据
  total_messages_sent INTEGER DEFAULT 0,  -- 发送消息数
  total_messages_received INTEGER DEFAULT 0,  -- 接收消息数
  quick_reply_usage INTEGER DEFAULT 0,  -- 快捷回复使用次数

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(agent_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_performance_agent ON cs_performance_daily_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON cs_performance_daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_performance_rating ON cs_performance_daily_stats(avg_satisfaction_rating);

COMMENT ON TABLE cs_performance_daily_stats IS '客服每日绩效统计表';
COMMENT ON COLUMN cs_performance_daily_stats.avg_satisfaction_rating IS '平均满意度1-5星';

-- =====================================================
-- 5. 扩展 chat_sessions 表 (添加新字段)
-- =====================================================
-- 添加满意度评价相关字段
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER,
  ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT,
  ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP;

-- 添加质检相关字段
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS inspector_id VARCHAR(255);

-- 添加会话标签和备注
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 添加首次响应时间
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS first_response_time INTEGER;  -- 首次响应时间(秒)

COMMENT ON COLUMN chat_sessions.satisfaction_rating IS '客户满意度评分1-5';
COMMENT ON COLUMN chat_sessions.quality_score IS '质检评分0-100';
COMMENT ON COLUMN chat_sessions.first_response_time IS '首次响应时间(秒)';

-- =====================================================
-- 6. 客户标签表 (Customer Tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_tags (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  tag_name VARCHAR(50) NOT NULL,  -- VIP, 投诉, 潜在客户, 黑名单等
  tag_type VARCHAR(20) DEFAULT 'custom',  -- system(系统), custom(自定义)
  color VARCHAR(20),  -- 标签颜色
  created_by VARCHAR(255),  -- 创建人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_user ON customer_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_name ON customer_tags(tag_name);

COMMENT ON TABLE customer_tags IS '客户标签表';

-- =====================================================
-- 7. 客户备注表 (Customer Notes)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_notes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,  -- 是否重要
  created_by VARCHAR(255) NOT NULL,  -- 创建人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_user ON customer_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_important ON customer_notes(is_important);

COMMENT ON TABLE customer_notes IS '客户备注表';

-- =====================================================
-- 8. 敏感词库表 (Sensitive Words)
-- =====================================================
CREATE TABLE IF NOT EXISTS sensitive_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),  -- 分类: 违禁词, 广告, 辱骂等
  severity VARCHAR(20) DEFAULT 'medium',  -- low, medium, high
  action VARCHAR(20) DEFAULT 'alert',  -- alert(警告), block(拦截)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensitive_word ON sensitive_words(word);
CREATE INDEX IF NOT EXISTS idx_sensitive_category ON sensitive_words(category);

COMMENT ON TABLE sensitive_words IS '敏感词库表';

-- =====================================================
-- 9. 敏感词检测记录表 (Sensitive Word Detection Logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS sensitive_word_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_id INTEGER,  -- 关联chat_messages表
  sender_type VARCHAR(20) NOT NULL,  -- user, agent
  sender_id VARCHAR(255) NOT NULL,
  detected_words TEXT[] NOT NULL,  -- 检测到的敏感词
  original_content TEXT,  -- 原始内容
  action_taken VARCHAR(20),  -- alerted, blocked
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensitive_log_session ON sensitive_word_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_log_sender ON sensitive_word_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_log_created ON sensitive_word_logs(created_at);

COMMENT ON TABLE sensitive_word_logs IS '敏感词检测记录表';

-- =====================================================
-- 10. 会话转接记录表 (Session Transfer Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_session_transfers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  from_agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
  to_agent_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
  transfer_reason TEXT,  -- 转接原因
  transfer_notes TEXT,  -- 转接备注
  transfer_type VARCHAR(20) DEFAULT 'manual',  -- manual(手动), auto(自动)
  accepted_at TIMESTAMP,  -- 接受时间
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_session ON chat_session_transfers(session_id);
CREATE INDEX IF NOT EXISTS idx_transfer_from ON chat_session_transfers(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_transfer_to ON chat_session_transfers(to_agent_id);

COMMENT ON TABLE chat_session_transfers IS '会话转接记录表';

-- =====================================================
-- 11. AI机器人配置表 (AI Bot Configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_bot_configs (
  id SERIAL PRIMARY KEY,
  bot_name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,  -- openai, anthropic, deepseek等
  model_name VARCHAR(100) NOT NULL,  -- gpt-4, claude-3-sonnet等
  api_endpoint TEXT,
  api_key_encrypted TEXT,  -- 加密存储
  system_prompt TEXT,  -- 系统提示词
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,  -- 优先级,数字越大优先级越高
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_bot_configs IS 'AI机器人配置表';

-- =====================================================
-- 12. AI对话记录表 (AI Conversation Logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_conversation_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  bot_config_id INTEGER REFERENCES ai_bot_configs(id) ON DELETE SET NULL,
  model_used VARCHAR(100),
  tokens_used INTEGER,
  response_time INTEGER,  -- 响应时间(毫秒)
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_log_session ON ai_conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_created ON ai_conversation_logs(created_at);

COMMENT ON TABLE ai_conversation_logs IS 'AI对话记录表';

-- =====================================================
-- 13. 插入默认数据
-- =====================================================

-- 插入公共快捷回复模板
INSERT INTO quick_reply_templates (agent_id, category, title, content, shortcut_key)
VALUES
  (NULL, 'greeting', '问候语-早上好', '您好!很高兴为您服务,请问有什么可以帮助您的吗?', '/morning'),
  (NULL, 'greeting', '问候语-晚上好', '晚上好!我是客服,请问有什么可以帮到您?', '/evening'),
  (NULL, 'product', '产品介绍-生肖运势', '生肖运势服务可以根据您的出生年份,分析您的性格特点和2025年运势走向。价格为19.9元。', '/zodiac'),
  (NULL, 'product', '产品介绍-八字精批', '八字精批需要您提供准确的出生年月日时,我们的大师会进行详细分析。价格为49.9元,约3000字报告。', '/bazi'),
  (NULL, 'after_sales', '查询订单', '请稍等,我帮您查询一下订单状态...', '/order'),
  (NULL, 'after_sales', '退款说明', '如需退款,请提供订单号,我们会在3个工作日内处理。退款将原路返回您的支付账户。', '/refund'),
  (NULL, 'closing', '结束-感谢', '感谢您的咨询,祝您生活愉快!如有其他问题,随时欢迎联系我们。', '/thanks'),
  (NULL, 'closing', '结束-等待', '好的,那您先考虑一下,有需要随时联系我哦!', '/wait')
ON CONFLICT DO NOTHING;

-- 插入系统敏感词
INSERT INTO sensitive_words (word, category, severity, action)
VALUES
  ('fuck', '辱骂', 'high', 'block'),
  ('shit', '辱骂', 'high', 'block'),
  ('傻逼', '辱骂', 'high', 'block'),
  ('骗子', '投诉', 'medium', 'alert'),
  ('诈骗', '投诉', 'high', 'alert'),
  ('退款', '敏感操作', 'low', 'alert'),
  ('投诉', '敏感操作', 'medium', 'alert')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 14. 创建更新触发器
-- =====================================================

-- quick_reply_templates 更新触发器
CREATE OR REPLACE FUNCTION update_quick_reply_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quick_reply_updated_at
  BEFORE UPDATE ON quick_reply_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_reply_updated_at();

-- cs_performance_daily_stats 更新触发器
CREATE TRIGGER trigger_performance_updated_at
  BEFORE UPDATE ON cs_performance_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_reply_updated_at();

-- chat_quality_inspections 更新触发器
CREATE TRIGGER trigger_quality_updated_at
  BEFORE UPDATE ON chat_quality_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_reply_updated_at();

-- =====================================================
-- 完成
-- =====================================================

SELECT 'Customer Service Enhancements Migration Completed!' AS status;
