-- ==========================================
-- WebChat客服系统数据库迁移脚本
-- 创建时间: 2025-01-14
-- 方案: WebSocket实时通信方案
-- ==========================================

BEGIN;

-- ==========================================
-- 1. 客服人员表
-- ==========================================
CREATE TABLE IF NOT EXISTS customer_service_agents (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL UNIQUE REFERENCES admins(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK (role IN ('manager', 'agent')),
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline')),
    max_concurrent_chats INTEGER DEFAULT 5 CHECK (max_concurrent_chats > 0),
    current_chat_count INTEGER DEFAULT 0 CHECK (current_chat_count >= 0),
    specialty_tags TEXT[],
    manager_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_online_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cs_agents_status ON customer_service_agents(status);
CREATE INDEX IF NOT EXISTS idx_cs_agents_manager ON customer_service_agents(manager_id);
CREATE INDEX IF NOT EXISTS idx_cs_agents_active ON customer_service_agents(is_active);

-- 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_cs_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cs_agents_updated_at_trigger
BEFORE UPDATE ON customer_service_agents
FOR EACH ROW
EXECUTE FUNCTION update_cs_agents_updated_at();

COMMENT ON TABLE customer_service_agents IS '客服人员表';
COMMENT ON COLUMN customer_service_agents.admin_id IS '关联的管理员账号ID';
COMMENT ON COLUMN customer_service_agents.display_name IS '客服显示名称';
COMMENT ON COLUMN customer_service_agents.role IS '客服角色: manager(经理) | agent(普通客服)';
COMMENT ON COLUMN customer_service_agents.status IS '在线状态: online(在线) | busy(忙碌) | offline(离线)';
COMMENT ON COLUMN customer_service_agents.max_concurrent_chats IS '最大同时接待数量';
COMMENT ON COLUMN customer_service_agents.current_chat_count IS '当前接待数量';
COMMENT ON COLUMN customer_service_agents.specialty_tags IS '专长标签';
COMMENT ON COLUMN customer_service_agents.manager_id IS '所属经理ID (NULL表示是经理)';

-- ==========================================
-- 2. 聊天会话表
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
    session_key VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'active', 'closed', 'transferred')),
    channel VARCHAR(20) DEFAULT 'web' CHECK (channel IN ('web', 'mobile', 'app')),
    priority INTEGER DEFAULT 0,
    queued_at TIMESTAMP,
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    closed_at TIMESTAMP,
    close_reason VARCHAR(50) CHECK (close_reason IN ('user_left', 'agent_closed', 'timeout', 'resolved', 'transferred')),
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_queued ON chat_sessions(queued_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created ON chat_sessions(created_at);

-- 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_sessions_updated_at_trigger
BEFORE UPDATE ON chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_chat_sessions_updated_at();

COMMENT ON TABLE chat_sessions IS '聊天会话表';
COMMENT ON COLUMN chat_sessions.session_key IS '会话唯一标识(UUID)';
COMMENT ON COLUMN chat_sessions.status IS '会话状态: pending(待分配) | queued(队列中) | active(进行中) | closed(已结束) | transferred(已转接)';
COMMENT ON COLUMN chat_sessions.priority IS '优先级(VIP用户可设置更高)';

-- ==========================================
-- 3. 聊天消息表
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
    sender_id VARCHAR(50),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'link', 'quick_reply', 'system')),
    attachments JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(session_id, is_read) WHERE is_read = false;

COMMENT ON TABLE chat_messages IS '聊天消息表';
COMMENT ON COLUMN chat_messages.sender_type IS '发送者类型: user(用户) | agent(客服) | system(系统)';
COMMENT ON COLUMN chat_messages.message_type IS '消息类型: text(文本) | image(图片) | file(文件) | link(链接) | quick_reply(快捷回复) | system(系统消息)';
COMMENT ON COLUMN chat_messages.attachments IS '附件信息 [{url, name, size, type}]';

-- ==========================================
-- 4. 快捷回复模板表
-- ==========================================
CREATE TABLE IF NOT EXISTS quick_reply_templates (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    shortcut_key VARCHAR(20),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_quick_reply_agent ON quick_reply_templates(agent_id);
CREATE INDEX IF NOT EXISTS idx_quick_reply_category ON quick_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_quick_reply_active ON quick_reply_templates(is_active) WHERE is_active = true;

-- 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_quick_reply_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quick_reply_updated_at_trigger
BEFORE UPDATE ON quick_reply_templates
FOR EACH ROW
EXECUTE FUNCTION update_quick_reply_updated_at();

COMMENT ON TABLE quick_reply_templates IS '快捷回复模板表';
COMMENT ON COLUMN quick_reply_templates.agent_id IS '客服ID (NULL表示全局模板)';
COMMENT ON COLUMN quick_reply_templates.category IS '模板分类: 问候语 | 常见问题 | 结束语';
COMMENT ON COLUMN quick_reply_templates.shortcut_key IS '快捷键 如 /hello';

-- ==========================================
-- 5. 客服工作统计表
-- ==========================================
CREATE TABLE IF NOT EXISTS cs_agent_statistics (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,
    avg_session_duration_seconds INTEGER,
    avg_satisfaction_rating DECIMAL(3,2),
    total_messages_sent INTEGER DEFAULT 0,
    online_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, stat_date)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cs_stats_agent ON cs_agent_statistics(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_stats_date ON cs_agent_statistics(stat_date);

-- 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_cs_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cs_stats_updated_at_trigger
BEFORE UPDATE ON cs_agent_statistics
FOR EACH ROW
EXECUTE FUNCTION update_cs_stats_updated_at();

COMMENT ON TABLE cs_agent_statistics IS '客服工作统计表(按日统计)';
COMMENT ON COLUMN cs_agent_statistics.total_sessions IS '总会话数';
COMMENT ON COLUMN cs_agent_statistics.avg_response_time_seconds IS '平均响应时间(秒)';
COMMENT ON COLUMN cs_agent_statistics.avg_session_duration_seconds IS '平均会话时长(秒)';
COMMENT ON COLUMN cs_agent_statistics.avg_satisfaction_rating IS '平均满意度评分';

-- ==========================================
-- 6. 会话转接记录表
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_transfer_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    from_agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
    to_agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
    transfer_reason TEXT,
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_transfer_logs_session ON chat_transfer_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_from ON chat_transfer_logs(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_to ON chat_transfer_logs(to_agent_id);

COMMENT ON TABLE chat_transfer_logs IS '会话转接记录表';

-- ==========================================
-- 7. 插入默认的全局快捷回复模板
-- ==========================================
INSERT INTO quick_reply_templates (agent_id, category, title, content, shortcut_key) VALUES
(NULL, '问候语', '初次问候', '您好！我是客服{name}，很高兴为您服务，请问有什么可以帮助您的吗？', '/hello'),
(NULL, '问候语', '再次问候', '欢迎回来！我看到您之前咨询过{topic}，还有什么需要帮助的吗？', '/welcome'),
(NULL, '常见问题', '等待回复', '好的，我正在为您查询，请稍等片刻...', '/wait'),
(NULL, '常见问题', '转接专家', '您的问题比较专业，我帮您转接到专业客服，请稍候...', '/transfer'),
(NULL, '常见问题', '查看订单', '我看到您有疑问，请提供您的订单号，我帮您查询一下。', '/order'),
(NULL, '结束语', '问题已解决', '很高兴能帮到您！如果还有其他问题，随时欢迎咨询。祝您生活愉快！', '/bye'),
(NULL, '结束语', '满意度调查', '感谢您的咨询！本次服务结束后，希望您能给予评价，您的反馈对我们很重要。', '/rating')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. 更新admins表，添加客服相关角色
-- ==========================================
-- 注意：如果您的admins表role字段已经是足够长的VARCHAR，则无需此步骤
-- 新增角色: cs_manager (客服经理), cs_agent (客服)

COMMENT ON COLUMN admins.role IS '角色: super_admin | admin | manager | operator | viewer | cs_manager | cs_agent';

COMMIT;

-- ==========================================
-- 验证迁移
-- ==========================================
SELECT 'WebChat系统表创建完成' as status;

-- 显示所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%chat%'
   OR table_name LIKE '%cs_%'
   OR table_name = 'quick_reply_templates'
ORDER BY table_name;

-- 显示表统计
SELECT
    'customer_service_agents' as table_name,
    COUNT(*) as row_count
FROM customer_service_agents
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'quick_reply_templates', COUNT(*) FROM quick_reply_templates
UNION ALL
SELECT 'cs_agent_statistics', COUNT(*) FROM cs_agent_statistics
UNION ALL
SELECT 'chat_transfer_logs', COUNT(*) FROM chat_transfer_logs;
