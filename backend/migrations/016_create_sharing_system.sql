-- ========================================
-- 分享系统数据库表
-- ========================================

-- 1. 分享配置表
CREATE TABLE IF NOT EXISTS share_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_name VARCHAR(200) NOT NULL,
  platform VARCHAR(50) NOT NULL,  -- facebook, twitter, whatsapp, telegram, etc.
  enabled BOOLEAN DEFAULT true,
  share_text_template TEXT,  -- 分享文案模板
  share_url_template TEXT,   -- 分享URL模板
  og_title_template TEXT,    -- Open Graph标题模板
  og_description_template TEXT,  -- Open Graph描述模板
  og_image_url TEXT,         -- Open Graph图片URL
  settings JSONB,            -- 平台特定配置
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 分享链接表（核心表）
CREATE TABLE IF NOT EXISTS share_links (
  id SERIAL PRIMARY KEY,
  share_code VARCHAR(50) NOT NULL UNIQUE,  -- 唯一分享码
  user_id VARCHAR(100) NOT NULL,           -- 分享者ID
  share_type VARCHAR(50) NOT NULL,         -- 分享类型: result, invite, coupon, service
  content_id VARCHAR(100),                 -- 关联内容ID（订单ID、优惠券ID等）
  content_type VARCHAR(50),                -- 内容类型
  share_url TEXT NOT NULL,                 -- 完整分享链接
  short_url VARCHAR(200),                  -- 短链接
  qr_code_url TEXT,                        -- 二维码URL

  -- 分享内容数据
  title VARCHAR(500),
  description TEXT,
  image_url TEXT,
  metadata JSONB,                          -- 额外元数据

  -- A/B测试
  ab_test_group VARCHAR(50),               -- A/B测试分组

  -- 统计数据（缓存）
  share_count INT DEFAULT 0,               -- 分享次数
  click_count INT DEFAULT 0,               -- 点击次数
  view_count INT DEFAULT 0,                -- 查看次数
  conversion_count INT DEFAULT 0,          -- 转化次数

  -- 状态
  status VARCHAR(20) DEFAULT 'active',     -- active, expired, disabled
  expires_at TIMESTAMP,                    -- 过期时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_links_user ON share_links(user_id);
CREATE INDEX idx_share_links_code ON share_links(share_code);
CREATE INDEX idx_share_links_type ON share_links(share_type);
CREATE INDEX idx_share_links_created ON share_links(created_at);

-- 3. 分享事件表（记录每次分享操作）
CREATE TABLE IF NOT EXISTS share_events (
  id SERIAL PRIMARY KEY,
  share_link_id INT NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,           -- 分享者ID
  platform VARCHAR(50) NOT NULL,           -- 分享平台
  share_channel VARCHAR(50),               -- 具体分享渠道

  -- 设备信息
  device_type VARCHAR(50),                 -- mobile, desktop, tablet
  browser VARCHAR(100),
  os VARCHAR(100),

  -- 地理位置
  country VARCHAR(100),
  city VARCHAR(100),
  ip_address VARCHAR(50),

  share_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_events_link ON share_events(share_link_id);
CREATE INDEX idx_share_events_user ON share_events(user_id);
CREATE INDEX idx_share_events_platform ON share_events(platform);
CREATE INDEX idx_share_events_time ON share_events(share_time);

-- 4. 分享点击表（记录每次点击）
CREATE TABLE IF NOT EXISTS share_clicks (
  id SERIAL PRIMARY KEY,
  share_link_id INT NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  share_code VARCHAR(50) NOT NULL,

  -- 访问者信息
  visitor_id VARCHAR(100),                 -- 访客唯一ID（cookie/fingerprint）
  user_id VARCHAR(100),                    -- 如果已登录
  is_new_user BOOLEAN DEFAULT true,        -- 是否新用户

  -- 来源信息
  referrer TEXT,                           -- 来源页面
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- 设备信息
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(50),

  -- 地理位置
  country VARCHAR(100),
  city VARCHAR(100),
  ip_address VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- 行为追踪
  session_id VARCHAR(100),
  page_views INT DEFAULT 1,
  time_on_site INT,                        -- 停留时间（秒）

  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_clicks_link ON share_clicks(share_link_id);
CREATE INDEX idx_share_clicks_code ON share_clicks(share_code);
CREATE INDEX idx_share_clicks_visitor ON share_clicks(visitor_id);
CREATE INDEX idx_share_clicks_time ON share_clicks(clicked_at);
CREATE INDEX idx_share_clicks_country ON share_clicks(country);

-- 5. 分享转化表（记录转化结果）
CREATE TABLE IF NOT EXISTS share_conversions (
  id SERIAL PRIMARY KEY,
  share_link_id INT NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  share_code VARCHAR(50) NOT NULL,
  click_id INT REFERENCES share_clicks(id),

  -- 转化用户
  converted_user_id VARCHAR(100) NOT NULL,  -- 转化用户ID
  sharer_user_id VARCHAR(100) NOT NULL,     -- 分享者ID

  -- 转化类型
  conversion_type VARCHAR(50) NOT NULL,     -- register, order, payment, etc.
  conversion_value DECIMAL(10, 2),          -- 转化价值

  -- 关联数据
  order_id VARCHAR(100),
  amount DECIMAL(10, 2),

  -- 转化路径
  conversion_path JSONB,                    -- 转化路径记录
  time_to_conversion INT,                   -- 从点击到转化的时间（秒）

  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_conversions_link ON share_conversions(share_link_id);
CREATE INDEX idx_share_conversions_sharer ON share_conversions(sharer_user_id);
CREATE INDEX idx_share_conversions_converted ON share_conversions(converted_user_id);
CREATE INDEX idx_share_conversions_type ON share_conversions(conversion_type);
CREATE INDEX idx_share_conversions_time ON share_conversions(converted_at);

-- 6. 分享奖励表
CREATE TABLE IF NOT EXISTS share_rewards (
  id SERIAL PRIMARY KEY,
  share_link_id INT REFERENCES share_links(id) ON DELETE SET NULL,
  conversion_id INT REFERENCES share_conversions(id) ON DELETE SET NULL,

  -- 奖励对象
  user_id VARCHAR(100) NOT NULL,           -- 获奖用户ID
  reward_type VARCHAR(50) NOT NULL,        -- points, cash, coupon, unlock

  -- 奖励内容
  reward_amount DECIMAL(10, 2),            -- 奖励金额/积分
  coupon_id INT,                           -- 优惠券ID
  coupon_code VARCHAR(100),
  unlock_content TEXT,                     -- 解锁的内容

  -- 奖励来源
  source_type VARCHAR(50),                 -- share, invite, conversion
  source_id VARCHAR(100),

  -- 状态
  status VARCHAR(20) DEFAULT 'pending',    -- pending, issued, claimed, expired
  issued_at TIMESTAMP,
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_rewards_user ON share_rewards(user_id);
CREATE INDEX idx_share_rewards_status ON share_rewards(status);
CREATE INDEX idx_share_rewards_type ON share_rewards(reward_type);

-- 7. 邀请记录表
CREATE TABLE IF NOT EXISTS invite_records (
  id SERIAL PRIMARY KEY,
  invite_code VARCHAR(50) NOT NULL UNIQUE,
  inviter_user_id VARCHAR(100) NOT NULL,   -- 邀请人
  invitee_user_id VARCHAR(100),            -- 被邀请人

  share_link_id INT REFERENCES share_links(id) ON DELETE SET NULL,

  -- 邀请状态
  status VARCHAR(20) DEFAULT 'pending',    -- pending, registered, completed
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  registered_at TIMESTAMP,
  first_order_at TIMESTAMP,

  -- 奖励状态
  inviter_rewarded BOOLEAN DEFAULT false,
  invitee_rewarded BOOLEAN DEFAULT false,

  -- 元数据
  metadata JSONB
);

CREATE INDEX idx_invite_records_code ON invite_records(invite_code);
CREATE INDEX idx_invite_records_inviter ON invite_records(inviter_user_id);
CREATE INDEX idx_invite_records_invitee ON invite_records(invitee_user_id);

-- 8. A/B测试配置表
CREATE TABLE IF NOT EXISTS share_ab_tests (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(200) NOT NULL,
  test_key VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- 测试变量
  variable_name VARCHAR(100) NOT NULL,     -- 测试变量名
  variants JSONB NOT NULL,                 -- 测试变体配置

  -- 流量分配
  traffic_allocation JSONB,                -- 流量分配比例

  -- 测试范围
  target_platforms VARCHAR(200)[],         -- 目标平台
  target_share_types VARCHAR(200)[],       -- 目标分享类型

  -- 状态
  status VARCHAR(20) DEFAULT 'draft',      -- draft, running, paused, completed
  start_time TIMESTAMP,
  end_time TIMESTAMP,

  -- 结果
  winning_variant VARCHAR(100),
  test_results JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. 分享排行榜表（缓存表）
CREATE TABLE IF NOT EXISTS share_leaderboard (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  username VARCHAR(200),
  avatar_url TEXT,

  -- 统计数据
  total_shares INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_rewards DECIMAL(10, 2) DEFAULT 0,

  -- 排名
  rank INT,
  rank_change INT DEFAULT 0,               -- 排名变化

  -- 时间周期
  period VARCHAR(20) NOT NULL,             -- daily, weekly, monthly, all_time
  period_start DATE,
  period_end DATE,

  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_user ON share_leaderboard(user_id);
CREATE INDEX idx_leaderboard_period ON share_leaderboard(period);
CREATE INDEX idx_leaderboard_rank ON share_leaderboard(rank);

-- 10. 病毒传播系数表（用于分析）
CREATE TABLE IF NOT EXISTS viral_coefficients (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,

  -- K因子计算
  invites_sent INT DEFAULT 0,              -- 发送的邀请数
  invites_accepted INT DEFAULT 0,          -- 接受的邀请数
  k_factor DECIMAL(5, 3),                  -- K因子 = invites_accepted / users

  -- 传播层级
  generation INT DEFAULT 1,                -- 第几代用户（1=种子用户）
  parent_user_id VARCHAR(100),             -- 父级用户ID

  -- 传播效果
  total_descendants INT DEFAULT 0,         -- 总后代数
  active_descendants INT DEFAULT 0,        -- 活跃后代数

  -- 计算时间
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  period VARCHAR(20) DEFAULT 'all_time'    -- daily, weekly, monthly, all_time
);

CREATE INDEX idx_viral_coefficients_user ON viral_coefficients(user_id);
CREATE INDEX idx_viral_coefficients_parent ON viral_coefficients(parent_user_id);
CREATE INDEX idx_viral_coefficients_generation ON viral_coefficients(generation);

-- ========================================
-- 更新时间戳触发器
-- ========================================

-- share_configs
CREATE OR REPLACE FUNCTION update_share_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_configs_updated
BEFORE UPDATE ON share_configs
FOR EACH ROW
EXECUTE FUNCTION update_share_configs_timestamp();

-- share_links
CREATE OR REPLACE FUNCTION update_share_links_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_links_updated
BEFORE UPDATE ON share_links
FOR EACH ROW
EXECUTE FUNCTION update_share_links_timestamp();

-- share_ab_tests
CREATE OR REPLACE FUNCTION update_share_ab_tests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_ab_tests_updated
BEFORE UPDATE ON share_ab_tests
FOR EACH ROW
EXECUTE FUNCTION update_share_ab_tests_timestamp();

-- ========================================
-- 初始化分享配置数据
-- ========================================

INSERT INTO share_configs (config_key, config_name, platform, enabled, share_text_template, settings) VALUES
('facebook', 'Facebook分享', 'facebook', true, 'Check out my {{content_type}} result! {{share_url}}',
  '{"app_id": "", "requires_auth": false}'::jsonb),

('twitter', 'Twitter分享', 'twitter', true, 'Discover your {{content_type}}! {{share_url}} #FortuneTelling #Divination',
  '{"max_length": 280, "hashtags": ["FortuneTelling", "Divination"]}'::jsonb),

('linkedin', 'LinkedIn分享', 'linkedin', true, 'Explore professional insights with {{service_name}}. {{share_url}}',
  '{"requires_auth": true}'::jsonb),

('whatsapp', 'WhatsApp分享', 'whatsapp', true, 'Hi! Check out my fortune telling result: {{share_url}}',
  '{"mobile_only": true}'::jsonb),

('telegram', 'Telegram分享', 'telegram', true, 'Discover your fortune! {{share_url}}',
  '{"supports_bot": true}'::jsonb),

('line', 'Line分享', 'line', true, 'Check this out! {{share_url}}',
  '{"regions": ["JP", "TW", "TH"]}'::jsonb),

('email', 'Email分享', 'email', true, 'Subject: Discover Your Fortune!\n\nHello,\n\nI want to share this amazing fortune telling service with you: {{share_url}}\n\nBest regards',
  '{"requires_email_client": true}'::jsonb),

('copy_link', '复制链接', 'copy_link', true, '{{share_url}}',
  '{"show_qr_code": true}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 插入成功消息
SELECT 'Sharing system tables created successfully!' as message;
