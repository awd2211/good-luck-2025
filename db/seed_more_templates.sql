-- 添加更多算命模板

-- 为八字精批添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_detail'),
  '八字精批简约模板',
  'basic',
  '{
    "title": "八字简批",
    "sections": [
      {
        "name": "基本信息",
        "fields": ["出生时辰", "生辰八字", "五行分布"]
      },
      {
        "name": "命运概况",
        "fields": ["命格特点", "性格特征", "天赋才能"]
      },
      {
        "name": "运势简析",
        "fields": ["整体运势", "关键时期", "改运建议"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.1',
  'system'
),
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_detail'),
  '八字精批VIP模板',
  'premium',
  '{
    "title": "八字精批VIP版",
    "sections": [
      {
        "name": "命盘详解",
        "description": "完整八字命盘分析",
        "fields": ["四柱排盘", "十神详解", "神煞分析", "格局判断", "用神分析", "忌神分析"]
      },
      {
        "name": "五行命理",
        "description": "五行旺衰与调候",
        "fields": ["五行强弱", "寒暖燥湿", "调候用神", "平衡分析", "先后天运"]
      },
      {
        "name": "大运详批",
        "description": "一生大运走势",
        "fields": ["大运排列", "运程起伏", "十年大运详解", "流年分析", "转运节点"]
      },
      {
        "name": "六亲分析",
        "description": "父母兄弟子女缘分",
        "fields": ["父母缘", "兄弟缘", "夫妻缘", "子女缘", "六亲助力"]
      },
      {
        "name": "全面运势",
        "description": "各方面详细运势",
        "fields": ["事业运详解", "财运详解", "婚姻运详解", "健康运详解", "学业运详解", "人际运详解"]
      },
      {
        "name": "命理改运",
        "description": "专业改运建议",
        "fields": ["风水调整", "颜色开运", "数字开运", "方位开运", "职业选择", "配偶选择"]
      }
    ]
  }'::jsonb,
  '{
    "vip_only": true,
    "detailed_level": "maximum"
  }'::jsonb,
  'active',
  '3.0',
  'system'
);

-- 为流年运势添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_year'),
  '流年运势详细模板',
  'detailed',
  '{
    "title": "流年运势详批",
    "sections": [
      {
        "name": "流年综述",
        "fields": ["本年天干地支", "与命局关系", "吉凶总论", "运势等级"]
      },
      {
        "name": "流年月运",
        "description": "12个月逐月详批",
        "months": [
          {"month": 1, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 2, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 3, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 4, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 5, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 6, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 7, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 8, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 9, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 10, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 11, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]},
          {"month": 12, "fields": ["整体运势", "工作财运", "感情健康", "开运吉日"]}
        ]
      },
      {
        "name": "重要时间节点",
        "fields": ["转运时机", "发展高峰", "低谷时期", "关键决策月"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.1',
  'system'
);

-- 为命格测算添加模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_mingge'),
  '命格测算标准模板',
  'basic',
  '{
    "title": "命格分析",
    "sections": [
      {
        "name": "命格类型",
        "fields": ["命格名称", "格局高低", "富贵程度", "命格特点"]
      },
      {
        "name": "格局分析",
        "fields": ["成格条件", "破格因素", "救应方法", "格局影响"]
      },
      {
        "name": "性格命运",
        "fields": ["性格优势", "性格缺陷", "命运走向", "人生建议"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 为生肖配对添加模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'zodiac_match'),
  '生肖配对详细模板',
  'detailed',
  '{
    "title": "生肖姻缘配对",
    "sections": [
      {
        "name": "配对指数",
        "fields": ["综合指数", "爱情指数", "婚姻指数", "配对等级"]
      },
      {
        "name": "性格契合",
        "fields": ["性格互补", "相处模式", "冲突点", "和谐建议"]
      },
      {
        "name": "婚后生活",
        "fields": ["家庭关系", "子女运", "财富运", "长久秘诀"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 为星座配对添加模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'star_match'),
  '星座配对标准模板',
  'basic',
  '{
    "title": "星座恋爱配对",
    "sections": [
      {
        "name": "配对总论",
        "fields": ["配对指数", "星座关系", "契合度", "配对建议"]
      },
      {
        "name": "恋爱分析",
        "fields": ["相识缘分", "恋爱模式", "甜蜜指数", "矛盾化解"]
      },
      {
        "name": "相处之道",
        "fields": ["沟通方式", "约会建议", "增进感情", "长久秘诀"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.0',
  'system'
),
(
  (SELECT id FROM fortune_services WHERE code = 'star_match'),
  '星座配对深度模板',
  'detailed',
  '{
    "title": "星座深度配对分析",
    "sections": [
      {
        "name": "星座解析",
        "fields": ["男方星座特点", "女方星座特点", "星座关系", "元素分析"]
      },
      {
        "name": "综合配对",
        "fields": ["爱情指数", "性格契合", "价值观", "生活方式", "沟通方式"]
      },
      {
        "name": "恋爱指南",
        "fields": ["追求技巧", "约会建议", "礼物推荐", "禁忌事项"]
      },
      {
        "name": "长期发展",
        "fields": ["婚姻展望", "家庭生活", "育儿观念", "财务管理"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '2.0',
  'system'
);

-- 为姓名详批添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'name_detail'),
  '姓名分析简易模板',
  'basic',
  '{
    "title": "姓名快速分析",
    "sections": [
      {
        "name": "姓名评分",
        "fields": ["综合评分", "五格评分", "三才评分"]
      },
      {
        "name": "简要分析",
        "fields": ["性格特点", "事业财运", "感情健康"]
      },
      {
        "name": "改名建议",
        "fields": ["是否需要改名", "改名方向"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.1',
  'system'
),
(
  (SELECT id FROM fortune_services WHERE code = 'name_detail'),
  '姓名分析高级模板',
  'premium',
  '{
    "title": "姓名深度解析",
    "sections": [
      {
        "name": "姓名全解",
        "fields": ["姓名评分", "笔画分析", "五行属性", "吉凶判断"]
      },
      {
        "name": "五格剖象",
        "description": "五格数理详细解析",
        "fields": [
          "天格：含义、吉凶、影响",
          "人格：含义、吉凶、影响",
          "地格：含义、吉凶、影响",
          "外格：含义、吉凶、影响",
          "总格：含义、吉凶、影响"
        ]
      },
      {
        "name": "三才配置",
        "fields": ["天人地三才", "五行生克", "吉凶判断", "运势影响"]
      },
      {
        "name": "八十一数理",
        "fields": ["数理吉凶", "数理含义", "对人生影响"]
      },
      {
        "name": "全面影响",
        "fields": ["基础运", "成功运", "社交运", "性格影响", "事业影响", "婚姻影响", "子女影响", "健康影响"]
      },
      {
        "name": "改名建议",
        "fields": ["是否改名", "改名原则", "推荐笔画", "避忌笔画"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '2.0',
  'system'
);

-- 为起名宝典添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'name_baby'),
  '新生儿起名简易版',
  'basic',
  '{
    "title": "宝宝起名方案（3个名字）",
    "sections": [
      {
        "name": "八字简析",
        "fields": ["生辰八字", "五行分析", "喜用神"]
      },
      {
        "name": "推荐名字",
        "count": 3,
        "format": {
          "name": "推荐名字",
          "score": "评分",
          "meaning": "含义",
          "wuxing": "五行"
        }
      }
    ]
  }'::jsonb,
  '{
    "recommendation_count": 3
  }'::jsonb,
  'active',
  '1.1',
  'system'
),
(
  (SELECT id FROM fortune_services WHERE code = 'name_baby'),
  '新生儿起名豪华版',
  'premium',
  '{
    "title": "宝宝起名豪华方案（10个名字）",
    "sections": [
      {
        "name": "八字详批",
        "fields": ["四柱八字", "五行旺衰", "喜用神分析", "忌神分析", "调候分析"]
      },
      {
        "name": "起名原则",
        "fields": ["五行补益原则", "数理选择原则", "字义选择原则", "音韵选择原则", "避讳原则"]
      },
      {
        "name": "精选名字",
        "count": 10,
        "description": "10个精心挑选的优质名字",
        "format": {
          "rank": "推荐序号",
          "name": "姓名",
          "score": "综合评分",
          "pinyin": "拼音",
          "wuxing": "五行属性",
          "meaning": "字义解释",
          "source": "诗词出处",
          "personality": "性格影响",
          "numerology": "数理分析",
          "recommendation": "推荐理由"
        }
      },
      {
        "name": "名字对比",
        "description": "10个名字的详细对比表",
        "fields": ["评分对比", "五行对比", "数理对比", "寓意对比"]
      },
      {
        "name": "使用建议",
        "fields": ["最佳选择", "备选方案", "使用场景", "注意事项"]
      }
    ]
  }'::jsonb,
  '{
    "recommendation_count": 10,
    "include_poetry": true
  }'::jsonb,
  'active',
  '3.0',
  'system'
);

-- 为合婚测算添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'marriage_match'),
  '八字合婚简易模板',
  'basic',
  '{
    "title": "八字合婚快速分析",
    "sections": [
      {
        "name": "合婚指数",
        "fields": ["配对指数", "婚配等级", "总体建议"]
      },
      {
        "name": "简要分析",
        "fields": ["五行互补", "性格契合", "运势相助"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.1',
  'system'
);

-- 为事业运势添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'career_fortune'),
  '事业运势详细模板',
  'detailed',
  '{
    "title": "事业发展详细分析",
    "sections": [
      {
        "name": "事业基础",
        "fields": ["职业天赋", "事业格局", "发展潜力", "成就高度"]
      },
      {
        "name": "当前分析",
        "fields": ["目前状况", "存在问题", "发展机遇", "改进方向"]
      },
      {
        "name": "行业选择",
        "fields": ["适合行业", "不适合行业", "转行建议", "创业分析"]
      },
      {
        "name": "晋升运",
        "fields": ["晋升时机", "晋升阻碍", "如何突破", "领导运"]
      },
      {
        "name": "创业运",
        "fields": ["创业时机", "创业方向", "合作伙伴", "成功概率"]
      },
      {
        "name": "职场人际",
        "fields": ["同事关系", "上司关系", "下属关系", "客户关系"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '2.0',
  'system'
);

-- 为财运测算添加更多模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'wealth_fortune'),
  '财运分析详细模板',
  'detailed',
  '{
    "title": "财富运势详细分析",
    "sections": [
      {
        "name": "财运基础",
        "fields": ["先天财运", "财库分析", "财富等级", "求财难易"]
      },
      {
        "name": "收入分析",
        "fields": ["工资收入", "奖金提成", "投资收益", "其他收入"]
      },
      {
        "name": "投资理财",
        "fields": ["投资天赋", "适合投资", "风险偏好", "理财建议"]
      },
      {
        "name": "股票运",
        "fields": ["是否适合炒股", "炒股时机", "风险提醒"]
      },
      {
        "name": "房产运",
        "fields": ["置业时机", "房产投资", "增值潜力"]
      },
      {
        "name": "生意运",
        "fields": ["经商天赋", "适合生意", "合作伙伴", "经营建议"]
      },
      {
        "name": "破财化解",
        "fields": ["破财时期", "破财原因", "防范方法", "化解之道"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '2.0',
  'system'
),
(
  (SELECT id FROM fortune_services WHERE code = 'wealth_fortune'),
  '财运分析简易模板',
  'basic',
  '{
    "title": "财运快速分析",
    "sections": [
      {
        "name": "财运概况",
        "fields": ["财运指数", "求财方式", "财运周期"]
      },
      {
        "name": "理财建议",
        "fields": ["投资方向", "理财方式", "注意事项"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.1',
  'system'
);

-- 显示插入结果
SELECT '新增模板插入完成' as message, COUNT(*) as new_count FROM fortune_templates WHERE created_at > NOW() - INTERVAL '1 minute';
SELECT '总模板数' as message, COUNT(*) as total_count FROM fortune_templates;
SELECT fs.name as service_name, COUNT(ft.id) as template_count
FROM fortune_services fs
LEFT JOIN fortune_templates ft ON fs.id = ft.service_id
GROUP BY fs.id, fs.name
ORDER BY fs.id;
