-- 创建订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  fortune_id VARCHAR(50) NOT NULL,
  fortune_name VARCHAR(100) NOT NULL,
  fortune_type VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  fortune_result_id VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE SET NULL,
  FOREIGN KEY (fortune_result_id) REFERENCES fortune_results(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fortune_id ON order_items(fortune_id);

-- 添加触发器自动更新 updated_at
CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_fortune_results_updated_at();

-- 添加注释
COMMENT ON TABLE order_items IS '订单项明细表';
COMMENT ON COLUMN order_items.fortune_result_id IS '关联的算命结果ID';
