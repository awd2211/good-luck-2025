-- P1功能数据库表创建脚本

-- 退款记录表
CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    refund_no VARCHAR(50) NOT NULL UNIQUE,
    order_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(200),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
    refund_method VARCHAR(50), -- original, alipay, wechat, bank
    reviewer_id VARCHAR(50),
    reviewer_name VARCHAR(100),
    review_comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'feedback', -- feedback, complaint, suggestion, bug
    category VARCHAR(50), -- product, service, technical, other
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    contact VARCHAR(100),
    images TEXT, -- JSON array of image URLs
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, resolved, closed
    handler_id VARCHAR(50),
    handler_name VARCHAR(100),
    handler_comment TEXT,
    satisfaction_score INTEGER, -- 1-5
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 订单评价表
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    fortune_type VARCHAR(50) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    images TEXT, -- JSON array of image URLs
    tags TEXT, -- JSON array of tags like ["准确", "专业", "耐心"]
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- published, hidden, deleted
    helpful_count INTEGER DEFAULT 0,
    reply_content TEXT,
    reply_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'discount', -- discount, amount, free
    value DECIMAL(10, 2) NOT NULL,
    min_amount DECIMAL(10, 2), -- 最低消费金额
    max_discount DECIMAL(10, 2), -- 最大优惠金额
    total_count INTEGER NOT NULL DEFAULT 0, -- 总发行量，0表示不限
    used_count INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    target_users VARCHAR(50) DEFAULT 'all', -- all, new, vip
    applicable_types TEXT, -- JSON array of fortune types
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, expired
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用户优惠券关联表
CREATE TABLE IF NOT EXISTS user_coupons (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    coupon_id INTEGER NOT NULL,
    order_id VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'unused', -- unused, used, expired
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    expired_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_user_id ON refunds(user_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at);

CREATE INDEX idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_type ON feedbacks(type);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);

CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_valid_from ON coupons(valid_from);
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);

CREATE INDEX idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

-- 插入示例数据
-- 示例退款
INSERT INTO refunds (refund_no, order_id, user_id, amount, reason, status) VALUES
('RF' || to_char(now(), 'YYYYMMDD') || '001', 'ORD' || extract(epoch from now())::bigint, 'user-001', 29.90, '服务不满意', 'pending');

-- 示例反馈
INSERT INTO feedbacks (user_id, username, type, category, title, content, status) VALUES
('user-001', '用户001', 'feedback', 'product', '建议增加更多算命类型', '希望能增加风水、择日等更多算命类型', 'pending'),
('user-002', '用户002', 'complaint', 'service', '算命结果不准确', '我购买的八字精批结果与实际情况不符', 'processing');

-- 示例评价
INSERT INTO reviews (order_id, user_id, username, fortune_type, rating, content, tags, status) VALUES
('ORD' || extract(epoch from now())::bigint, 'user-001', '用户001', '八字精批', 5, '非常准确，大师很专业！', '["准确", "专业", "满意"]', 'published'),
('ORD' || (extract(epoch from now())::bigint - 1), 'user-002', '用户002', '生肖运势', 4, '还不错，有一定参考价值', '["不错", "有用"]', 'published');

-- 示例优惠券
INSERT INTO coupons (code, name, type, value, min_amount, total_count, valid_from, valid_until, status) VALUES
('NEW2025', '新用户专享', 'amount', 10.00, 19.90, 1000, now(), now() + interval '30 days', 'active'),
('VIP50', 'VIP用户折扣券', 'discount', 0.50, 50.00, 500, now(), now() + interval '60 days', 'active');
