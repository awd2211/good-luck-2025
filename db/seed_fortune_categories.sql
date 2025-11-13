-- 插入真实的算命服务分类数据
-- 这些是真实的算命、占卜、风水等传统文化服务分类

-- 清空现有数据（如果需要）
-- DELETE FROM fortune_categories;

-- 插入详细的算命服务分类
INSERT INTO fortune_categories (name, code, icon, description, sort_order, status) VALUES

-- 八字命理类
('八字算命', 'bazi', '🔮', '根据出生年月日时的天干地支，推算一生命运轨迹、性格特点、事业财运等。是最传统、最权威的命理学说。', 1, 'active'),
('紫微斗数', 'ziwei', '⭐', '中国古代术数体系中的"命理学之王"，通过命盘分析一生运势、性格、人际关系等，精准度极高。', 2, 'active'),
('奇门遁甲', 'qimen', '🎯', '古代兵家必学的高级预测术，可预测事情成败、时机选择、方位吉凶等，被誉为帝王之学。', 3, 'active'),

-- 生肖星座类
('生肖运势', 'birth_animal', '🐉', '根据中国传统十二生肖，分析每日、每月、每年的运势变化，包括事业、感情、财运、健康等方面。', 4, 'active'),
('星座运势', 'zodiac', '♈', '西方占星学，通过十二星座分析性格特点、爱情配对、每日运势等，深受年轻人喜爱。', 5, 'active'),
('血型配对', 'blood_type', '💉', '根据不同血型的性格特征，分析人际关系、爱情配对、职业选择等。', 6, 'active'),

-- 占卜预测类
('塔罗占卜', 'tarot', '🃏', '使用塔罗牌进行占卜，解答感情、事业、财运等问题，通过牌面组合洞察过去现在未来。', 7, 'active'),
('周易占卜', 'yijing', '☯️', '根据《周易》六十四卦象进行占卜，预测吉凶祸福，指导人生决策。', 8, 'active'),
('抽签问卦', 'lottery', '🎋', '观音灵签、月老灵签、关帝灵签等传统抽签问卦，解答疑惑、寻求指引。', 9, 'active'),
('梅花易数', 'meihua', '🌸', '宋代邵雍创立的占卜方法，随时随地取象起卦，灵活预测事物发展。', 10, 'active'),

-- 姓名字号类
('姓名测试', 'name_test', '📝', '根据姓名的笔画、五行、音韵等，分析姓名对运势的影响，测算姓名吉凶。', 11, 'active'),
('宝宝起名', 'baby_naming', '👶', '结合生辰八字、五行喜忌、生肖属相等，为新生宝宝起一个好听、吉祥、有内涵的名字。', 12, 'active'),
('公司起名', 'company_naming', '🏢', '为企业、品牌、店铺起名，结合行业特点、法人八字，打造响亮吉祥的商业名称。', 13, 'active'),
('改名建议', 'name_change', '✏️', '分析现有姓名的不足，根据命理五行提供改名建议，化解姓名带来的不利影响。', 14, 'active'),

-- 婚恋感情类
('合婚配对', 'marriage_match', '💑', '通过双方八字、生肖、星座等，分析婚姻匹配度、感情走势、相处之道。', 15, 'active'),
('爱情运势', 'love_fortune', '💕', '预测未来感情发展，分析桃花运、正缘出现时间、恋爱注意事项等。', 16, 'active'),
('复合挽回', 'reconciliation', '💔', '分析分手原因、挽回可能性、最佳挽回时机和方法，帮助重归于好。', 17, 'active'),
('姻缘测算', 'marriage_fate', '💍', '测算正缘何时出现、未来伴侣特征、婚姻幸福度等。', 18, 'active'),

-- 事业财运类
('事业运势', 'career_fortune', '💼', '分析事业发展方向、升职时机、跳槽建议、创业吉凶等。', 19, 'active'),
('财运测算', 'wealth_fortune', '💰', '预测财运走势、偏财正财、投资理财建议、破财风险等。', 20, 'active'),
('考试运势', 'exam_fortune', '📚', '预测考试运气、学业发展、专业选择、学习方法建议等。', 21, 'active'),
('求职择业', 'job_selection', '🎯', '分析适合的职业方向、求职时机、面试运势、工作选择建议。', 22, 'active'),

-- 风水命理类
('家居风水', 'home_fengshui', '🏠', '分析家居布局、摆设禁忌、化解煞气、提升家运的风水方法。', 23, 'active'),
('办公风水', 'office_fengshui', '🏢', '办公室座位、布局、装修的风水讲究，提升事业运、人际关系。', 24, 'active'),
('购房择址', 'house_selection', '🏘️', '根据风水原理，分析楼盘、户型、朝向等，选择旺宅旺运的房产。', 25, 'active'),
('择吉日时', 'auspicious_date', '📅', '根据黄历、命理，选择结婚、搬家、开业、签约等重要事项的吉日吉时。', 26, 'active'),

-- 健康预测类
('健康运势', 'health_fortune', '🏥', '根据命理分析健康状况、疾病隐患、养生建议、就医时机等。', 27, 'active'),
('疾病预测', 'disease_prediction', '💊', '通过命理、面相等预测潜在疾病风险，提供预防和调理建议。', 28, 'active'),

-- 解梦释疑类
('周公解梦', 'dream', '💤', '根据《周公解梦》等经典，解析梦境含义、预示吉凶、指点迷津。', 29, 'active'),
('噩梦化解', 'nightmare_solution', '😰', '分析噩梦成因，提供化解方法，消除心理阴影。', 30, 'active'),

-- 面相手相类
('面相分析', 'face_reading', '😊', '通过面部特征分析性格、运势、健康、财运等，观相识人。', 31, 'active'),
('手相分析', 'palm_reading', '🖐️', '根据手掌纹路、形状分析命运、性格、事业、婚姻等。', 32, 'active'),
('痣相分析', 'mole_reading', '⚫', '分析身体各部位痣的吉凶含义，了解运势影响。', 33, 'active'),

-- 号码吉凶类
('手机号码', 'phone_number', '📱', '根据数字能量学分析手机号码吉凶，选择旺运号码。', 34, 'active'),
('车牌号码', 'license_plate', '🚗', '分析车牌号码的五行能量，选择安全吉祥的车牌。', 35, 'active'),
('门牌号码', 'house_number', '🚪', '分析住宅、公司门牌号对运势的影响。', 36, 'active'),

-- 其他服务类
('前世今生', 'past_life', '♻️', '探索前世因缘，了解今生使命，解开宿命之谜。', 37, 'active'),
('灵魂伴侣', 'soulmate', '👫', '寻找灵魂伴侣，分析双方灵魂契合度。', 38, 'active'),
('转运改运', 'luck_change', '🍀', '通过风水、改名、佩饰等方法，改善运势、化解不利。', 39, 'active'),
('吉祥物推荐', 'mascot', '🧧', '根据命理五行，推荐适合的吉祥物、幸运色、幸运数字等。', 40, 'active')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 查看插入结果
SELECT
    '算命分类数据插入完成！' as message,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_categories
FROM fortune_categories;

-- 显示所有分类
SELECT
    id,
    name,
    code,
    icon,
    LEFT(description, 30) || '...' as description_preview,
    sort_order,
    status
FROM fortune_categories
ORDER BY sort_order;
