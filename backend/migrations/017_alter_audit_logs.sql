-- 添加缺失的字段到audit_logs表
-- 先删除旧表,重新创建完整的表结构
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS audit_logs_archive CASCADE;

-- 创建完整的audit_logs表
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  request_method VARCHAR(10),
  request_url TEXT,
  request_body TEXT,
  response_status INTEGER,
  response_time INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  level VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_level ON audit_logs(level);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_username ON audit_logs(username);

-- 创建全文搜索索引
CREATE INDEX idx_audit_logs_search ON audit_logs USING gin(to_tsvector('simple',
  COALESCE(username, '') || ' ' ||
  COALESCE(action, '') || ' ' ||
  COALESCE(resource, '') || ' ' ||
  COALESCE(details, '')
));

-- 创建归档表
CREATE TABLE audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- 插入示例数据
INSERT INTO audit_logs (user_id, username, action, resource, resource_id, details, ip_address, user_agent, request_method, request_url, response_status, response_time, status, level) VALUES
('admin-001', 'admin', '登录', '管理后台', NULL, '管理员登录系统', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'POST', '/api/manage/auth/login', 200, 145, 'success', 'info'),
('admin-001', 'admin', '查看', '用户管理', NULL, '查看用户列表', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'GET', '/api/manage/users', 200, 89, 'success', 'info'),
('admin-001', 'admin', '更新', '用户管理', 'user-001', '更新用户状态', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'PUT', '/api/manage/users/user-001', 200, 234, 'success', 'warning'),
('admin-001', 'admin', '删除', '横幅管理', 'banner-5', '删除横幅', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'DELETE', '/api/manage/banners/5', 200, 178, 'success', 'warning'),
('admin-eee46f44', 'cs_manager_test', '登录', '管理后台', NULL, '客服主管登录系统', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36', 'POST', '/api/manage/auth/login', 200, 156, 'success', 'info'),
('admin-eee46f44', 'cs_manager_test', '查看', '客服管理', NULL, '查看客服列表', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36', 'GET', '/api/manage/cs/agents', 200, 67, 'success', 'info'),
('admin-9b3dfa51', 'cs_agent_test', '登录', '管理后台', NULL, '客服专员登录系统', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0', 'POST', '/api/manage/auth/login', 200, 198, 'success', 'info'),
('admin-9b3dfa51', 'cs_agent_test', '查看', '客服工作台', NULL, '查看会话列表', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0', 'GET', '/api/cs/sessions', 200, 112, 'success', 'info'),
('admin-001', 'admin', '创建', '优惠券管理', 'coupon-new-1', '创建新优惠券', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'POST', '/api/manage/coupons', 201, 267, 'success', 'info'),
('admin-001', 'admin', '查看', '订单管理', NULL, '查看订单列表', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'GET', '/api/manage/orders', 200, 445, 'success', 'info'),
('admin-001', 'admin', '登录', '管理后台', NULL, '登录失败:密码错误', '192.168.1.120', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'POST', '/api/manage/auth/login', 401, 95, 'failed', 'error'),
('admin-001', 'admin', '更新', '系统配置', 'config-smtp', '修改SMTP配置', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'PUT', '/api/manage/system-configs/smtp', 200, 321, 'success', 'warning');
