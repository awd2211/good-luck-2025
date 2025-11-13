-- 插入算命分类数据
INSERT INTO fortune_categories (name, code, icon, description, sort_order, status) VALUES
('八字算命', 'bazi', '🔮', '根据出生年月日时推算命理', 1, 'active'),
('生肖运势', 'zodiac', '🐉', '十二生肖运势分析', 2, 'active'),
('星座占卜', 'constellation', '⭐', '西方星座运势预测', 3, 'active'),
('姓名分析', 'name', '✍️', '姓名学五格剖象', 4, 'active'),
('婚恋配对', 'marriage', '💕', '姻缘配对与感情分析', 5, 'active'),
('事业财运', 'career', '💼', '事业发展与财富运势', 6, 'active')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 插入算命服务数据
INSERT INTO fortune_services (category_id, name, code, subtitle, description, original_price, current_price, vip_price, status, is_hot, is_new, is_recommended, sort_order, view_count, order_count, rating) VALUES
-- 八字算命
((SELECT id FROM fortune_categories WHERE code = 'bazi'), '八字精批', 'bazi_detail', '深度解析命理运势', '根据您的出生年月日时，精准推算八字命盘，深度解析性格特点、事业财运、感情婚姻、健康状况等各方面运势', 99.00, 39.90, 29.90, 'active', true, false, true, 1, 1256, 892, 4.8),
((SELECT id FROM fortune_categories WHERE code = 'bazi'), '流年运势', 'bazi_year', '全年运势详批', '根据八字推算全年运势走向，分析事业、财运、感情、健康等各方面的月度变化趋势', 68.00, 29.90, 19.90, 'active', true, false, true, 2, 856, 623, 4.7),
((SELECT id FROM fortune_categories WHERE code = 'bazi'), '命格测算', 'bazi_mingge', '解析命格特征', '通过八字分析命格特征，了解天生优势与劣势，为人生决策提供参考', 58.00, 19.90, 14.90, 'active', false, false, false, 3, 432, 298, 4.6),

-- 生肖运势
((SELECT id FROM fortune_categories WHERE code = 'zodiac'), '生肖运势', 'zodiac_fortune', '12生肖运势分析', '根据生肖属相分析本月运势，包括事业、财运、感情、健康等方面的详细指导', 48.00, 19.90, 14.90, 'active', true, false, true, 4, 2156, 1534, 4.9),
((SELECT id FROM fortune_categories WHERE code = 'zodiac'), '生肖配对', 'zodiac_match', '生肖姻缘配对', '根据双方生肖属相分析感情配对指数，了解相处之道与注意事项', 58.00, 24.90, 19.90, 'active', false, true, false, 5, 678, 456, 4.7),

-- 星座占卜
((SELECT id FROM fortune_categories WHERE code = 'constellation'), '星座运势', 'star_fortune', '星座月度运势', '12星座本月运势详解，爱情、事业、财运、健康全方位指引', 38.00, 14.90, 9.90, 'active', true, false, true, 6, 3245, 2156, 4.8),
((SELECT id FROM fortune_categories WHERE code = 'constellation'), '星座配对', 'star_match', '星座恋爱配对', '通过星座分析两人感情契合度，提供相处建议', 48.00, 19.90, 14.90, 'active', false, false, false, 7, 1234, 876, 4.6),

-- 姓名分析
((SELECT id FROM fortune_categories WHERE code = 'name'), '姓名详批', 'name_detail', '姓名五格分析', '根据姓名笔画分析五格数理，解读姓名对运势的影响', 68.00, 29.90, 19.90, 'active', true, false, true, 8, 987, 654, 4.7),
((SELECT id FROM fortune_categories WHERE code = 'name'), '起名宝典', 'name_baby', '新生儿起名', '结合生辰八字为宝宝起个好名字，提供多个优质名字方案', 128.00, 68.00, 48.00, 'active', false, true, true, 9, 567, 389, 4.9),

-- 婚恋配对
((SELECT id FROM fortune_categories WHERE code = 'marriage'), '姻缘分析', 'marriage_fate', '婚姻运势详批', '分析婚姻运势，预测姻缘何时到来，提供脱单建议', 78.00, 34.90, 24.90, 'active', true, false, true, 10, 1456, 1023, 4.8),
((SELECT id FROM fortune_categories WHERE code = 'marriage'), '合婚测算', 'marriage_match', '八字合婚配对', '通过双方八字分析婚配吉凶，提供婚姻幸福指南', 88.00, 39.90, 29.90, 'active', false, false, false, 11, 876, 623, 4.7),

-- 事业财运
((SELECT id FROM fortune_categories WHERE code = 'career'), '事业运势', 'career_fortune', '事业发展分析', '分析事业运势走向，提供职场发展建议与转机时机', 68.00, 29.90, 19.90, 'active', true, false, true, 12, 1123, 789, 4.7),
((SELECT id FROM fortune_categories WHERE code = 'career'), '财运测算', 'wealth_fortune', '财富运势详批', '测算财运旺衰，分析财富来源与理财建议', 68.00, 29.90, 19.90, 'active', false, true, false, 13, 934, 656, 4.8)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  original_price = EXCLUDED.original_price,
  current_price = EXCLUDED.current_price,
  vip_price = EXCLUDED.vip_price,
  status = EXCLUDED.status,
  is_hot = EXCLUDED.is_hot,
  is_new = EXCLUDED.is_new,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order;

-- 显示插入结果
SELECT 'Categories inserted:' as message, COUNT(*) as count FROM fortune_categories;
SELECT 'Services inserted:' as message, COUNT(*) as count FROM fortune_services;
