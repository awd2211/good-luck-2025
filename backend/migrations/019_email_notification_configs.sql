-- 邮件通知配置表
CREATE TABLE IF NOT EXISTS email_notification_configs (
  id SERIAL PRIMARY KEY,
  scenario_key VARCHAR(100) UNIQUE NOT NULL,  -- 场景唯一标识
  scenario_name VARCHAR(200) NOT NULL,        -- 场景中文名称
  scenario_category VARCHAR(50) NOT NULL,     -- 场景分类
  is_enabled BOOLEAN DEFAULT true,            -- 是否启用
  config_data JSONB DEFAULT '{}',             -- 配置数据（cron表达式、提前天数等）
  description TEXT,                           -- 场景描述
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_notification_configs_enabled
  ON email_notification_configs(is_enabled);
CREATE INDEX IF NOT EXISTS idx_email_notification_configs_category
  ON email_notification_configs(scenario_category);

-- 插入默认配置
INSERT INTO email_notification_configs (scenario_key, scenario_name, scenario_category, is_enabled, config_data, description) VALUES
-- 认证与安全
('verification_code', '邮箱验证码', 'authentication', true, '{}', '用户注册、登录、重置密码时发送验证码'),
('welcome_email', '欢迎邮件', 'authentication', true, '{}', '新用户注册成功后发送欢迎邮件'),
('password_changed', '密码修改通知', 'authentication', true, '{}', '用户密码修改成功后发送通知'),
('account_status_changed', '账号状态变更', 'authentication', true, '{}', '账号被激活、封禁或停用时通知用户'),

-- 订单与支付
('order_confirmation', '订单确认邮件', 'order', true, '{}', '用户下单后发送订单确认邮件'),
('payment_success', '支付成功通知', 'order', true, '{}', '支付成功后发送确认邮件'),
('order_cancelled', '订单取消通知', 'order', true, '{}', '订单取消或退款时通知用户'),
('order_status_updated', '订单状态更新', 'order', true, '{}', '订单状态变化时通知用户'),

-- 算命服务
('fortune_result_ready', '算命结果就绪', 'fortune', true, '{}', '算命结果生成后通知用户查看'),

-- 优惠券
('coupon_granted', '优惠券领取成功', 'coupon', true, '{}', '用户成功领取优惠券后发送确认'),

-- 定时任务
('daily_horoscope', '每日星座运势', 'scheduled', true, '{"cron": "0 8 * * *", "description": "每天早上8点"}', '每日推送星座运势'),
('service_expiry_reminder', '服务到期提醒', 'scheduled', true, '{"cron": "0 1 * * *", "days_before": 3, "description": "每天凌晨1点检查"}', '服务到期前3天提醒'),
('coupon_expiry_reminder', '优惠券到期提醒', 'scheduled', true, '{"cron": "0 2 * * *", "days_before": 3, "description": "每天凌晨2点检查"}', '优惠券到期前3天提醒'),
('birthday_greeting', '生日祝福', 'scheduled', true, '{"cron": "0 0 * * *", "description": "每天凌晨0点检查"}', '在用户生日当天发送祝福'),
('weekly_report', '周报推送', 'scheduled', true, '{"cron": "0 9 * * 1", "description": "每周一早上9点"}', '每周发送运势周报'),
('monthly_report', '月报推送', 'scheduled', true, '{"cron": "0 9 1 * *", "description": "每月1号早上9点"}', '每月发送运势月报')

ON CONFLICT (scenario_key) DO NOTHING;

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_email_notification_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_notification_configs_updated_at
  ON email_notification_configs;
CREATE TRIGGER trigger_update_email_notification_configs_updated_at
  BEFORE UPDATE ON email_notification_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notification_configs_updated_at();

COMMENT ON TABLE email_notification_configs IS '邮件通知配置表';
COMMENT ON COLUMN email_notification_configs.scenario_key IS '场景唯一标识符';
COMMENT ON COLUMN email_notification_configs.scenario_name IS '场景中文名称';
COMMENT ON COLUMN email_notification_configs.scenario_category IS '场景分类：authentication/order/fortune/coupon/scheduled';
COMMENT ON COLUMN email_notification_configs.is_enabled IS '是否启用该邮件通知';
COMMENT ON COLUMN email_notification_configs.config_data IS '配置数据JSON：cron表达式、提前天数等';
