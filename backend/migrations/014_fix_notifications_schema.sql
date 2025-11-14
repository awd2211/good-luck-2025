-- 修复 notifications 和 notification_send_logs 表结构
-- 添加缺失的列以支持通知调度功能

-- 1. 添加 sent_at 列到 notifications 表
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
COMMENT ON COLUMN notifications.sent_at IS '实际发送时间';

-- 2. 添加 target_type 和 total_sent 列到 notification_send_logs 表
ALTER TABLE notification_send_logs
  ADD COLUMN IF NOT EXISTS target_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0;

COMMENT ON COLUMN notification_send_logs.target_type IS '目标类型(all/specific_users等)';
COMMENT ON COLUMN notification_send_logs.total_sent IS '实际发送数量';
