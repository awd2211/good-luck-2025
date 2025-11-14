-- 创建操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_search ON audit_logs USING gin(to_tsvector('simple',
  COALESCE(username, '') || ' ' ||
  COALESCE(action, '') || ' ' ||
  COALESCE(resource, '') || ' ' ||
  COALESCE(details, '')
));

-- 创建归档表
CREATE TABLE IF NOT EXISTS audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- 添加注释
COMMENT ON TABLE audit_logs IS '操作日志表';
COMMENT ON COLUMN audit_logs.user_id IS '用户ID';
COMMENT ON COLUMN audit_logs.username IS '用户名';
COMMENT ON COLUMN audit_logs.action IS '操作类型(登录/创建/更新/删除/查看)';
COMMENT ON COLUMN audit_logs.resource IS '操作资源(用户管理/订单管理等)';
COMMENT ON COLUMN audit_logs.resource_id IS '资源ID';
COMMENT ON COLUMN audit_logs.details IS '详细信息';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '浏览器信息';
COMMENT ON COLUMN audit_logs.request_method IS 'HTTP方法(GET/POST/PUT/DELETE)';
COMMENT ON COLUMN audit_logs.request_url IS '请求URL';
COMMENT ON COLUMN audit_logs.request_body IS '请求体(JSON)';
COMMENT ON COLUMN audit_logs.response_status IS 'HTTP响应状态码';
COMMENT ON COLUMN audit_logs.response_time IS '响应时间(毫秒)';
COMMENT ON COLUMN audit_logs.status IS '状态(success/failed/warning)';
COMMENT ON COLUMN audit_logs.level IS '日志等级(info/warning/error)';
COMMENT ON COLUMN audit_logs.created_at IS '创建时间';

-- 插入一些示例数据
INSERT INTO audit_logs (user_id, username, action, resource, details, ip_address, status, level) VALUES
('admin-001', 'admin', '登录', '管理后台', '管理员登录系统', '192.168.1.100', 'success', 'info'),
('admin-001', 'admin', '查看', '用户管理', '查看用户列表', '192.168.1.100', 'success', 'info'),
('admin-001', 'admin', '更新', '用户管理', '更新用户状态: user-001', '192.168.1.100', 'success', 'warning'),
('admin-eee46f44', 'cs_manager_test', '登录', '管理后台', '客服主管登录系统', '192.168.1.101', 'success', 'info'),
('admin-9b3dfa51', 'cs_agent_test', '查看', '客服工作台', '查看会话列表', '192.168.1.102', 'success', 'info');
