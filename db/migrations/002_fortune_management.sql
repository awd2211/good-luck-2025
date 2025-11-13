-- 算命功能管理系统数据库表

-- ==================== 服务管理模块 ====================

-- 算命服务分类表
CREATE TABLE IF NOT EXISTS fortune_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(200),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 算命服务表
CREATE TABLE IF NOT EXISTS fortune_services (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES fortune_categories(id),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    subtitle VARCHAR(300),
    description TEXT,
    detail_content TEXT,
    cover_image VARCHAR(500),
    images TEXT[], -- 多张图片

    -- 定价信息
    original_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    vip_price DECIMAL(10, 2),

    -- 服务配置
    duration INTEGER, -- 服务时长（分钟）
    is_free_trial BOOLEAN DEFAULT false, -- 是否支持免费试用
    trial_times INTEGER DEFAULT 0, -- 免费试用次数

    -- 状态控制
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, inactive
    scheduled_start TIMESTAMP, -- 定时上架
    scheduled_end TIMESTAMP, -- 定时下架

    -- 统计数据
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,

    -- 排序和标签
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_hot BOOLEAN DEFAULT false, -- 热门推荐
    is_new BOOLEAN DEFAULT false, -- 新品
    is_recommended BOOLEAN DEFAULT false, -- 首页推荐
    tags VARCHAR(50)[],

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 内容管理模块 ====================

-- 算命结果模板表
CREATE TABLE IF NOT EXISTS fortune_templates (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES fortune_services(id),
    name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- bazi, tarot, zodiac, etc.

    -- 模板内容（JSON格式）
    content JSONB NOT NULL,
    -- 示例: {"sections": [{"title": "性格分析", "content": "...", "rules": {...}}]}

    -- 规则配置
    rules JSONB, -- 计算规则、判断逻辑等

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    version VARCHAR(20),

    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 每日运势表
CREATE TABLE IF NOT EXISTS daily_horoscopes (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL, -- zodiac（星座）, birth_animal（生肖）
    type_value VARCHAR(50) NOT NULL, -- aries, tiger, etc.

    -- 运势内容
    overall_score INTEGER, -- 综合评分 1-5
    love_score INTEGER,
    career_score INTEGER,
    wealth_score INTEGER,
    health_score INTEGER,

    overall_content TEXT,
    love_content TEXT,
    career_content TEXT,
    wealth_content TEXT,
    health_content TEXT,

    -- 幸运元素
    lucky_color VARCHAR(50),
    lucky_number VARCHAR(50),
    lucky_direction VARCHAR(50),

    status VARCHAR(20) NOT NULL DEFAULT 'published',

    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(date, type, type_value)
);

-- 资讯文章表
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    subtitle VARCHAR(500),
    author VARCHAR(100),

    -- 内容
    content TEXT NOT NULL,
    summary TEXT,
    cover_image VARCHAR(500),

    -- 分类和标签
    category VARCHAR(50), -- knowledge, news, guide, etc.
    tags VARCHAR(50)[],

    -- SEO
    seo_title VARCHAR(200),
    seo_keywords VARCHAR(300),
    seo_description VARCHAR(500),

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
    published_at TIMESTAMP,

    -- 统计
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- 推荐
    is_featured BOOLEAN DEFAULT false,
    is_top BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 素材库表
CREATE TABLE IF NOT EXISTS media_library (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(300) NOT NULL,
    original_name VARCHAR(300),
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- image, video, audio, document
    mime_type VARCHAR(100),
    file_size BIGINT,

    -- 图片特有属性
    width INTEGER,
    height INTEGER,
    thumbnail_url VARCHAR(500),

    -- 分类和标签
    category VARCHAR(50), -- service, article, banner, icon, etc.
    tags VARCHAR(50)[],
    alt_text VARCHAR(200),
    description TEXT,

    -- 使用统计
    usage_count INTEGER DEFAULT 0,

    uploaded_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 营销管理模块 ====================

-- 首页配置表
CREATE TABLE IF NOT EXISTS home_configs (
    id SERIAL PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL, -- carousel, hot_services, featured_section, etc.
    title VARCHAR(200),

    -- 配置内容（JSON格式）
    content JSONB NOT NULL,
    -- 示例: {"items": [{"type": "service", "id": 1, "image": "...", "link": "..."}]}

    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- 定时显示
    start_date TIMESTAMP,
    end_date TIMESTAMP,

    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 优惠促销表
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    promotion_type VARCHAR(50) NOT NULL, -- discount, package, limited_time, etc.

    -- 促销规则（JSON格式）
    rules JSONB NOT NULL,
    -- 示例: {"discount": 0.8, "services": [1,2,3], "min_amount": 100}

    description TEXT,
    banner_image VARCHAR(500),
    detail_images TEXT[],

    -- 有效期
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,

    -- 限制
    usage_limit INTEGER, -- 总使用次数限制
    usage_count INTEGER DEFAULT 0,
    user_limit INTEGER, -- 每个用户限制次数

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,

    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    coupon_type VARCHAR(50) NOT NULL, -- discount, fixed, service_free

    -- 优惠规则
    discount_type VARCHAR(20), -- percent, fixed
    discount_value DECIMAL(10, 2),
    min_amount DECIMAL(10, 2),
    max_discount DECIMAL(10, 2),

    -- 适用范围
    applicable_services INTEGER[], -- 适用服务ID列表，空表示全部

    -- 有效期
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,

    -- 限制
    total_quantity INTEGER,
    received_quantity INTEGER DEFAULT 0,
    user_limit INTEGER DEFAULT 1,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用户优惠券领取记录
CREATE TABLE IF NOT EXISTS user_coupons (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    coupon_id INTEGER REFERENCES coupons(id),

    status VARCHAR(20) NOT NULL DEFAULT 'unused', -- unused, used, expired
    used_at TIMESTAMP,
    order_id VARCHAR(50),

    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expire_at TIMESTAMP NOT NULL
);

-- 用户评价表
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    service_id INTEGER REFERENCES fortune_services(id),
    order_id VARCHAR(50),

    -- 评价内容
    rating INTEGER NOT NULL, -- 1-5
    content TEXT,
    images TEXT[],
    tags VARCHAR(50)[], -- 标签：准确、专业、快速等

    -- 审核状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reject_reason TEXT,

    -- 展示控制
    is_featured BOOLEAN DEFAULT false, -- 精选评价
    is_anonymous BOOLEAN DEFAULT false,

    -- 互动
    like_count INTEGER DEFAULT 0,
    reply_content TEXT, -- 商家回复
    reply_at TIMESTAMP,

    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(50),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 系统配置模块 ====================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- trial, member, payment, etc.
    description TEXT,

    updated_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 索引 ====================

-- 服务管理索引
CREATE INDEX idx_fortune_services_category ON fortune_services(category_id);
CREATE INDEX idx_fortune_services_status ON fortune_services(status);
CREATE INDEX idx_fortune_services_code ON fortune_services(code);
CREATE INDEX idx_fortune_services_recommended ON fortune_services(is_recommended);

-- 内容管理索引
CREATE INDEX idx_fortune_templates_service ON fortune_templates(service_id);
CREATE INDEX idx_daily_horoscopes_date ON daily_horoscopes(date);
CREATE INDEX idx_daily_horoscopes_type ON daily_horoscopes(type, type_value);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_media_library_type ON media_library(file_type);
CREATE INDEX idx_media_library_category ON media_library(category);

-- 营销管理索引
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);
CREATE INDEX idx_reviews_service ON reviews(service_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- ==================== 触发器 ====================

-- 更新时间触发器
CREATE TRIGGER update_fortune_categories_updated_at BEFORE UPDATE ON fortune_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fortune_services_updated_at BEFORE UPDATE ON fortune_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fortune_templates_updated_at BEFORE UPDATE ON fortune_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_horoscopes_updated_at BEFORE UPDATE ON daily_horoscopes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_library_updated_at BEFORE UPDATE ON media_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_configs_updated_at BEFORE UPDATE ON home_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 初始数据 ====================

-- 插入算命服务分类
INSERT INTO fortune_categories (name, code, icon, description, sort_order) VALUES
('八字算命', 'bazi', '🔮', '根据生辰八字推算命运', 1),
('生肖运势', 'birth_animal', '🐉', '十二生肖运势查询', 2),
('星座运势', 'zodiac', '⭐', '十二星座每日运势', 3),
('塔罗占卜', 'tarot', '🃏', '塔罗牌占卜预测', 4),
('姓名测试', 'name_test', '📝', '姓名五行分析', 5),
('周公解梦', 'dream', '💤', '梦境解析', 6)
ON CONFLICT (code) DO NOTHING;

-- 插入系统配置 - 免费试用配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('free_trial', '{"enabled": true, "daily_limit": 3, "services": ["birth_animal", "zodiac"]}', 'trial', '免费试用配置'),
('member_levels', '{"levels": [{"name": "普通会员", "discount": 1.0}, {"name": "银卡会员", "discount": 0.95}, {"name": "金卡会员", "discount": 0.9}, {"name": "钻石会员", "discount": 0.85}]}', 'member', '会员等级配置')
ON CONFLICT (config_key) DO NOTHING;

-- 完成
SELECT '算命管理系统数据库表创建完成!' as status;
