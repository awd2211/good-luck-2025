-- ============================================================================
-- 数据库性能优化迁移
-- 创建时间: 2025-11-16
-- 说明: 基于DATABASE_OPTIMIZATION_REPORT.md的优化方案
-- ============================================================================

-- ============================================================================
-- 第一部分: 添加缺失的关键索引（方案1）
-- 预期: 查询性能提升50-200%
-- ============================================================================

-- 1. notifications表优化 - 解决4407次全表扫描问题
CREATE INDEX IF NOT EXISTS idx_notifications_status_target
ON notifications(status, target)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_notifications_dates
ON notifications(start_date, end_date)
WHERE status = 'active';

-- 2. app_configs表优化
CREATE INDEX IF NOT EXISTS idx_app_configs_key
ON app_configs(config_key);

CREATE INDEX IF NOT EXISTS idx_app_configs_status
ON app_configs(status)
WHERE status = 'active';

-- 3. fortune_categories表优化
CREATE INDEX IF NOT EXISTS idx_fortune_categories_status_order
ON fortune_categories(status, display_order);

-- 4. users表复合查询优化
CREATE INDEX IF NOT EXISTS idx_users_status_created
ON users(status, created_at DESC)
WHERE status != 'deleted';

-- 5. orders表优化
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created
ON orders(user_id, status, create_time DESC);

-- 6. customer_service_configs表优化
CREATE INDEX IF NOT EXISTS idx_cs_configs_config_type
ON customer_service_configs(config_type);

-- 7. system_configs表优化
CREATE INDEX IF NOT EXISTS idx_system_configs_key
ON system_configs(config_key);

-- 8. attribution_channels表优化
CREATE INDEX IF NOT EXISTS idx_attribution_channels_name
ON attribution_channels(channel_name);

-- ============================================================================
-- 第二部分: 复合索引优化（方案4）
-- ============================================================================

-- 订单管理
CREATE INDEX IF NOT EXISTS idx_orders_user_status_time
ON orders(user_id, status, create_time DESC);

-- 评价管理
CREATE INDEX IF NOT EXISTS idx_reviews_user_status_created
ON reviews(user_id, status, created_at DESC);

-- 支付记录
CREATE INDEX IF NOT EXISTS idx_payments_user_status_created
ON payments(user_id, status, created_at DESC);

-- 优惠券
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_status
ON user_coupons(user_id, status);

-- 收藏
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
ON favorites(user_id, created_at DESC);

-- ============================================================================
-- 第三部分: 覆盖索引（方案6）
-- ============================================================================

-- 用户手机号查询（最高频）
CREATE INDEX IF NOT EXISTS idx_users_phone_covering
ON users(phone)
INCLUDE (id, username, status, balance);

-- 订单编号查询
CREATE INDEX IF NOT EXISTS idx_orders_order_id_covering
ON orders(order_id)
INCLUDE (user_id, status, amount, create_time);

-- 支付流水查询
CREATE INDEX IF NOT EXISTS idx_payments_payment_id_covering
ON payments(payment_id)
INCLUDE (user_id, order_id, amount, status, created_at);

-- ============================================================================
-- 第四部分: 全文搜索优化（方案2）
-- ============================================================================

-- 1. 添加search_vector列
ALTER TABLE users
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. 创建GIN索引
CREATE INDEX IF NOT EXISTS idx_users_search
ON users USING GIN(search_vector);

-- 3. 创建触发器函数
CREATE OR REPLACE FUNCTION users_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.nickname, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.id, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS users_search_vector_trigger ON users;
CREATE TRIGGER users_search_vector_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION users_search_vector_update();

-- 5. 初始化现有数据
UPDATE users SET updated_at = updated_at WHERE search_vector IS NULL;

-- ============================================================================
-- 第五部分: 删除无用索引（方案3）
-- ============================================================================

-- 删除未使用的索引
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_orders_create_time;
