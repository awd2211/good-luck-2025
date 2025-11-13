-- 算命平台数据库初始化脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    register_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    order_count INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
    last_login_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manager',
    email VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    fortune_type VARCHAR(50) NOT NULL,
    fortune_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    pay_method VARCHAR(50),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details TEXT,
    ip VARCHAR(50),
    user_agent TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建横幅管理表
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(200),
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    bg_color VARCHAR(50) DEFAULT '#ff6b6b',
    text_color VARCHAR(50) DEFAULT '#ffffff',
    position INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建通知管理表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    priority INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    target VARCHAR(50) DEFAULT 'all',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_create_time ON orders(create_time);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_banners_status ON banners(status);
CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_start_date ON notifications(start_date);

-- 插入初始管理员数据
INSERT INTO admins (id, username, password, role, email) VALUES
('admin-001', 'admin', '$2b$10$0fttsSN43e.V7bcEHl501u7oTP5xkPE7mVznH9zXLjxjrJW273izG', 'super_admin', 'admin@fortune.com'),
('admin-002', 'manager', '$2b$10$.57lFyMMtKdSoLu/tqZ74u.3ghH4BxmtsGU0oHgoLZWq0RoSwxQtu', 'manager', 'manager@fortune.com'),
('admin-003', 'editor', '$2b$10$K/uTnDLlckDUcN5X8PHdUef/um6zUWr.1wnkbEpX7aXoFdzWD.S1.', 'editor', 'editor@fortune.com'),
('admin-004', 'viewer', '$2b$10$KCnrF1jbwRcUM1y0AZCe4Oftjv9Fnsk.EojeKiEAJlQ5jolhnToTW', 'viewer', 'viewer@fortune.com')
ON CONFLICT (username) DO NOTHING;

-- 插入示例用户数据
INSERT INTO users (id, username, phone, email, register_date, status, order_count, total_spent, last_login_date) VALUES
('user-001', '张三', '13800138001', 'zhangsan@example.com', '2024-01-15', 'active', 5, 298.00, '2025-01-10 10:30:00'),
('user-002', '李四', '13800138002', 'lisi@example.com', '2024-02-20', 'active', 3, 178.00, '2025-01-08 15:20:00'),
('user-003', '王五', '13800138003', NULL, '2024-03-10', 'inactive', 1, 58.00, '2024-12-01 09:15:00')
ON CONFLICT (id) DO NOTHING;

-- 插入示例订单数据
INSERT INTO orders (id, order_id, user_id, username, fortune_type, fortune_name, amount, status, pay_method, create_time, update_time) VALUES
('order-001', 'ORD20250113001', 'user-001', '张三', 'birth-animal', '生肖运势', 58.00, 'completed', '微信支付', '2025-01-13 10:30:00', '2025-01-13 10:31:00'),
('order-002', 'ORD20250113002', 'user-002', '李四', 'bazi', '八字精批', 88.00, 'completed', '支付宝', '2025-01-13 11:20:00', '2025-01-13 11:22:00'),
('order-003', 'ORD20250113003', 'user-001', '张三', 'marriage', '八字合婚', 128.00, 'pending', NULL, '2025-01-13 14:15:00', '2025-01-13 14:15:00')
ON CONFLICT (id) DO NOTHING;

-- 插入示例横幅数据
INSERT INTO banners (title, subtitle, image_url, bg_color, text_color, position, status, start_date) VALUES
('2025蛇年运势', '新年大吉 运势亨通', NULL, '#ff6b6b', '#ffffff', 1, 'active', '2025-01-01 00:00:00'),
('八字精批特惠', '限时优惠 专业解读', NULL, '#4ecdc4', '#ffffff', 2, 'active', '2025-01-01 00:00:00'),
('姻缘分析', '测算你的桃花运', NULL, '#f7b731', '#ffffff', 3, 'active', '2025-01-01 00:00:00');

-- 插入示例通知数据
INSERT INTO notifications (title, content, type, priority, status, target, start_date, created_by) VALUES
('系统维护通知', '本平台将于今晚23:00-01:00进行系统维护，请提前做好准备。', 'warning', 1, 'active', 'all', '2025-01-13 00:00:00', 'admin-001'),
('新功能上线', '我们上线了紫微斗数功能，欢迎体验！', 'info', 0, 'active', 'all', '2025-01-10 00:00:00', 'admin-001');

-- 插入示例审计日志
INSERT INTO audit_logs (id, user_id, username, action, resource, details, ip, user_agent, status, timestamp) VALUES
('audit-001', 'admin-001', 'admin', '登录', '管理后台', '管理员登录系统', '192.168.1.100', 'Mozilla/5.0', 'success', '2025-01-13 09:00:00'),
('audit-002', 'admin-001', 'admin', '更新', '用户管理', '更新用户状态: user-001', '192.168.1.100', NULL, 'success', '2025-01-13 09:15:00'),
('audit-003', 'admin-002', 'manager', '查看', '订单管理', '查看订单列表', '192.168.1.101', NULL, 'success', '2025-01-13 10:30:00')
ON CONFLICT (id) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表创建更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 完成
SELECT 'Database initialization completed!' as status;
