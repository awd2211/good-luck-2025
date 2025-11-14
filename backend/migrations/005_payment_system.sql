-- =====================================================
-- 支付系统数据库迁移脚本
-- 版本: 005
-- 日期: 2025-11-13
-- 描述: 创建PayPal和Stripe支付系统所需的表
-- =====================================================

-- 1. 支付配置表 - 存储PayPal/Stripe的API密钥等配置
CREATE TABLE IF NOT EXISTS payment_configs (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL, -- paypal, stripe
    config_key VARCHAR(100) NOT NULL, -- api_key, secret_key, client_id, webhook_secret等
    config_value TEXT NOT NULL, -- 配置值（敏感信息，应加密存储）
    is_production BOOLEAN NOT NULL DEFAULT FALSE, -- 是否生产环境
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- 是否启用
    description TEXT, -- 配置说明
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, config_key, is_production) -- 同一环境下，同一提供商的配置键唯一
);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_payment_configs_provider ON payment_configs(provider);
CREATE INDEX IF NOT EXISTS idx_payment_configs_enabled ON payment_configs(is_enabled);

-- 配置表更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_configs_updated_at
    BEFORE UPDATE ON payment_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_configs_updated_at();

-- 2. 支付方式表 - 定义可用的支付方式
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    method_code VARCHAR(50) NOT NULL UNIQUE, -- paypal, stripe, balance
    method_name VARCHAR(100) NOT NULL, -- 显示名称
    provider VARCHAR(50), -- 支付提供商: paypal, stripe, internal(余额支付)
    icon VARCHAR(255), -- 图标URL或图标名称
    description TEXT, -- 描述
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- 是否启用
    sort_order INTEGER NOT NULL DEFAULT 0, -- 排序权重
    min_amount DECIMAL(10, 2) DEFAULT 0.01, -- 最小支付金额
    max_amount DECIMAL(10, 2), -- 最大支付金额
    fee_type VARCHAR(20) DEFAULT 'none', -- 手续费类型: none, fixed, percentage
    fee_value DECIMAL(10, 4) DEFAULT 0, -- 手续费值
    config JSON, -- 额外配置（JSON格式）
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 支付方式表索引
CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON payment_methods(is_enabled);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX IF NOT EXISTS idx_payment_methods_sort ON payment_methods(sort_order);

-- 支付方式表更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- 3. 支付交易记录表 - 记录每笔支付的详细信息
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE, -- 内部交易ID（唯一）
    order_id VARCHAR(50) NOT NULL, -- 关联订单ID
    user_id VARCHAR(50) NOT NULL, -- 用户ID
    payment_method VARCHAR(50) NOT NULL, -- 支付方式代码
    provider VARCHAR(50), -- 支付提供商
    amount DECIMAL(10, 2) NOT NULL, -- 支付金额
    currency VARCHAR(10) NOT NULL DEFAULT 'USD', -- 货币类型
    fee_amount DECIMAL(10, 2) DEFAULT 0, -- 手续费
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled, refunded
    provider_transaction_id VARCHAR(200), -- 第三方平台的交易ID
    provider_order_id VARCHAR(200), -- 第三方平台的订单ID
    provider_status VARCHAR(50), -- 第三方平台返回的状态
    provider_response JSON, -- 第三方平台完整响应（JSON）
    callback_data JSON, -- 回调数据（JSON）
    error_code VARCHAR(50), -- 错误代码
    error_message TEXT, -- 错误信息
    ip_address VARCHAR(50), -- 支付时的IP地址
    user_agent TEXT, -- 用户代理
    return_url TEXT, -- 支付成功返回URL
    cancel_url TEXT, -- 支付取消返回URL
    notify_url TEXT, -- 异步通知URL
    paid_at TIMESTAMP, -- 支付完成时间
    refunded_at TIMESTAMP, -- 退款时间
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 支付交易表索引
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON payment_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- 支付交易表更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transactions_updated_at();

-- 4. 更新退款表 - 添加支付交易关联
ALTER TABLE refunds
ADD COLUMN IF NOT EXISTS payment_transaction_id INTEGER REFERENCES payment_transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_refunds_payment_transaction ON refunds(payment_transaction_id);

-- =====================================================
-- 初始化默认数据
-- =====================================================

-- 插入默认支付方式
INSERT INTO payment_methods (method_code, method_name, provider, icon, description, is_enabled, sort_order, min_amount, max_amount, fee_type, fee_value) VALUES
('balance', '余额支付', 'internal', 'wallet', '使用账户余额支付，无手续费', TRUE, 1, 0.01, NULL, 'none', 0),
('paypal', 'PayPal', 'paypal', 'paypal', '通过PayPal安全支付', TRUE, 2, 0.01, 10000, 'percentage', 0.029),
('stripe', 'Stripe', 'stripe', 'credit-card', '信用卡/借记卡支付（Stripe）', TRUE, 3, 0.50, 999999, 'percentage', 0.029)
ON CONFLICT (method_code) DO NOTHING;

-- 插入PayPal开发环境默认配置（需要管理员在后台配置实际值）
INSERT INTO payment_configs (provider, config_key, config_value, is_production, description) VALUES
('paypal', 'client_id', 'YOUR_PAYPAL_CLIENT_ID', FALSE, 'PayPal应用Client ID（沙盒环境）'),
('paypal', 'client_secret', 'YOUR_PAYPAL_CLIENT_SECRET', FALSE, 'PayPal应用Client Secret（沙盒环境）'),
('paypal', 'mode', 'sandbox', FALSE, 'PayPal模式: sandbox或live')
ON CONFLICT (provider, config_key, is_production) DO NOTHING;

-- 插入PayPal生产环境配置占位符
INSERT INTO payment_configs (provider, config_key, config_value, is_production, is_enabled, description) VALUES
('paypal', 'client_id', 'YOUR_PAYPAL_PRODUCTION_CLIENT_ID', TRUE, FALSE, 'PayPal应用Client ID（生产环境）'),
('paypal', 'client_secret', 'YOUR_PAYPAL_PRODUCTION_CLIENT_SECRET', TRUE, FALSE, 'PayPal应用Client Secret（生产环境）'),
('paypal', 'mode', 'live', TRUE, FALSE, 'PayPal模式: sandbox或live')
ON CONFLICT (provider, config_key, is_production) DO NOTHING;

-- 插入Stripe开发环境默认配置
INSERT INTO payment_configs (provider, config_key, config_value, is_production, description) VALUES
('stripe', 'publishable_key', 'pk_test_YOUR_STRIPE_TEST_KEY', FALSE, 'Stripe可发布密钥（测试环境）'),
('stripe', 'secret_key', 'sk_test_YOUR_STRIPE_SECRET_KEY', FALSE, 'Stripe私密密钥（测试环境）'),
('stripe', 'webhook_secret', 'whsec_YOUR_WEBHOOK_SECRET', FALSE, 'Stripe Webhook签名密钥（测试环境）')
ON CONFLICT (provider, config_key, is_production) DO NOTHING;

-- 插入Stripe生产环境配置占位符
INSERT INTO payment_configs (provider, config_key, config_value, is_production, is_enabled, description) VALUES
('stripe', 'publishable_key', 'pk_live_YOUR_STRIPE_LIVE_KEY', TRUE, FALSE, 'Stripe可发布密钥（生产环境）'),
('stripe', 'secret_key', 'sk_live_YOUR_STRIPE_SECRET_KEY', TRUE, FALSE, 'Stripe私密密钥（生产环境）'),
('stripe', 'webhook_secret', 'whsec_YOUR_WEBHOOK_SECRET_LIVE', TRUE, FALSE, 'Stripe Webhook签名密钥（生产环境）')
ON CONFLICT (provider, config_key, is_production) DO NOTHING;

-- =====================================================
-- 完成
-- =====================================================
COMMENT ON TABLE payment_configs IS '支付配置表 - 存储PayPal/Stripe等支付平台的API密钥配置';
COMMENT ON TABLE payment_methods IS '支付方式表 - 定义可用的支付方式及其配置';
COMMENT ON TABLE payment_transactions IS '支付交易记录表 - 记录所有支付交易的详细信息';
