-- AI模型配置表
CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- openai, grok, qwen
  model_name VARCHAR(100) NOT NULL, -- gpt-4, grok-beta, qwen-plus等
  api_key TEXT NOT NULL,
  api_base_url TEXT,
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  top_p DECIMAL(3,2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
  presence_penalty DECIMAL(3,2) DEFAULT 0.0,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, model_name)
);

-- AI模型使用记录表
CREATE TABLE IF NOT EXISTS ai_model_usage_logs (
  id SERIAL PRIMARY KEY,
  model_id INTEGER REFERENCES ai_models(id) ON DELETE CASCADE,
  user_id VARCHAR(50),
  service_code VARCHAR(50),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost DECIMAL(10,4),
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_default ON ai_models(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model_id ON ai_model_usage_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_model_usage_logs(created_at);

-- 添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_ai_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_models_updated_at_trigger
BEFORE UPDATE ON ai_models
FOR EACH ROW
EXECUTE FUNCTION update_ai_models_updated_at();

-- 插入默认配置
INSERT INTO ai_models (name, provider, model_name, api_key, api_base_url, system_prompt, is_default, priority)
VALUES
  ('GPT-4', 'openai', 'gpt-4', 'sk-your-openai-key', 'https://api.openai.com/v1', '你是一位专业的算命大师，精通八字、紫微斗数、周易等传统命理学。请根据用户提供的信息，给出详细、专业、有洞察力的分析。', false, 100),
  ('GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'sk-your-openai-key', 'https://api.openai.com/v1', '你是一位专业的算命大师，精通八字、紫微斗数、周易等传统命理学。请根据用户提供的信息，给出详细、专业、有洞察力的分析。', true, 90),
  ('Grok Beta', 'grok', 'grok-beta', 'xai-your-grok-key', 'https://api.x.ai/v1', '你是一位专业的算命大师，精通八字、紫微斗数、周易等传统命理学。请根据用户提供的信息，给出详细、专业、有洞察力的分析。', false, 80),
  ('Qwen3 Plus', 'qwen', 'qwen-plus', 'sk-your-qwen-key', 'https://dashscope.aliyuncs.com/api/v1', '你是一位专业的算命大师，精通八字、紫微斗数、周易等传统命理学。请根据用户提供的信息，给出详细、专业、有洞察力的分析。', false, 70),
  ('Qwen3 Turbo', 'qwen', 'qwen-turbo', 'sk-your-qwen-key', 'https://dashscope.aliyuncs.com/api/v1', '你是一位专业的算命大师，精通八字、紫微斗数、周易等传统命理学。请根据用户提供的信息，给出详细、专业、有洞察力的分析。', false, 60)
ON CONFLICT (provider, model_name) DO NOTHING;
