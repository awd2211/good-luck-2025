-- ============================================================================
-- 管理员邀请系统
-- ============================================================================

-- 管理员邀请表
CREATE TABLE IF NOT EXISTS admin_invitations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  invited_by VARCHAR(50) NOT NULL REFERENCES admins(username) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  CONSTRAINT chk_role CHECK (role IN ('super_admin', 'admin', 'manager', 'operator', 'viewer'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON admin_invitations(status);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_expires_at ON admin_invitations(expires_at);

-- 注释
COMMENT ON TABLE admin_invitations IS '管理员邀请记录表';
COMMENT ON COLUMN admin_invitations.email IS '受邀者邮箱';
COMMENT ON COLUMN admin_invitations.username IS '受邀者用户名';
COMMENT ON COLUMN admin_invitations.role IS '受邀者角色';
COMMENT ON COLUMN admin_invitations.invitation_token IS '邀请令牌（用于验证链接）';
COMMENT ON COLUMN admin_invitations.invited_by IS '邀请人用户名';
COMMENT ON COLUMN admin_invitations.expires_at IS '邀请过期时间';
COMMENT ON COLUMN admin_invitations.status IS '邀请状态';
