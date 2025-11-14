-- 014_add_2fa_and_password_reset.sql
-- 添加2FA和密码重置功能

-- 1. 在admins表中添加2FA相关字段
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[];

-- 2. 创建密码重置令牌表
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  admin_id VARCHAR(50) NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_admin_id ON password_reset_tokens(admin_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 添加注释
COMMENT ON TABLE password_reset_tokens IS '密码重置令牌表';
COMMENT ON COLUMN admins.two_factor_enabled IS '是否启用双因素认证';
COMMENT ON COLUMN admins.two_factor_secret IS 'TOTP密钥';
COMMENT ON COLUMN admins.two_factor_backup_codes IS '备用恢复代码';
