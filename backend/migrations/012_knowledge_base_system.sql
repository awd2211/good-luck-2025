-- 知识库管理系统
-- 包含: 知识分类、知识文档、常见问题(FAQ)

-- =====================================================
-- 1. 知识分类表 (Knowledge Categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_cat_parent ON knowledge_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cat_active ON knowledge_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_cat_sort ON knowledge_categories(sort_order);

COMMENT ON TABLE knowledge_categories IS '知识库分类表,支持多级分类';

-- =====================================================
-- 2. 知识文档表 (Knowledge Articles)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,  -- 有帮助投票数
  not_helpful_count INTEGER DEFAULT 0,  -- 无帮助投票数
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,  -- 是否精选
  sort_order INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_article_category ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_published ON knowledge_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_article_featured ON knowledge_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_article_title ON knowledge_articles USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_kb_article_content ON knowledge_articles USING gin(to_tsvector('english', content));

COMMENT ON TABLE knowledge_articles IS '知识文档表';
COMMENT ON COLUMN knowledge_articles.helpful_count IS '有帮助投票数';

-- =====================================================
-- 3. 常见问题表 (FAQs)
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faq_category ON faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_published ON faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_faq_tags ON faqs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_faq_question ON faqs USING gin(to_tsvector('english', question));

COMMENT ON TABLE faqs IS '常见问题表';

-- =====================================================
-- 4. 知识反馈表 (Knowledge Feedback)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_feedback (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  faq_id INTEGER REFERENCES faqs(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  is_helpful BOOLEAN NOT NULL,  -- true=有帮助, false=无帮助
  comment TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_feedback_target CHECK (
    (article_id IS NOT NULL AND faq_id IS NULL) OR
    (article_id IS NULL AND faq_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_kb_feedback_article ON knowledge_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_faq ON knowledge_feedback(faq_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_user ON knowledge_feedback(user_id);

COMMENT ON TABLE knowledge_feedback IS '知识库反馈表';

-- =====================================================
-- 5. 知识库搜索历史表 (Search History)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_search_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  query VARCHAR(500) NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_article_id INTEGER REFERENCES knowledge_articles(id) ON DELETE SET NULL,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_search_user ON knowledge_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_search_query ON knowledge_search_history(query);
CREATE INDEX IF NOT EXISTS idx_kb_search_created ON knowledge_search_history(created_at);

COMMENT ON TABLE knowledge_search_history IS '知识库搜索历史表,用于分析用户搜索行为';

-- =====================================================
-- 触发器: 自动更新时间戳
-- =====================================================
CREATE OR REPLACE FUNCTION update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_categories_updated_at
  BEFORE UPDATE ON knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION update_kb_updated_at();

CREATE TRIGGER trigger_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION update_kb_updated_at();

CREATE TRIGGER trigger_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_kb_updated_at();
