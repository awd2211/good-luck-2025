-- ============================================================================
-- 邮箱注册登录体系
-- ============================================================================

-- 1. 修改 users 表，添加邮箱相关字段
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

-- 将 phone 字段改为可选（如果还是必填的话）
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 2. 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register', 'login', 'reset_password')),
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_codes_lookup ON email_verification_codes(email, code, is_used);
CREATE INDEX IF NOT EXISTS idx_email_codes_expires ON email_verification_codes(expires_at);

-- 3. 更新现有用户数据（为测试用户添加邮箱）
-- 注意：这只是为了兼容现有数据，实际生产环境需要用户自己绑定邮箱
UPDATE users
SET email = CONCAT('user_', id, '@luck.day'),
    nickname = COALESCE(nickname, username, CONCAT('用户', SUBSTRING(id, 1, 8))),
    email_verified = false
WHERE email IS NULL;

-- 4. 添加约束（在更新数据后）
ALTER TABLE users
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN nickname SET NOT NULL;

-- 5. 添加注释
COMMENT ON TABLE email_verification_codes IS '邮箱验证码表';
COMMENT ON COLUMN email_verification_codes.email IS '邮箱地址';
COMMENT ON COLUMN email_verification_codes.code IS '6位验证码';
COMMENT ON COLUMN email_verification_codes.purpose IS '用途: register-注册, login-登录, reset_password-重置密码';
COMMENT ON COLUMN email_verification_codes.expires_at IS '过期时间（5分钟后）';
COMMENT ON COLUMN email_verification_codes.is_used IS '是否已使用';

COMMENT ON COLUMN users.email IS '用户邮箱（唯一）';
COMMENT ON COLUMN users.nickname IS '用户昵称';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.avatar IS '头像URL';
