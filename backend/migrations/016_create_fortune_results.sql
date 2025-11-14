-- 创建算命结果表
CREATE TABLE IF NOT EXISTS fortune_results (
  id VARCHAR(50) PRIMARY KEY,
  result_id VARCHAR(50) UNIQUE NOT NULL,
  order_id VARCHAR(50),
  user_id VARCHAR(50) NOT NULL,
  fortune_id VARCHAR(50) NOT NULL,
  fortune_type VARCHAR(50) NOT NULL,

  -- 用户输入的参数（JSON格式）
  input_data JSONB NOT NULL,

  -- 算命结果数据（JSON格式）
  result_data JSONB NOT NULL,

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fortune_results_user_id ON fortune_results(user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_results_order_id ON fortune_results(order_id);
CREATE INDEX IF NOT EXISTS idx_fortune_results_result_id ON fortune_results(result_id);
CREATE INDEX IF NOT EXISTS idx_fortune_results_created_at ON fortune_results(created_at DESC);

-- 添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_fortune_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fortune_results_updated_at
  BEFORE UPDATE ON fortune_results
  FOR EACH ROW
  EXECUTE FUNCTION update_fortune_results_updated_at();

-- 添加注释
COMMENT ON TABLE fortune_results IS '算命结果表';
COMMENT ON COLUMN fortune_results.result_id IS '结果ID（用于URL）';
COMMENT ON COLUMN fortune_results.input_data IS '用户输入参数（生日、姓名等）';
COMMENT ON COLUMN fortune_results.result_data IS '算命结果数据（生肖、运势、幸运色等）';
