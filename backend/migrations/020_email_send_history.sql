-- 邮件发送历史记录表
CREATE TABLE IF NOT EXISTS email_send_history (
  id SERIAL PRIMARY KEY,
  scenario_key VARCHAR(100) NOT NULL,              -- 场景标识
  scenario_name VARCHAR(200) NOT NULL,             -- 场景名称
  recipient_email VARCHAR(255) NOT NULL,           -- 收件人邮箱
  subject VARCHAR(500) NOT NULL,                   -- 邮件主题
  content TEXT,                                    -- 邮件内容(HTML)
  status VARCHAR(20) NOT NULL,                     -- 发送状态: success/failed
  message_id VARCHAR(255),                         -- 邮件服务商返回的消息ID
  error_message TEXT,                              -- 错误信息(如果失败)
  provider VARCHAR(50),                            -- 邮件服务商: mailgun/sendgrid/ses/smtp
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 发送时间
  user_id VARCHAR(100),                            -- 关联的用户ID(如果有)
  metadata JSONB DEFAULT '{}'                      -- 额外的元数据
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_email_send_history_scenario ON email_send_history(scenario_key);
CREATE INDEX IF NOT EXISTS idx_email_send_history_recipient ON email_send_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_send_history_status ON email_send_history(status);
CREATE INDEX IF NOT EXISTS idx_email_send_history_sent_at ON email_send_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_history_user_id ON email_send_history(user_id) WHERE user_id IS NOT NULL;

-- 创建组合索引用于常见查询场景
CREATE INDEX IF NOT EXISTS idx_email_send_history_scenario_status_time
  ON email_send_history(scenario_key, status, sent_at DESC);

COMMENT ON TABLE email_send_history IS '邮件发送历史记录表';
COMMENT ON COLUMN email_send_history.scenario_key IS '邮件场景唯一标识';
COMMENT ON COLUMN email_send_history.scenario_name IS '邮件场景中文名称';
COMMENT ON COLUMN email_send_history.recipient_email IS '收件人邮箱地址';
COMMENT ON COLUMN email_send_history.subject IS '邮件主题';
COMMENT ON COLUMN email_send_history.content IS '邮件HTML内容';
COMMENT ON COLUMN email_send_history.status IS '发送状态: success=成功, failed=失败';
COMMENT ON COLUMN email_send_history.message_id IS '邮件服务商返回的唯一消息ID';
COMMENT ON COLUMN email_send_history.error_message IS '发送失败时的错误信息';
COMMENT ON COLUMN email_send_history.provider IS '使用的邮件服务商';
COMMENT ON COLUMN email_send_history.user_id IS '关联的用户ID，用于用户维度的查询';
COMMENT ON COLUMN email_send_history.metadata IS '额外的元数据，如模板变量、发送参数等';
