-- 综合迁移: 客服排班、培训系统、客户画像、性能优化索引

-- =====================================================
-- 1. 客服排班系统
-- =====================================================
CREATE TABLE IF NOT EXISTS cs_schedules (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_type VARCHAR(20) NOT NULL, -- morning, afternoon, night, full_day
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, schedule_date, shift_type)
);

CREATE INDEX IF NOT EXISTS idx_cs_schedule_agent ON cs_schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_schedule_date ON cs_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_cs_schedule_active ON cs_schedules(is_active);

-- 调班请求表
CREATE TABLE IF NOT EXISTS schedule_swap_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
  target_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
  requester_schedule_id INTEGER NOT NULL REFERENCES cs_schedules(id) ON DELETE CASCADE,
  target_schedule_id INTEGER NOT NULL REFERENCES cs_schedules(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_swap_requester ON schedule_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_target ON schedule_swap_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_swap_status ON schedule_swap_requests(status);

-- =====================================================
-- 2. 培训系统
-- =====================================================
CREATE TABLE IF NOT EXISTS training_courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT,
  category VARCHAR(50),
  duration_minutes INTEGER,
  passing_score INTEGER DEFAULT 80,
  is_mandatory BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_category ON training_courses(category);
CREATE INDEX IF NOT EXISTS idx_training_published ON training_courses(is_published);

-- 培训材料表
CREATE TABLE IF NOT EXISTS training_materials (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  material_type VARCHAR(20) NOT NULL, -- video, document, link, quiz
  content TEXT,
  file_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_material_course ON training_materials(course_id);

-- 培训记录表
CREATE TABLE IF NOT EXISTS training_records (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  score INTEGER,
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, failed
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_record_agent ON training_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_training_record_course ON training_records(course_id);
CREATE INDEX IF NOT EXISTS idx_training_record_status ON training_records(status);

-- 考核题目表
CREATE TABLE IF NOT EXISTS training_quizzes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice', -- multiple_choice, true_false, essay
  options JSONB, -- [{text: "选项A", correct: true}, ...]
  correct_answer TEXT,
  points INTEGER DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_course ON training_quizzes(course_id);

-- =====================================================
-- 3. 客户画像系统
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_satisfaction_rating DECIMAL(3,2),
  last_contact_at TIMESTAMP,
  preferred_agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE SET NULL,
  vip_level INTEGER DEFAULT 0, -- 0=普通, 1-5=VIP等级
  risk_score INTEGER DEFAULT 0, -- 风险评分 0-100
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  tags_summary JSONB, -- {VIP: true, 投诉: false, ...}
  notes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_vip ON customer_profiles(vip_level);
CREATE INDEX IF NOT EXISTS idx_profile_risk ON customer_profiles(risk_score);
CREATE INDEX IF NOT EXISTS idx_profile_last_contact ON customer_profiles(last_contact_at);

-- 客户行为日志表
CREATE TABLE IF NOT EXISTS customer_behavior_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- session_start, message_sent, satisfaction_rated, etc.
  action_detail JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_behavior_user ON customer_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_type ON customer_behavior_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_behavior_created ON customer_behavior_logs(created_at);

-- =====================================================
-- 4. 性能优化 - 额外索引
-- =====================================================

-- 会话表索引优化
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON chat_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_status ON chat_sessions(agent_id, status) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_status ON chat_sessions(created_at DESC, status);

-- 消息表索引优化（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_type, sender_id);
  END IF;
END $$;

-- 客服代理表索引优化
CREATE INDEX IF NOT EXISTS idx_cs_agents_online ON customer_service_agents(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_cs_agents_status ON customer_service_agents(status);

-- 满意度评价索引优化
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_satisfaction_ratings') THEN
    CREATE INDEX IF NOT EXISTS idx_satisfaction_created_rating ON chat_satisfaction_ratings(created_at DESC, rating);
  END IF;
END $$;

-- 质检记录索引优化
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_quality_inspections') THEN
    CREATE INDEX IF NOT EXISTS idx_quality_created_score ON chat_quality_inspections(created_at DESC, overall_score);
  END IF;
END $$;

-- =====================================================
-- 5. 触发器和函数
-- =====================================================

-- 自动更新客户画像
CREATE OR REPLACE FUNCTION update_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_profiles (user_id, total_sessions, last_contact_at)
  VALUES (NEW.user_id, 1, NEW.created_at)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_sessions = customer_profiles.total_sessions + 1,
    last_contact_at = NEW.created_at,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_on_session
  AFTER INSERT ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_profile();

-- 更新排班时间戳
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cs_schedule_updated
  BEFORE UPDATE ON cs_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_timestamp();

CREATE TRIGGER trigger_training_course_updated
  BEFORE UPDATE ON training_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_timestamp();

CREATE TRIGGER trigger_customer_profile_updated
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_timestamp();

-- =====================================================
-- 6. 初始数据
-- =====================================================

-- 插入示例培训课程
INSERT INTO training_courses (title, description, category, duration_minutes, is_mandatory, is_published, created_by)
VALUES
  ('客服基础培训', '客服人员必修的基础知识和技能培训', 'basic', 120, true, true, 'system'),
  ('沟通技巧提升', '提升客服沟通能力和服务质量', 'communication', 90, false, true, 'system'),
  ('系统操作指南', '客服系统使用方法和技巧', 'system', 60, true, true, 'system')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE cs_schedules IS '客服排班表';
COMMENT ON TABLE schedule_swap_requests IS '调班请求表';
COMMENT ON TABLE training_courses IS '培训课程表';
COMMENT ON TABLE training_records IS '培训记录表';
COMMENT ON TABLE customer_profiles IS '客户画像表';
COMMENT ON TABLE customer_behavior_logs IS '客户行为日志表';
