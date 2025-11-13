-- 插入算命模板数据
-- 为每个算命服务创建对应的模板

-- 1. 八字精批模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_detail'),
  '八字精批基础模板',
  'basic',
  '{
    "title": "八字精批详细分析",
    "sections": [
      {
        "name": "命格总论",
        "description": "根据八字分析您的命格特征",
        "fields": ["五行属性", "命局强弱", "格局高低", "运势走向"]
      },
      {
        "name": "性格分析",
        "description": "解读您的性格特点与天赋",
        "fields": ["性格优势", "性格弱点", "天赋才能", "适合领域"]
      },
      {
        "name": "事业运势",
        "description": "分析事业发展方向与时机",
        "fields": ["适合职业", "事业机遇", "发展建议", "贵人方位"]
      },
      {
        "name": "财运分析",
        "description": "财富运势与理财建议",
        "fields": ["财运旺衰", "求财方向", "理财建议", "投资禁忌"]
      },
      {
        "name": "感情婚姻",
        "description": "婚恋运势与感情分析",
        "fields": ["姻缘时机", "配偶特征", "婚姻状况", "感情建议"]
      },
      {
        "name": "健康状况",
        "description": "身体健康与养生建议",
        "fields": ["体质特点", "健康隐患", "养生方向", "注意事项"]
      }
    ],
    "conclusion": "综合建议与开运指导"
  }'::jsonb,
  '{
    "min_age": 18,
    "max_age": 80,
    "required_fields": ["birth_year", "birth_month", "birth_day", "birth_hour", "gender"]
  }'::jsonb,
  'active',
  '1.0',
  'system'
),
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_detail'),
  '八字精批高级模板',
  'detailed',
  '{
    "title": "八字精批深度解析",
    "sections": [
      {
        "name": "八字命盘",
        "description": "四柱八字详细排盘",
        "fields": ["年柱", "月柱", "日柱", "时柱", "十神分析", "神煞解读"]
      },
      {
        "name": "五行分析",
        "description": "五行旺衰与喜用神",
        "fields": ["五行分布", "旺衰分析", "喜用神", "忌神", "调候用神"]
      },
      {
        "name": "大运流年",
        "description": "一生大运与近期流年",
        "fields": ["大运排列", "当前大运", "近五年流年", "重要转折期"]
      },
      {
        "name": "详细运势",
        "description": "各方面详细运势分析",
        "fields": ["事业运", "财运", "感情运", "健康运", "学业运", "人际运"]
      },
      {
        "name": "开运指南",
        "description": "个性化开运建议",
        "fields": ["幸运颜色", "幸运数字", "幸运方位", "改运方法"]
      }
    ]
  }'::jsonb,
  '{
    "min_age": 18,
    "required_fields": ["birth_year", "birth_month", "birth_day", "birth_hour", "gender", "birth_place"]
  }'::jsonb,
  'active',
  '2.0',
  'system'
);

-- 2. 流年运势模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'bazi_year'),
  '流年运势标准模板',
  'basic',
  '{
    "title": "流年运势详批",
    "sections": [
      {
        "name": "年运总论",
        "description": "本年度整体运势概况",
        "fields": ["运势总评", "吉凶指数", "重点月份", "注意事项"]
      },
      {
        "name": "事业财运",
        "description": "本年事业与财富运势",
        "fields": ["事业发展", "财运走向", "投资建议", "职场人际"]
      },
      {
        "name": "感情姻缘",
        "description": "本年感情与婚恋运势",
        "fields": ["单身运势", "恋爱运势", "婚姻运势", "桃花月份"]
      },
      {
        "name": "健康平安",
        "description": "本年健康与平安运势",
        "fields": ["健康状况", "疾病预防", "意外防范", "养生建议"]
      },
      {
        "name": "月度运势",
        "description": "十二个月详细运势",
        "fields": ["1-12月运势", "每月吉日", "每月注意"]
      }
    ]
  }'::jsonb,
  '{
    "valid_years": [2024, 2025, 2026]
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 3. 生肖运势模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'zodiac_fortune'),
  '生肖运势月度模板',
  'basic',
  '{
    "title": "生肖运势月度分析",
    "sections": [
      {
        "name": "本月运势",
        "description": "本月整体运势预测",
        "fields": ["运势指数", "幸运星级", "开运吉日", "本月提醒"]
      },
      {
        "name": "事业运",
        "description": "本月事业发展运势",
        "content": "工作状态、机遇把握、人际关系"
      },
      {
        "name": "财运",
        "description": "本月财富运势",
        "content": "正财运、偏财运、投资理财"
      },
      {
        "name": "感情运",
        "description": "本月感情运势",
        "content": "单身桃花、恋爱进展、夫妻关系"
      },
      {
        "name": "健康运",
        "description": "本月健康运势",
        "content": "身体状况、注意部位、养生建议"
      }
    ],
    "lucky_elements": {
      "color": ["幸运颜色"],
      "number": ["幸运数字"],
      "direction": ["幸运方位"]
    }
  }'::jsonb,
  '{
    "zodiac_animals": ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 4. 星座运势模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'star_fortune'),
  '星座运势月度模板',
  'basic',
  '{
    "title": "星座运势月度解析",
    "sections": [
      {
        "name": "本月概述",
        "description": "本月星座运势总览",
        "fields": ["综合运势", "运势高峰期", "低潮期", "转运时刻"]
      },
      {
        "name": "爱情运势",
        "description": "本月感情运势详解",
        "fields": ["单身运势", "恋爱指数", "脱单建议", "约会吉日"]
      },
      {
        "name": "事业运势",
        "description": "本月工作事业运势",
        "fields": ["工作状态", "发展机会", "职场提醒", "贵人相助"]
      },
      {
        "name": "财富运势",
        "description": "本月财运分析",
        "fields": ["收入情况", "支出提醒", "理财建议", "投资指数"]
      },
      {
        "name": "健康运势",
        "description": "本月健康状况",
        "fields": ["健康指数", "注意事项", "运动建议", "饮食指导"]
      }
    ],
    "lucky_tips": "本月开运小贴士"
  }'::jsonb,
  '{
    "constellations": ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"]
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 5. 姓名详批模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'name_detail'),
  '姓名分析标准模板',
  'basic',
  '{
    "title": "姓名五格分析",
    "sections": [
      {
        "name": "姓名总论",
        "description": "姓名整体评价",
        "fields": ["姓名评分", "五格总评", "命名优势", "改善建议"]
      },
      {
        "name": "五格数理",
        "description": "五格数理详解",
        "fields": [
          "天格数理及含义",
          "人格数理及含义",
          "地格数理及含义",
          "外格数理及含义",
          "总格数理及含义"
        ]
      },
      {
        "name": "三才配置",
        "description": "天地人三才分析",
        "fields": ["三才属性", "三才吉凶", "性格影响", "运势影响"]
      },
      {
        "name": "姓名对运势的影响",
        "description": "各方面运势影响",
        "fields": ["性格影响", "事业影响", "财运影响", "感情影响", "健康影响"]
      },
      {
        "name": "音韵分析",
        "description": "姓名音韵特点",
        "fields": ["读音特点", "声调搭配", "谐音分析"]
      }
    ]
  }'::jsonb,
  '{
    "name_length": {"min": 2, "max": 4}
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 6. 起名宝典模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'name_baby'),
  '新生儿起名模板',
  'premium',
  '{
    "title": "新生儿起名方案",
    "sections": [
      {
        "name": "八字分析",
        "description": "宝宝八字命理分析",
        "fields": ["八字排盘", "五行分析", "喜用神", "命格特点"]
      },
      {
        "name": "起名原则",
        "description": "根据八字确定起名方向",
        "fields": ["五行补益", "数理要求", "音韵要求", "字义要求"]
      },
      {
        "name": "推荐名字",
        "description": "优质名字推荐（3-5个）",
        "format": [
          {
            "name": "推荐名字",
            "score": "综合评分",
            "meaning": "字义解释",
            "wuxing": "五行属性",
            "shuli": "数理吉凶",
            "pronunciation": "读音特点"
          }
        ]
      },
      {
        "name": "名字详解",
        "description": "每个推荐名字的详细解析",
        "fields": ["五格分析", "三才配置", "运势影响", "使用建议"]
      }
    ]
  }'::jsonb,
  '{
    "required_fields": ["surname", "birth_year", "birth_month", "birth_day", "birth_hour", "gender"],
    "recommendation_count": {"min": 3, "max": 5}
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 7. 姻缘分析模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'marriage_fate'),
  '姻缘分析标准模板',
  'basic',
  '{
    "title": "姻缘运势分析",
    "sections": [
      {
        "name": "姻缘总论",
        "description": "婚姻运势整体分析",
        "fields": ["姻缘旺衰", "婚姻时机", "配偶类型", "婚后生活"]
      },
      {
        "name": "桃花运势",
        "description": "异性缘与桃花分析",
        "fields": ["桃花旺度", "正缘桃花", "烂桃花", "桃花时期"]
      },
      {
        "name": "正缘预测",
        "description": "正缘何时出现",
        "fields": ["结婚年龄", "相识方式", "对方特征", "缘分深浅"]
      },
      {
        "name": "感情建议",
        "description": "脱单与恋爱指导",
        "fields": ["提升魅力", "寻找对象", "相处之道", "避免误区"]
      },
      {
        "name": "婚姻预测",
        "description": "婚后生活预测",
        "fields": ["婚姻状况", "夫妻关系", "家庭和睦", "注意事项"]
      }
    ]
  }'::jsonb,
  '{
    "age_range": {"min": 18, "max": 50}
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 8. 合婚测算模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'marriage_match'),
  '八字合婚标准模板',
  'detailed',
  '{
    "title": "八字合婚配对分析",
    "sections": [
      {
        "name": "合婚总论",
        "description": "双方八字配对概况",
        "fields": ["配对指数", "婚配等级", "整体评价", "结论建议"]
      },
      {
        "name": "八字配对",
        "description": "双方八字分析",
        "fields": ["男方八字", "女方八字", "五行互补", "生克关系"]
      },
      {
        "name": "性格配对",
        "description": "性格契合度分析",
        "fields": ["性格特点", "互补程度", "冲突点", "和谐点"]
      },
      {
        "name": "运势配对",
        "description": "双方运势相互影响",
        "fields": ["事业相助", "财运影响", "健康影响", "子女缘分"]
      },
      {
        "name": "婚姻建议",
        "description": "婚后相处建议",
        "fields": ["增进感情", "化解矛盾", "家庭和睦", "白头偕老"]
      }
    ]
  }'::jsonb,
  '{
    "required_fields": ["male_birth", "female_birth", "both_gender"]
  }'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 9. 事业运势模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'career_fortune'),
  '事业运势分析模板',
  'basic',
  '{
    "title": "事业发展分析",
    "sections": [
      {
        "name": "事业总论",
        "description": "事业运势整体分析",
        "fields": ["事业运势", "发展潜力", "职业方向", "成就预测"]
      },
      {
        "name": "职场运势",
        "description": "当前工作状况分析",
        "fields": ["工作状态", "晋升机会", "跳槽时机", "创业建议"]
      },
      {
        "name": "贵人运",
        "description": "职场贵人与人际",
        "fields": ["贵人方位", "贵人特征", "小人防范", "人际处理"]
      },
      {
        "name": "转折时机",
        "description": "事业重要转折期",
        "fields": ["发展高峰", "低谷时期", "转运时刻", "把握机遇"]
      },
      {
        "name": "发展建议",
        "description": "事业发展指导",
        "fields": ["适合行业", "发展路径", "能力提升", "注意事项"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 10. 财运测算模板
INSERT INTO fortune_templates (service_id, name, template_type, content, rules, status, version, created_by) VALUES
(
  (SELECT id FROM fortune_services WHERE code = 'wealth_fortune'),
  '财运分析标准模板',
  'basic',
  '{
    "title": "财富运势分析",
    "sections": [
      {
        "name": "财运总论",
        "description": "财运整体分析",
        "fields": ["财运旺衰", "财富等级", "求财难易", "财运周期"]
      },
      {
        "name": "正财运",
        "description": "工资收入等正财分析",
        "fields": ["收入水平", "涨薪机会", "稳定性", "发展建议"]
      },
      {
        "name": "偏财运",
        "description": "投资理财等偏财分析",
        "fields": ["偏财旺度", "投资运", "中奖运", "风险提醒"]
      },
      {
        "name": "理财建议",
        "description": "财富管理指导",
        "fields": ["投资方向", "理财方式", "风险控制", "财富积累"]
      },
      {
        "name": "破财化解",
        "description": "破财因素与化解",
        "fields": ["破财原因", "防范措施", "化解方法", "守财建议"]
      }
    ]
  }'::jsonb,
  '{}'::jsonb,
  'active',
  '1.0',
  'system'
);

-- 显示插入结果
SELECT '模板插入完成' as message, COUNT(*) as count FROM fortune_templates;
SELECT service_id, COUNT(*) as template_count
FROM fortune_templates
GROUP BY service_id
ORDER BY service_id;
