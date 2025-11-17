-- 添加算命平台业务相关的通知模板
-- 根据实际业务场景补充完整的通知模板

-- ==================== 订单相关模板 ====================

INSERT INTO notification_templates (name, title, content, type, priority, target, variables, description, is_system) VALUES
-- 支付成功
('payment_success', '支付成功', '亲爱的{username}，您的订单{order_id}已支付成功，支付金额{amount}元。我们将尽快为您生成测算结果，请耐心等待~', 'success', 1, 'all', '["username", "order_id", "amount"]', '订单支付成功通知', TRUE),

-- 订单完成
('order_completed', '订单已完成', '{username}您好，您的订单{order_id}已完成！感谢您的信任，期待再次为您服务。如有任何疑问，欢迎联系客服。', 'success', 0, 'all', '["username", "order_id"]', '订单完成通知', TRUE),

-- 订单取消
('order_cancelled', '订单已取消', '{username}，您的订单{order_id}已成功取消。如果款项已支付，退款将在3-5个工作日内原路返回。', 'info', 0, 'all', '["username", "order_id"]', '订单取消通知', TRUE),

-- 退款成功
('refund_success', '退款已到账', '{username}您好，您的订单{order_id}退款{amount}元已成功，预计3-5个工作日到账，请注意查收。', 'success', 1, 'all', '["username", "order_id", "amount"]', '退款成功通知', TRUE),

-- ==================== 测算服务相关模板 ====================

-- 测算结果生成
('fortune_result_ready', '测算结果已生成', '✨{username}，您订购的【{fortune_type}】测算结果已生成！快来查看您的运势详解吧~', 'success', 2, 'all', '["username", "fortune_type"]', '测算结果生成通知', TRUE),

-- 测算结果分享
('fortune_shared', '好友查看了您的分享', '🎁{username}，您的好友{friend_name}查看了您分享的【{fortune_type}】测算结果！快去看看TA的反馈吧~', 'info', 0, 'all', '["username", "friend_name", "fortune_type"]', '测算结果分享通知', TRUE),

-- 每日运势提醒
('daily_horoscope', '今日运势播报', '🌟{username}，您的{zodiac_name}今日运势已更新！综合运势：{fortune_score}分。快来查看详细运势解析吧！', 'info', 1, 'all', '["username", "zodiac_name", "fortune_score"]', '每日运势提醒', TRUE),

-- 算命服务推荐
('fortune_recommendation', '专属测算推荐', '💫{username}，根据您的测算历史，我们为您推荐【{service_name}】，限时优惠{discount}！了解更多详情>>', 'info', 0, 'all', '["username", "service_name", "discount"]', '算命服务推荐', TRUE),

-- ==================== 优惠券相关模板 ====================

-- 优惠券领取成功
('coupon_received', '优惠券领取成功', '🎉恭喜{username}！您已成功领取【{coupon_name}】优惠券，满{min_amount}元可用，有效期至{expire_date}。', 'success', 1, 'all', '["username", "coupon_name", "min_amount", "expire_date"]', '优惠券领取成功', TRUE),

-- 优惠券即将过期
('coupon_expiring', '优惠券即将过期', '⏰{username}，您的【{coupon_name}】优惠券将于{expire_date}过期，价值{discount}元，赶快使用吧！', 'warning', 1, 'all', '["username", "coupon_name", "expire_date", "discount"]', '优惠券过期提醒', TRUE),

-- 优惠券使用成功
('coupon_used', '优惠券已使用', '✅{username}，您已成功使用【{coupon_name}】优惠券，为您节省{saved_amount}元！', 'success', 0, 'all', '["username", "coupon_name", "saved_amount"]', '优惠券使用成功', TRUE),

-- ==================== 用户关怀模板 ====================

-- 生日祝福
('birthday_blessing', '生日快乐', '🎂{username}，祝您生日快乐！平台为您准备了专属生日礼包：{gift_description}，快来领取吧！', 'success', 2, 'all', '["username", "gift_description"]', '用户生日祝福', TRUE),

-- 会员升级
('member_upgrade', '会员升级成功', '🎊恭喜{username}！您已成功升级为{level}会员，享受{benefits}等专属权益！', 'success', 1, 'all', '["username", "level", "benefits"]', '会员升级通知', TRUE),

-- 连续签到奖励
('checkin_reward', '签到奖励已发放', '🌈{username}，您已连续签到{days}天！获得{reward}奖励，再坚持{next_days}天可获得更多好礼~', 'success', 0, 'all', '["username", "days", "reward", "next_days"]', '连续签到奖励', TRUE),

-- 积分到账
('points_credited', '积分到账通知', '💰{username}，您的账户新增{points}积分！当前总积分{total_points}分，可用于兑换精美礼品哦~', 'info', 0, 'all', '["username", "points", "total_points"]', '积分到账通知', TRUE),

-- ==================== 营销活动模板 ====================

-- 限时优惠
('flash_sale', '限时优惠来袭', '⚡{username}，【{activity_name}】限时特惠！{discount_info}，仅限{time_limit}，错过等一年！', 'warning', 2, 'all', '["username", "activity_name", "discount_info", "time_limit"]', '限时优惠活动', TRUE),

-- 新服务上线
('new_service_launch', '新服务上线', '🆕{username}，全新服务【{service_name}】震撼上线！{service_description}，首发特惠{discount}，立即体验>>', 'success', 1, 'all', '["username", "service_name", "service_description", "discount"]', '新服务上线通知', TRUE),

-- 节日活动
('festival_activity', '节日活动', '🎊{username}，{festival_name}到了！平台推出{activity_name}活动，{benefits}，快来参加吧！', 'info', 2, 'all', '["username", "festival_name", "activity_name", "benefits"]', '节日活动通知', TRUE),

-- 专属优惠
('exclusive_offer', '专属优惠', '👑尊贵的{username}，作为我们的{user_level}用户，您获得专属优惠：{offer_details}，有效期至{expire_date}。', 'success', 1, 'all', '["username", "user_level", "offer_details", "expire_date"]', '用户专属优惠', TRUE),

-- ==================== 系统提醒模板 ====================

-- 账户余额不足
('balance_low', '账户余额不足', '💳{username}，您的账户余额仅剩{balance}元，为避免影响使用，建议及时充值。', 'warning', 1, 'all', '["username", "balance"]', '余额不足提醒', TRUE),

-- 账户充值成功
('recharge_success', '充值成功', '✅{username}，您已成功充值{amount}元，当前余额{balance}元。感谢您的支持！', 'success', 1, 'all', '["username", "amount", "balance"]', '充值成功通知', TRUE),

-- 评价提醒
('review_reminder', '邀请评价', '💬{username}，您购买的【{service_name}】体验如何？欢迎分享您的感受，帮助更多人做出选择！评价还可获得{reward}积分哦~', 'info', 0, 'all', '["username", "service_name", "reward"]', '邀请用户评价', TRUE),

-- 客服回复
('customer_service_reply', '客服已回复', '👨‍💼{username}，您的问题客服已回复！快来查看回复内容吧。如有其他疑问，欢迎继续咨询。', 'info', 1, 'all', '["username"]', '客服回复通知', TRUE),

-- 测算订阅提醒
('subscription_reminder', '测算订阅提醒', '📅{username}，您订阅的【{subscription_type}】将于{remind_date}更新，不要忘记查看哦！', 'info', 0, 'all', '["username", "subscription_type", "remind_date"]', '测算订阅提醒', TRUE),

-- 收藏服务更新
('favorite_service_update', '收藏的服务有更新', '⭐{username}，您收藏的【{service_name}】有新内容更新！{update_info}，快去看看吧~', 'info', 0, 'all', '["username", "service_name", "update_info"]', '收藏服务更新提醒', TRUE)

ON CONFLICT (name) DO NOTHING;

-- 添加注释
COMMENT ON TABLE notification_templates IS '通知模板表，存储各类业务通知模板';
COMMENT ON COLUMN notification_templates.variables IS '模板变量，JSON数组格式，如["username", "amount"]';
COMMENT ON COLUMN notification_templates.is_system IS '是否为系统预设模板，系统模板只有超级管理员可以编辑';

SELECT 'Business notification templates added successfully!' as status;
SELECT COUNT(*) as total_templates FROM notification_templates;
