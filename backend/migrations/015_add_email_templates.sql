-- 创建邮件模板表
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(200) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- password_reset, 2fa_enabled, test_email, custom
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  variables TEXT[], -- 支持的变量列表，如 ['username', 'resetUrl', 'token']
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- 系统模板不可删除
  enabled BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_enabled ON email_templates(enabled);

-- 插入默认邮件模板
INSERT INTO email_templates (template_key, template_name, template_type, subject, html_content, variables, description, is_system, created_by)
VALUES
-- 密码重置模板
('password_reset', '密码重置邮件', 'password_reset', '密码重置请求',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1890ff;">密码重置请求</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resetUrl}}"
       style="background-color: #1890ff; color: white; padding: 12px 30px;
              text-decoration: none; border-radius: 4px; display: inline-block;">
      重置密码
    </a>
  </div>
  <p>或者复制以下链接到浏览器：</p>
  <p style="word-break: break-all; color: #666;">{{resetUrl}}</p>
  <p style="color: #999; font-size: 12px; margin-top: 30px;">
    ⚠️ 此链接将在1小时后过期。<br>
    如果您没有请求重置密码，请忽略此邮件。
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2025 算命平台管理后台. All rights reserved.
  </p>
</div>',
ARRAY['username', 'resetUrl'], '密码重置请求邮件模板', true, 'system'),

-- 2FA启用通知模板
('2fa_enabled', '2FA启用通知', '2fa_enabled', '双因素认证已启用',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #52c41a;">双因素认证已启用</h2>
  <p>您好，<strong>{{username}}</strong>！</p>
  <p>您的账户已成功启用双因素认证(2FA)。</p>
  <p>从现在开始，登录时您需要输入：</p>
  <ul>
    <li>用户名和密码</li>
    <li>6位动态验证码（来自身份验证器应用）</li>
  </ul>
  <p style="color: #faad14;">⚠️ 请妥善保管您的备用恢复代码，以防手机丢失。</p>
  <p style="color: #999; font-size: 12px; margin-top: 30px;">
    如果这不是您的操作，请立即联系管理员。
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2025 算命平台管理后台. All rights reserved.
  </p>
</div>',
ARRAY['username', 'email'], '双因素认证启用通知邮件模板', true, 'system'),

-- 测试邮件模板
('test_email', 'SMTP测试邮件', 'test_email', 'SMTP配置测试邮件',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #52c41a;">✅ SMTP配置测试成功</h2>
  <p>恭喜！您的SMTP邮件服务配置正确，邮件发送功能正常。</p>
  <p>此邮件用于测试以下功能：</p>
  <ul>
    <li>✉️ 密码重置邮件</li>
    <li>🔐 双因素认证通知</li>
    <li>📢 系统通知邮件</li>
  </ul>
  <p style="color: #999; font-size: 12px; margin-top: 30px;">
    测试时间: {{testTime}}
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2025 算命平台管理后台. All rights reserved.
  </p>
</div>',
ARRAY['testTime'], 'SMTP配置测试邮件模板', true, 'system')
ON CONFLICT (template_key) DO NOTHING;

-- 更新触发器
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_email_templates_updated_at();
