-- 修复客户标签系统的表结构
-- 将customer_tags重命名为user_tags（用户标签关系表）
-- 创建新的customer_tags作为标签模板表

-- =====================================================
-- 1. 重命名现有的customer_tags为user_tags
-- =====================================================
ALTER TABLE IF EXISTS customer_tags RENAME TO user_tags_old;

-- =====================================================
-- 2. 创建新的标签模板表 (customer_tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_tags (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE,  -- 标签名称
  tag_color VARCHAR(20) NOT NULL,  -- 标签颜色 (hex或颜色名)
  description TEXT,  -- 标签描述
  is_active BOOLEAN DEFAULT true,  -- 是否启用
  usage_count INTEGER DEFAULT 0,  -- 使用次数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_name ON customer_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_customer_tags_active ON customer_tags(is_active);

COMMENT ON TABLE customer_tags IS '客户标签模板表';
COMMENT ON COLUMN customer_tags.tag_name IS '标签名称（唯一）';
COMMENT ON COLUMN customer_tags.tag_color IS '标签颜色';
COMMENT ON COLUMN customer_tags.usage_count IS '被分配给用户的次数';

-- =====================================================
-- 3. 创建用户标签关系表 (user_tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_tags (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,  -- 分配人
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, tag_id)  -- 同一用户不能重复分配同一标签
);

CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_assigned ON user_tags(assigned_at);

COMMENT ON TABLE user_tags IS '用户标签关系表';
COMMENT ON COLUMN user_tags.user_id IS '用户ID';
COMMENT ON COLUMN user_tags.tag_id IS '标签ID（外键到customer_tags）';
COMMENT ON COLUMN user_tags.assigned_by IS '分配此标签的管理员ID';

-- =====================================================
-- 4. 迁移旧数据（如果存在）
-- =====================================================
-- 从旧表提取唯一的标签名称，创建标签模板
INSERT INTO customer_tags (tag_name, tag_color, description, is_active)
SELECT DISTINCT
  tag_name,
  COALESCE(color, '#1890ff') as tag_color,  -- 如果没有颜色，使用默认蓝色
  '从旧系统迁移' as description,
  true as is_active
FROM user_tags_old
WHERE tag_name IS NOT NULL
ON CONFLICT (tag_name) DO NOTHING;

-- 更新usage_count
UPDATE customer_tags ct
SET usage_count = (
  SELECT COUNT(*)
  FROM user_tags_old uto
  WHERE uto.tag_name = ct.tag_name
);

-- 迁移用户标签关系（需要先查找对应的tag_id）
INSERT INTO user_tags (user_id, tag_id, assigned_at)
SELECT
  uto.user_id,
  ct.id as tag_id,
  uto.created_at as assigned_at
FROM user_tags_old uto
JOIN customer_tags ct ON uto.tag_name = ct.tag_name
ON CONFLICT (user_id, tag_id) DO NOTHING;

-- =====================================================
-- 5. 创建更新触发器
-- =====================================================
-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_customer_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_tags_updated_at
BEFORE UPDATE ON customer_tags
FOR EACH ROW
EXECUTE FUNCTION update_customer_tags_updated_at();

-- 自动更新usage_count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customer_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customer_tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_tags_usage_count
AFTER INSERT OR DELETE ON user_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

-- =====================================================
-- 6. 插入一些预设标签
-- =====================================================
INSERT INTO customer_tags (tag_name, tag_color, description, is_active) VALUES
  ('VIP客户', '#FFD700', '高价值VIP客户', true),
  ('潜在客户', '#1890ff', '有购买潜力的客户', true),
  ('活跃用户', '#52c41a', '近期活跃的用户', true),
  ('问题客户', '#f5222d', '需要特别关注的客户', true),
  ('新用户', '#13c2c2', '新注册用户', true),
  ('老客户', '#722ed1', '长期使用的老客户', true)
ON CONFLICT (tag_name) DO NOTHING;

-- =====================================================
-- 7. 完成迁移后可以选择删除旧表
-- =====================================================
-- DROP TABLE IF EXISTS user_tags_old;  -- 确认数据迁移成功后再执行
