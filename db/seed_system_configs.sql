-- 系统配置初始数据
-- 包含所有配置模板的默认值

-- 1. 免费试用配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'free_trial',
  '{"enabled": true, "daily_limit": 3, "services": ["zodiac", "birth_animal"]}'::jsonb,
  'trial',
  '用户免费试用相关配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 2. 会员等级配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'member_levels',
  '{"levels": [{"name": "普通会员", "discount": 1.0, "benefits": []}, {"name": "银卡会员", "discount": 0.95, "benefits": ["优先客服"]}, {"name": "金卡会员", "discount": 0.9, "benefits": ["优先客服", "专属运势"]}, {"name": "钻石会员", "discount": 0.85, "benefits": ["优先客服", "专属运势", "免费算命次数"]}]}'::jsonb,
  'member',
  '会员等级和折扣配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 3. 支付配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'payment_settings',
  '{"enabled_channels": ["wechat", "alipay"], "min_amount": 1, "max_amount": 10000, "currency": "CNY", "wechat": {"app_id": "", "mch_id": "", "notify_url": ""}, "alipay": {"app_id": "", "notify_url": ""}}'::jsonb,
  'payment',
  '支付渠道和参数配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 4. 通知配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'notification_settings',
  '{"email_enabled": true, "sms_enabled": true, "push_enabled": true, "daily_limit": 100}'::jsonb,
  'notification',
  '系统通知相关配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 5. 算命服务定价配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'fortune_pricing',
  '{"base_prices": {"bazi": 29.9, "ziwei": 39.9, "zodiac": 9.9, "tarot": 19.9, "name_test": 19.9, "marriage": 49.9, "career": 39.9}, "vip_discounts": {"silver": 0.95, "gold": 0.9, "diamond": 0.85}}'::jsonb,
  'pricing',
  '各类算命服务的价格设置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 6. 每日运势配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'horoscope_settings',
  '{"auto_generate": true, "generate_time": "00:00", "zodiac_signs": ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"], "categories": ["overall", "love", "career", "wealth", "health"]}'::jsonb,
  'horoscope',
  '每日运势生成和展示配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 7. 优惠券配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'coupon_settings',
  '{"new_user_coupon": {"enabled": true, "discount": 5, "min_amount": 20, "valid_days": 7}, "birthday_coupon": {"enabled": true, "discount": 10, "valid_days": 30}, "festival_coupon": {"enabled": true, "discount": 15, "valid_days": 3}}'::jsonb,
  'coupon',
  '优惠券发放和使用规则',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 8. 内容审核配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'review_settings',
  '{"auto_approve": false, "sensitive_words": ["政治", "暴力", "色情"], "review_timeout": 24, "max_complaint_count": 3}'::jsonb,
  'review',
  '用户反馈和内容审核规则',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 9. AI算命配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'ai_settings',
  '{"enabled": true, "api_key": "", "model": "gpt-3.5-turbo", "max_tokens": 1000, "temperature": 0.7, "timeout": 30}'::jsonb,
  'ai',
  'AI算命服务相关配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 10. 积分系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'points_settings',
  '{"enabled": true, "sign_in_points": 10, "share_points": 20, "order_points_rate": 0.1, "points_to_cash": 100, "min_redeem": 1000}'::jsonb,
  'points',
  '用户积分获取和兑换规则',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 11. 限流配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'rate_limit_settings',
  '{"api_rate_limit": {"per_minute": 60, "per_hour": 1000}, "fortune_rate_limit": {"free_user": {"daily": 3, "monthly": 30}, "vip_user": {"daily": 10, "monthly": 100}}}'::jsonb,
  'rate_limit',
  'API和服务调用频率限制',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 12. 缓存配置
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_by)
VALUES (
  'cache_settings',
  '{"enabled": true, "ttl": {"horoscope": 86400, "fortune_result": 3600, "user_info": 1800}, "redis": {"host": "localhost", "port": 6379, "db": 0}}'::jsonb,
  'cache',
  '数据缓存策略配置',
  'system'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  config_type = EXCLUDED.config_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 查看插入结果
SELECT
  '系统配置创建完成' as message,
  COUNT(*) as total_configs
FROM system_configs;

-- 显示所有配置信息
SELECT
  config_key,
  config_type,
  description,
  created_at
FROM system_configs
ORDER BY config_type, config_key;

-- 按类型统计
SELECT
  config_type,
  COUNT(*) as count
FROM system_configs
GROUP BY config_type
ORDER BY config_type;
