-- 通知系统增强迁移脚本
-- 添加通知模板、用户阅读记录、定时发送等功能

-- ==================== 1. 通知模板表 ====================
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info',
    priority INTEGER DEFAULT 0,
    target VARCHAR(50) DEFAULT 'all',
    variables TEXT,  -- JSON格式存储可用变量，如 ["username", "date"]
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,  -- 是否为系统预设模板
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入预设模板
INSERT INTO notification_templates (name, title, content, type, priority, target, variables, description, is_system) VALUES
('system_maintenance', '系统维护通知', '尊敬的{username}，我们将于{start_time}至{end_time}进行系统维护，届时服务将暂时中断。感谢您的理解与支持！', 'warning', 2, 'all', '["username", "start_time", "end_time"]', '系统维护通知模板', TRUE),
('new_feature', '新功能上线', '亲爱的{username}，我们上线了全新的{feature_name}功能，快来体验吧！', 'success', 1, 'all', '["username", "feature_name"]', '新功能发布通知', TRUE),
('security_alert', '安全提醒', '{username}您好，检测到您的账号在{time}发生了{action}，如非本人操作请及时联系客服。', 'error', 2, 'all', '["username", "time", "action"]', '账号安全提醒', TRUE),
('promotion', '优惠活动', '{username}，精彩活动来袭！{activity_name}，优惠力度：{discount}，活动时间：{period}', 'info', 1, 'all', '["username", "activity_name", "discount", "period"]', '促销活动通知', TRUE),
('order_status', '订单状态更新', '{username}，您的订单{order_id}状态已更新为：{status}', 'info', 0, 'all', '["username", "order_id", "status"]', '订单状态通知', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ==================== 2. 增强通知表 ====================
-- 添加新字段到现有 notifications 表
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP;  -- 定时发送时间
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;  -- 是否定时发送
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES notification_templates(id) ON DELETE SET NULL;  -- 关联模板
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_count INTEGER DEFAULT 0;  -- 已读人数
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0;  -- 总发送人数
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;  -- 点击次数

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(is_scheduled, scheduled_time) WHERE is_scheduled = TRUE;
CREATE INDEX IF NOT EXISTS idx_notifications_status_dates ON notifications(status, start_date, end_date);

-- ==================== 3. 用户通知阅读记录表 ====================
CREATE TABLE IF NOT EXISTS user_notification_reads (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_notif_reads_user ON user_notification_reads(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notif_reads_notif ON user_notification_reads(notification_id);

-- ==================== 4. 通知发送日志表 ====================
CREATE TABLE IF NOT EXISTS notification_send_logs (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id VARCHAR(50),
    send_channel VARCHAR(20) NOT NULL,  -- 'web', 'sms', 'email'
    status VARCHAR(20) NOT NULL,  -- 'success', 'failed', 'pending'
    error_message TEXT,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notif_send_logs_notif ON notification_send_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_send_logs_user ON notification_send_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_send_logs_status ON notification_send_logs(status, sent_at);

-- ==================== 5. 触发器 ====================
-- 通知模板更新时间触发器
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 6. 视图：通知统计 ====================
CREATE OR REPLACE VIEW notification_stats AS
SELECT
    n.id,
    n.title,
    n.type,
    n.status,
    n.created_at,
    COALESCE(n.read_count, 0) as read_count,
    COALESCE(n.total_sent, 0) as total_sent,
    COALESCE(n.click_count, 0) as click_count,
    CASE
        WHEN n.total_sent > 0 THEN ROUND((n.read_count::numeric / n.total_sent::numeric) * 100, 2)
        ELSE 0
    END as read_rate,
    CASE
        WHEN n.read_count > 0 THEN ROUND((n.click_count::numeric / n.read_count::numeric) * 100, 2)
        ELSE 0
    END as click_rate
FROM notifications n;

-- ==================== 完成 ====================
SELECT 'Notification system enhancement migration completed!' as status;
