-- ============================================================================
-- 管理后台性能优化迁移
-- 创建时间: 2025-11-16
-- 说明: 针对管理后台的查询模式优化
-- ============================================================================

-- ============================================================================
-- 第一部分: 配置表索引优化
-- ============================================================================

-- 1. app_configs表优化（605次全表扫描，3.82%索引使用率）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_configs_key_status
ON app_configs(config_key, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_configs_category
ON app_configs(config_category)
WHERE status = 'active';

-- 2. customer_service_configs表优化（554次全表扫描，0%索引使用率）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cs_configs_key
ON customer_service_configs(config_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cs_configs_type_status
ON customer_service_configs(config_type, status)
WHERE status = 'active';

-- 3. system_configs表优化（310次全表扫描，6.06%索引使用率）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configs_key_status
ON system_configs(config_key, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configs_category
ON system_configs(config_category)
WHERE status = 'active';

-- 4. admins表优化（363次全表扫描，30.73%索引使用率）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admins_role_status
ON admins(role, status)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admins_email
ON admins(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admins_username_covering
ON admins(username)
INCLUDE (email, role, status);

-- ============================================================================
-- 第二部分: 审计日志优化
-- ============================================================================

-- 1. 复合索引优化（常见查询组合）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
ON audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_created
ON audit_logs(action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_status_created
ON audit_logs(status, created_at DESC);

-- 2. 分区表准备（可选，用于大数据量）
-- 注意：这会重建表，建议在低峰期执行
-- 取消注释以启用分区

/*
-- 创建分区父表
CREATE TABLE audit_logs_partitioned (
    id SERIAL,
    user_id VARCHAR(50),
    username VARCHAR(100),
    action VARCHAR(50),
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_body TEXT,
    response_status INTEGER,
    response_time INTEGER,
    status VARCHAR(20),
    level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 创建分区（按月）
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 迁移数据
INSERT INTO audit_logs_partitioned SELECT * FROM audit_logs;

-- 重命名表
ALTER TABLE audit_logs RENAME TO audit_logs_old;
ALTER TABLE audit_logs_partitioned RENAME TO audit_logs;
*/

-- ============================================================================
-- 第三部分: 统计查询优化 - 物化视图
-- ============================================================================

-- 1. 每日统计物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_stats AS
SELECT
    DATE(created_at) as stat_date,
    -- 用户统计
    COUNT(DISTINCT CASE WHEN table_name = 'users' THEN user_id END) as new_users,
    -- 订单统计
    COUNT(CASE WHEN table_name = 'orders' AND status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN table_name = 'orders' AND status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN table_name = 'orders' AND status = 'cancelled' THEN 1 END) as cancelled_orders,
    -- 收入统计（需要从orders表join）
    SUM(CASE WHEN table_name = 'orders' AND status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    AVG(CASE WHEN table_name = 'orders' AND status = 'completed' THEN amount END) as avg_order_amount
FROM (
    SELECT
        'users' as table_name,
        id as user_id,
        NULL::integer as amount,
        NULL::varchar as status,
        created_at
    FROM users
    UNION ALL
    SELECT
        'orders' as table_name,
        user_id,
        amount::integer,
        status,
        create_time as created_at
    FROM orders
) combined_data
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY stat_date DESC;

-- 为物化视图创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_stats_date
ON mv_daily_stats(stat_date DESC);

-- 2. 用户统计物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_stats AS
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
    COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_new_users,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_new_users,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_new_users,
    ROUND(AVG(order_count), 2) as avg_orders_per_user,
    ROUND(AVG(total_spent), 2) as avg_spent_per_user,
    SUM(order_count) as total_orders,
    SUM(total_spent) as total_revenue
FROM users
WHERE status != 'deleted';

-- 3. 订单统计物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_order_stats AS
SELECT
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_orders,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN amount END) as avg_order_amount,
    COUNT(CASE WHEN DATE(create_time) = CURRENT_DATE THEN 1 END) as today_orders,
    SUM(CASE WHEN DATE(create_time) = CURRENT_DATE AND status = 'completed' THEN amount ELSE 0 END) as today_revenue
FROM orders;

-- ============================================================================
-- 第四部分: 自动刷新物化视图的函数和触发器
-- ============================================================================

-- 创建刷新物化视图的函数
CREATE OR REPLACE FUNCTION refresh_stats_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;
    REFRESH MATERIALIZED VIEW mv_user_stats;
    REFRESH MATERIALIZED VIEW mv_order_stats;
    RAISE NOTICE '物化视图已刷新';
END;
$$ LANGUAGE plpgsql;

-- 注意：物化视图需要定期刷新
-- 可以使用pg_cron扩展或应用层定时任务
-- 建议刷新频率：5-15分钟

-- ============================================================================
-- 第五部分: 查询性能提升的额外索引
-- ============================================================================

-- 1. 订单表 - 管理后台常用查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_create_time
ON orders(status, create_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_create_time_covering
ON orders(create_time DESC)
INCLUDE (user_id, status, amount, fortune_type);

-- 2. 财务记录表
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_date
ON financial_records(transaction_date DESC)
WHERE status = 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_type_date
ON financial_records(transaction_type, transaction_date DESC);

-- 3. 退款表
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_status_created
ON refunds(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_order_id
ON refunds(order_id);

-- 4. 评价表 - 管理后台审核
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_status_created
ON reviews(status, created_at DESC);

-- ============================================================================
-- 第六部分: 数据库统计信息更新
-- ============================================================================

-- 更新所有优化表的统计信息
ANALYZE app_configs;
ANALYZE customer_service_configs;
ANALYZE system_configs;
ANALYZE admins;
ANALYZE audit_logs;
ANALYZE orders;
ANALYZE financial_records;
ANALYZE refunds;
ANALYZE reviews;

-- ============================================================================
-- 验证和监控查询
-- ============================================================================

-- 查看新建索引
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('app_configs', 'system_configs', 'admins', 'audit_logs');

-- 查看物化视图
-- SELECT matviewname, pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size FROM pg_matviews;

-- 刷新所有物化视图
-- SELECT refresh_stats_materialized_views();
