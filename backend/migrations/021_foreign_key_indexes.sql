-- ============================================================================
-- 外键索引优化迁移
-- 创建时间: 2025-11-16
-- 说明: 为17个缺失索引的外键列创建索引，提升JOIN查询性能
-- 预期提升: JOIN查询性能 10-100倍
-- ============================================================================

-- 使用 CONCURRENTLY 创建索引，不会阻塞表的读写操作
-- 注意: CONCURRENTLY 不能在事务中使用，需要单独执行

-- 1. AI对话日志 - bot配置外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversation_logs_bot_config_id
ON ai_conversation_logs(bot_config_id);

-- 2. 归因触点 - 归因事件外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attribution_touchpoints_event_id
ON attribution_touchpoints(attribution_event_id);

-- 3. 归因触点 - 渠道外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attribution_touchpoints_channel_id
ON attribution_touchpoints(channel_id);

-- 4. 归因UTM模板 - 渠道外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attribution_utm_templates_channel_id
ON attribution_utm_templates(channel_id);

-- 5. 客户画像 - 首选客服外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_profiles_preferred_agent
ON customer_profiles(preferred_agent_id);

-- 6. 算命结果 - 算命服务外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fortune_results_fortune_id
ON fortune_results(fortune_id);

-- 7. 邀请记录 - 分享链接外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_records_share_link_id
ON invite_records(share_link_id);

-- 8. 知识库搜索历史 - 点击文章外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_search_clicked_article
ON knowledge_search_history(clicked_article_id);

-- 9. 通知 - 模板外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_template_id
ON notifications(template_id);

-- 10. 订单项 - 算命结果外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_fortune_result_id
ON order_items(fortune_result_id);

-- 11. 促销代码 - 渠道外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_promotion_codes_channel_id
ON promotion_codes(channel_id);

-- 12. 排班调换请求 - 请求者排班外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_swap_requester
ON schedule_swap_requests(requester_schedule_id);

-- 13. 排班调换请求 - 目标排班外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_swap_target
ON schedule_swap_requests(target_schedule_id);

-- 14. 分享转化 - 点击记录外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_conversions_click_id
ON share_conversions(click_id);

-- 15. 分享奖励 - 转化记录外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_rewards_conversion_id
ON share_rewards(conversion_id);

-- 16. 分享奖励 - 分享链接外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_rewards_share_link_id
ON share_rewards(share_link_id);

-- 17. 用户标签 - 分配者外键
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tags_assigned_by
ON user_tags(assigned_by);

-- ============================================================================
-- 启用慢查询追踪扩展
-- ============================================================================

-- 启用 pg_stat_statements 扩展用于追踪慢查询
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查看配置
-- SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';
