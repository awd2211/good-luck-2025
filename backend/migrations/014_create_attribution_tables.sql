-- 归因统计系统数据库表

-- 1. 渠道配置表
CREATE TABLE IF NOT EXISTS attribution_channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,        -- 渠道名称
  display_name VARCHAR(200) NOT NULL,       -- 显示名称
  channel_type VARCHAR(50) NOT NULL,        -- 渠道类型: search/social/direct/referral/paid/email等
  icon VARCHAR(100),                        -- 图标
  color VARCHAR(20),                        -- 显示颜色
  is_active BOOLEAN DEFAULT true,           -- 是否启用
  sort_order INTEGER DEFAULT 0,             -- 排序
  description TEXT,                         -- 描述
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. UTM参数模板表
CREATE TABLE IF NOT EXISTS attribution_utm_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,               -- 模板名称
  utm_source VARCHAR(100) NOT NULL,         -- 来源
  utm_medium VARCHAR(100),                  -- 媒介
  utm_campaign VARCHAR(200),                -- 活动名称
  utm_term VARCHAR(200),                    -- 关键词
  utm_content VARCHAR(200),                 -- 内容
  target_url TEXT NOT NULL,                 -- 目标URL
  generated_url TEXT,                       -- 生成的完整URL
  channel_id INTEGER REFERENCES attribution_channels(id),
  description TEXT,                         -- 描述
  created_by INTEGER REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 推广码表
CREATE TABLE IF NOT EXISTS promotion_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,         -- 推广码
  name VARCHAR(200) NOT NULL,               -- 推广码名称
  channel_id INTEGER REFERENCES attribution_channels(id),
  utm_source VARCHAR(100),                  -- 关联的UTM参数
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  target_url TEXT,                          -- 目标落地页
  start_date TIMESTAMP,                     -- 有效期开始
  end_date TIMESTAMP,                       -- 有效期结束
  max_usage INTEGER,                        -- 最大使用次数
  usage_count INTEGER DEFAULT 0,            -- 已使用次数
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_by INTEGER REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 转化事件定义表
CREATE TABLE IF NOT EXISTS conversion_event_definitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,        -- 事件名称
  display_name VARCHAR(200) NOT NULL,       -- 显示名称
  event_type VARCHAR(50) NOT NULL,          -- 事件类型: registration/first_payment/repeat_purchase/custom等
  description TEXT,
  value_calculation VARCHAR(50),            -- 价值计算方式: fixed/order_amount/custom
  fixed_value DECIMAL(10,2),                -- 固定价值
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 归因事件记录表（核心表）
CREATE TABLE IF NOT EXISTS attribution_events (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,         -- 会话ID
  user_id INTEGER REFERENCES users(id),     -- 用户ID（如果已登录）
  visitor_id VARCHAR(100),                  -- 访客ID（未登录用户）

  -- 渠道信息
  channel_id INTEGER REFERENCES attribution_channels(id),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_term VARCHAR(200),
  utm_content VARCHAR(200),
  promotion_code VARCHAR(50),

  -- 来源信息
  referrer TEXT,                            -- 来源页面
  landing_page TEXT,                        -- 落地页

  -- 设备和位置信息
  device_type VARCHAR(50),                  -- 设备类型: desktop/mobile/tablet
  os VARCHAR(50),                           -- 操作系统
  browser VARCHAR(50),                      -- 浏览器
  ip_address VARCHAR(50),
  country VARCHAR(50),
  city VARCHAR(100),

  -- 时间信息
  visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_attribution_events_user_id ON attribution_events(user_id);
CREATE INDEX idx_attribution_events_visitor_id ON attribution_events(visitor_id);
CREATE INDEX idx_attribution_events_session_id ON attribution_events(session_id);
CREATE INDEX idx_attribution_events_channel_id ON attribution_events(channel_id);
CREATE INDEX idx_attribution_events_utm_source ON attribution_events(utm_source);
CREATE INDEX idx_attribution_events_visit_at ON attribution_events(visit_at);

-- 6. 触点记录表（多触点归因）
CREATE TABLE IF NOT EXISTS attribution_touchpoints (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  visitor_id VARCHAR(100),
  attribution_event_id INTEGER REFERENCES attribution_events(id),
  touchpoint_order INTEGER NOT NULL,        -- 触点顺序（第几次接触）
  channel_id INTEGER REFERENCES attribution_channels(id),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  touched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attribution_touchpoints_user_id ON attribution_touchpoints(user_id);
CREATE INDEX idx_attribution_touchpoints_visitor_id ON attribution_touchpoints(visitor_id);

-- 7. 用户转化记录表
CREATE TABLE IF NOT EXISTS user_conversions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  conversion_event_id INTEGER REFERENCES conversion_event_definitions(id),

  -- 归因信息（首次点击归因）
  first_touch_channel_id INTEGER REFERENCES attribution_channels(id),
  first_touch_utm_source VARCHAR(100),
  first_touch_utm_campaign VARCHAR(200),
  first_touch_at TIMESTAMP,

  -- 归因信息（末次点击归因）
  last_touch_channel_id INTEGER REFERENCES attribution_channels(id),
  last_touch_utm_source VARCHAR(100),
  last_touch_utm_campaign VARCHAR(200),
  last_touch_at TIMESTAMP,

  -- 线性归因权重（JSON格式存储各触点的权重）
  linear_attribution JSONB,

  -- 转化价值
  conversion_value DECIMAL(10,2),

  -- 订单关联（如果是购买转化）
  order_id INTEGER REFERENCES orders(id),

  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_conversions_user_id ON user_conversions(user_id);
CREATE INDEX idx_user_conversions_event_id ON user_conversions(conversion_event_id);
CREATE INDEX idx_user_conversions_first_channel ON user_conversions(first_touch_channel_id);
CREATE INDEX idx_user_conversions_last_channel ON user_conversions(last_touch_channel_id);
CREATE INDEX idx_user_conversions_converted_at ON user_conversions(converted_at);

-- 8. 渠道成本投入表（用于ROI计算）
CREATE TABLE IF NOT EXISTS channel_costs (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES attribution_channels(id),
  cost_date DATE NOT NULL,                  -- 成本日期
  cost_amount DECIMAL(10,2) NOT NULL,       -- 投入成本
  currency VARCHAR(10) DEFAULT 'CNY',
  utm_campaign VARCHAR(200),                -- 关联的活动（可选）
  notes TEXT,
  created_by INTEGER REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, cost_date, utm_campaign)
);

CREATE INDEX idx_channel_costs_channel_id ON channel_costs(channel_id);
CREATE INDEX idx_channel_costs_cost_date ON channel_costs(cost_date);

-- 9. 自定义报表配置表
CREATE TABLE IF NOT EXISTS attribution_custom_reports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  report_type VARCHAR(50) NOT NULL,         -- channel_comparison/funnel/roi/trend等
  config JSONB NOT NULL,                    -- 报表配置（维度、指标、筛选条件等）
  is_public BOOLEAN DEFAULT false,          -- 是否公开
  created_by INTEGER REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化一些默认渠道
INSERT INTO attribution_channels (name, display_name, channel_type, color, sort_order) VALUES
('organic_search', '自然搜索', 'search', '#4CAF50', 1),
('paid_search', '付费搜索', 'paid', '#2196F3', 2),
('social_media', '社交媒体', 'social', '#E91E63', 3),
('direct', '直接访问', 'direct', '#9C27B0', 4),
('referral', '推荐链接', 'referral', '#FF9800', 5),
('email', '邮件营销', 'email', '#00BCD4', 6),
('wechat', '微信推广', 'social', '#07C160', 7),
('douyin', '抖音推广', 'social', '#000000', 8);

-- 初始化默认转化事件
INSERT INTO conversion_event_definitions (name, display_name, event_type, value_calculation, sort_order) VALUES
('registration', '用户注册', 'registration', 'fixed', 1),
('first_payment', '首次付费', 'first_payment', 'order_amount', 2),
('repeat_purchase', '复购', 'repeat_purchase', 'order_amount', 3),
('high_value_order', '高价值订单', 'custom', 'order_amount', 4);

COMMENT ON TABLE attribution_channels IS '营销渠道配置表';
COMMENT ON TABLE attribution_utm_templates IS 'UTM参数模板表';
COMMENT ON TABLE promotion_codes IS '推广码表';
COMMENT ON TABLE conversion_event_definitions IS '转化事件定义表';
COMMENT ON TABLE attribution_events IS '归因事件记录表（核心追踪表）';
COMMENT ON TABLE attribution_touchpoints IS '用户触点记录表（多触点归因）';
COMMENT ON TABLE user_conversions IS '用户转化记录表';
COMMENT ON TABLE channel_costs IS '渠道成本投入表';
COMMENT ON TABLE attribution_custom_reports IS '自定义报表配置表';
