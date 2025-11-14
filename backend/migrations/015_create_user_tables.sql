-- 用户端功能表迁移
-- 创建购物车、收藏、浏览历史、算命服务表

-- 1. 添加用户表缺失的字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0;

-- 2. 创建算命服务表
CREATE TABLE IF NOT EXISTS fortunes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- birth-animal, bazi, name, marriage, yearly
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url VARCHAR(500),
    icon VARCHAR(100),
    is_popular BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 5.0,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建购物车表
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    fortune_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE CASCADE,
    UNIQUE(user_id, fortune_id)
);

-- 4. 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    fortune_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE CASCADE,
    UNIQUE(user_id, fortune_id)
);

-- 5. 创建浏览历史表
CREATE TABLE IF NOT EXISTS browse_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    fortune_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fortunes_category ON fortunes(category);
CREATE INDEX IF NOT EXISTS idx_fortunes_status ON fortunes(status);
CREATE INDEX IF NOT EXISTS idx_fortunes_is_popular ON fortunes(is_popular);
CREATE INDEX IF NOT EXISTS idx_fortunes_is_recommended ON fortunes(is_recommended);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_browse_history_user_id ON browse_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browse_history_created_at ON browse_history(created_at);

-- 为新表创建更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_fortunes_updated_at
    BEFORE UPDATE ON fortunes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_browse_history_updated_at
    BEFORE UPDATE ON browse_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例算命服务数据
INSERT INTO fortunes (name, category, description, price, original_price, icon, is_popular, is_recommended, sort_order) VALUES
('生肖运势', 'birth-animal', '根据您的生肖，为您详细解读今年的运势走向', 58.00, 88.00, '🐉', true, true, 1),
('八字精批', 'bazi', '专业命理师根据生辰八字，精准批算您的命运轨迹', 88.00, 128.00, '📅', true, true, 2),
('流年运势', 'yearly', '分析全年各方面运势，把握机遇，规避风险', 68.00, 98.00, '📊', true, false, 3),
('姓名测算', 'name', '姓名学五格剖象法，分析您的姓名吉凶', 48.00, 68.00, '✍️', false, true, 4),
('八字合婚', 'marriage', '根据双方八字分析婚姻匹配度，助您美满婚姻', 128.00, 188.00, '💑', true, true, 5),
('事业运势', 'career', '分析事业发展方向，助您步步高升', 78.00, 108.00, '💼', false, false, 6),
('财运分析', 'wealth', '详解财运走势，把握财富机遇', 88.00, 118.00, '💰', false, true, 7),
('桃花运势', 'romance', '分析感情运势，助您早日脱单', 58.00, 88.00, '🌸', false, false, 8)
ON CONFLICT DO NOTHING;

-- 完成
SELECT 'User tables migration completed!' as status;
