-- ============================================================================
-- 邮件模板系统增强
-- ============================================================================

-- 删除旧的邮件模板表（如果存在）
DROP TABLE IF EXISTS email_templates CASCADE;

-- 创建新的邮件模板表
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- admin, user, system, marketing
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  description TEXT,
  variables JSONB DEFAULT '[]', -- 可用变量列表，如 ["username", "code", "url"]
  enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- 是否为系统模板（不可删除）
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sent_at TIMESTAMP,
  sent_count INTEGER DEFAULT 0,
  CONSTRAINT chk_category CHECK (category IN ('admin', 'user', 'system', 'marketing'))
);

-- 索引
CREATE INDEX idx_email_templates_key ON email_templates(template_key);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_enabled ON email_templates(enabled);

-- 邮件发送记录表
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- 索引
CREATE INDEX idx_email_logs_template ON email_logs(template_key);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- 插入系统默认模板
INSERT INTO email_templates (template_key, name, category, subject, html_content, description, variables, is_system, enabled) VALUES

-- ==================== 管理员相关模板 ====================
('admin_password_reset', '管理员密码重置', 'admin', '密码重置请求',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1890ff;">密码重置请求</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resetUrl}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">重置密码</a>
  </div>
  <p>或者复制以下链接到浏览器：</p>
  <p style="word-break: break-all; color: #666;">{{resetUrl}}</p>
  <p style="color: #999; font-size: 12px; margin-top: 30px;">⚠️ 此链接将在1小时后过期。<br>如果您没有请求重置密码，请忽略此邮件。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY 管理后台. All rights reserved.</p>
</div>',
'管理员密码重置邮件模板',
'["username", "resetUrl"]',
true, true),

('admin_2fa_enabled', '管理员2FA启用通知', 'admin', '双因素认证已启用',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #52c41a;">双因素认证已启用</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>您的账户已成功启用双因素认证(2FA)。</p>
  <p>从现在开始，登录时您需要输入：</p>
  <ul><li>用户名和密码</li><li>6位动态验证码（来自身份验证器应用）</li></ul>
  <p style="color: #faad14;">⚠️ 请妥善保管您的备用恢复代码，以防手机丢失。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY 管理后台. All rights reserved.</p>
</div>',
'管理员2FA启用通知邮件模板',
'["username"]',
true, true),

('admin_invitation', '管理员邀请', 'admin', '您收到了管理后台的邀请',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1890ff;">🎉 管理员邀请</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p><strong>{{invitedBy}}</strong> 邀请您加入<strong>LUCK.DAY 管理后台</strong>。</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invitationUrl}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">接受邀请并设置密码</a>
  </div>
  <p>或者复制以下链接到浏览器：</p>
  <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{invitationUrl}}</p>
  <div style="background: #fff7e6; border-left: 4px solid #faad14; padding: 12px; margin: 20px 0;">
    <p style="margin: 0; color: #faad14; font-weight: bold;">⚠️ 重要提示</p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #666;">
      <li>此邀请链接将在<strong>7天</strong>后过期</li>
      <li>接受邀请后，请妥善保管您的登录凭据</li>
    </ul>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY 管理后台. All rights reserved.</p>
</div>',
'管理员邀请邮件模板',
'["username", "invitedBy", "invitationUrl"]',
true, true),

-- ==================== 用户相关模板 ====================
('user_welcome', '用户注册欢迎', 'user', '欢迎加入LUCK.DAY！',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1890ff;">🎉 欢迎加入LUCK.DAY！</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>感谢您注册LUCK.DAY，我们很高兴您的加入！</p>
  <div style="background: #f0f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1890ff;">您可以开始：</h3>
    <ul style="line-height: 1.8;">
      <li>📿 浏览各种算命服务</li>
      <li>🔮 体验每日运势</li>
      <li>⭐ 收藏喜欢的服务</li>
      <li>🎁 领取新人优惠券</li>
    </ul>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{homeUrl}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">开始探索</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'用户注册欢迎邮件模板',
'["username", "homeUrl"]',
true, true),

('user_order_confirmation', '订单确认', 'user', '您的订单已确认',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #52c41a;">✅ 订单确认</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>您的订单已确认，感谢您的购买！</p>
  <div style="background: #f6ffed; border: 1px solid #b7eb8f; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0;"><strong>订单号：</strong>{{orderNo}}</p>
    <p style="margin: 8px 0 0 0;"><strong>服务名称：</strong>{{serviceName}}</p>
    <p style="margin: 8px 0 0 0;"><strong>订单金额：</strong>¥{{amount}}</p>
    <p style="margin: 8px 0 0 0;"><strong>下单时间：</strong>{{orderTime}}</p>
  </div>
  <p>我们将尽快为您准备结果，请耐心等待。</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{orderUrl}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">查看订单详情</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'用户订单确认邮件模板',
'["username", "orderNo", "serviceName", "amount", "orderTime", "orderUrl"]',
true, true),

('user_payment_success', '支付成功通知', 'user', '支付成功！',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #52c41a;">💰 支付成功！</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>您的支付已成功完成。</p>
  <div style="background: #f6ffed; border: 1px solid #b7eb8f; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0;"><strong>订单号：</strong>{{orderNo}}</p>
    <p style="margin: 8px 0 0 0;"><strong>支付金额：</strong>¥{{amount}}</p>
    <p style="margin: 8px 0 0 0;"><strong>支付时间：</strong>{{paymentTime}}</p>
    <p style="margin: 8px 0 0 0;"><strong>支付方式：</strong>{{paymentMethod}}</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{orderUrl}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">查看订单</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'用户支付成功通知邮件模板',
'["username", "orderNo", "amount", "paymentTime", "paymentMethod", "orderUrl"]',
true, true),

('user_refund_notification', '退款通知', 'user', '您的退款已处理',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1890ff;">💸 退款通知</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>您的退款申请已处理完成。</p>
  <div style="background: #e6f7ff; border: 1px solid #91d5ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0;"><strong>订单号：</strong>{{orderNo}}</p>
    <p style="margin: 8px 0 0 0;"><strong>退款金额：</strong>¥{{amount}}</p>
    <p style="margin: 8px 0 0 0;"><strong>退款原因：</strong>{{reason}}</p>
    <p style="margin: 8px 0 0 0;"><strong>处理时间：</strong>{{refundTime}}</p>
  </div>
  <p style="color: #666;">退款将在1-3个工作日内退回您的原支付账户，请注意查收。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'用户退款通知邮件模板',
'["username", "orderNo", "amount", "reason", "refundTime"]',
true, true),

('user_coupon_granted', '优惠券发放', 'user', '您收到了新的优惠券！',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ff4d4f;">🎁 您收到了新的优惠券！</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>恭喜您获得优惠券，快来使用吧！</p>
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0;">{{couponName}}</h3>
    <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">¥{{couponAmount}}</p>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">有效期至：{{expireDate}}</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{shopUrl}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">立即使用</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'用户优惠券发放邮件模板',
'["username", "couponName", "couponAmount", "expireDate", "shopUrl"]',
true, true),

('user_result_ready', '算命结果准备就绪', 'user', '您的{{serviceName}}结果已准备好',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #722ed1;">🔮 您的算命结果已准备好</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>您购买的<strong>{{serviceName}}</strong>服务结果已经准备就绪，快来查看吧！</p>
  <div style="background: #f9f0ff; border: 1px solid #d3adf7; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0;"><strong>订单号：</strong>{{orderNo}}</p>
    <p style="margin: 8px 0 0 0;"><strong>服务名称：</strong>{{serviceName}}</p>
    <p style="margin: 8px 0 0 0;"><strong>完成时间：</strong>{{completeTime}}</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resultUrl}}" style="background-color: #722ed1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">查看结果</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'用户算命结果准备就绪邮件模板',
'["username", "serviceName", "orderNo", "completeTime", "resultUrl"]',
true, true),

-- ==================== 系统通知模板 ====================
('system_maintenance', '系统维护通知', 'system', '系统维护通知',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #faad14;">⚠️ 系统维护通知</h2>
  <p>尊敬的用户：</p>
  <p>为了提供更好的服务，我们将进行系统维护。</p>
  <div style="background: #fff7e6; border: 1px solid #ffd591; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0;"><strong>维护时间：</strong>{{maintenanceTime}}</p>
    <p style="margin: 8px 0 0 0;"><strong>预计时长：</strong>{{duration}}</p>
    <p style="margin: 8px 0 0 0;"><strong>影响范围：</strong>{{scope}}</p>
  </div>
  <p>维护期间，部分功能可能暂时无法使用，给您带来的不便敬请谅解。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'系统维护通知邮件模板',
'["maintenanceTime", "duration", "scope"]',
true, true),

-- ==================== 营销邮件模板 ====================
('marketing_promotion', '促销活动通知', 'marketing', '{{activityName}} - 限时优惠！',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ff4d4f;">🎉 {{activityName}}</h2>
  <p>亲爱的用户：</p>
  <p>{{activityDescription}}</p>
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <h3 style="margin: 0 0 15px 0; font-size: 24px;">{{discountText}}</h3>
    <p style="font-size: 18px; margin: 10px 0;">活动时间：{{activityPeriod}}</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{activityUrl}}" style="background-color: #ff4d4f; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px;">立即参与</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
</div>',
'促销活动通知邮件模板',
'["activityName", "activityDescription", "discountText", "activityPeriod", "activityUrl"]',
false, true);

-- 注释
COMMENT ON TABLE email_templates IS '邮件模板表';
COMMENT ON TABLE email_logs IS '邮件发送记录表';
COMMENT ON COLUMN email_templates.template_key IS '模板唯一标识';
COMMENT ON COLUMN email_templates.category IS '模板分类: admin-管理员, user-用户, system-系统, marketing-营销';
COMMENT ON COLUMN email_templates.variables IS '可用变量列表（JSON数组）';
COMMENT ON COLUMN email_templates.is_system IS '是否为系统模板（不可删除）';
COMMENT ON COLUMN email_logs.status IS '发送状态: pending-待发送, sent-已发送, failed-失败';
