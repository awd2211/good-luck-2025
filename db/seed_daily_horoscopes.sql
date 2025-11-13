-- 插入每日运势数据（一个月）
-- 包含12星座和12生肖的运势

DO $$
DECLARE
  target_date DATE;
  zodiac_list TEXT[] := ARRAY['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
  animal_list TEXT[] := ARRAY['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  zodiac_sign TEXT;
  animal_sign TEXT;
  day_offset INTEGER;
BEGIN
  -- 插入未来30天的数据
  FOR day_offset IN 0..29 LOOP
    target_date := CURRENT_DATE + day_offset;

    -- 为每个星座插入数据
    FOREACH zodiac_sign IN ARRAY zodiac_list LOOP
      INSERT INTO daily_horoscopes (
        date, type, type_value,
        overall_score, love_score, career_score, wealth_score, health_score,
        overall_content, love_content, career_content, wealth_content, health_content,
        lucky_color, lucky_number, lucky_direction
      ) VALUES (
        target_date,
        'zodiac',
        zodiac_sign,
        -- 随机运势评分 3-5分
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        -- 运势内容
        '综合运势良好，各方面发展平稳。',
        '感情运势温和，适合增进感情。',
        '事业运势上升，把握工作机会。',
        '财运平稳，适当理财有收益。',
        '健康状况良好，保持良好作息。',
        -- 随机幸运色
        (ARRAY['红色', '橙色', '黄色', '绿色', '蓝色', '紫色', '白色', '黑色', '粉色', '金色'])[1 + floor(random() * 10)::INTEGER],
        -- 随机幸运数字
        (1 + floor(random() * 9)::INTEGER)::TEXT,
        -- 根据星座生成建议
        CASE
          WHEN zodiac_sign = '白羊座' THEN '今日适合主动出击，把握机会展现自我。'
          WHEN zodiac_sign = '金牛座' THEN '保持稳健步伐，财务规划需谨慎考虑。'
          WHEN zodiac_sign = '双子座' THEN '沟通交流是今日重点，多与他人互动。'
          WHEN zodiac_sign = '巨蟹座' THEN '关注家庭和情感，给予亲人更多关怀。'
          WHEN zodiac_sign = '狮子座' THEN '发挥领导才能，但要注意团队协作。'
          WHEN zodiac_sign = '处女座' THEN '注重细节完善，工作效率将有提升。'
          WHEN zodiac_sign = '天秤座' THEN '平衡各方关系，保持优雅从容态度。'
          WHEN zodiac_sign = '天蝎座' THEN '洞察力敏锐，适合深度思考和规划。'
          WHEN zodiac_sign = '射手座' THEN '拓展视野，尝试新事物会有惊喜。'
          WHEN zodiac_sign = '摩羯座' THEN '踏实努力，坚持目标终将有收获。'
          WHEN zodiac_sign = '水瓶座' THEN '创新思维活跃，独特想法受到认可。'
          WHEN zodiac_sign = '双鱼座' THEN '发挥想象力和同理心，艺术灵感丰富。'
        END
      );
    END LOOP;

    -- 为每个生肖插入数据
    FOREACH animal_sign IN ARRAY animal_list LOOP
      INSERT INTO daily_horoscopes (
        date, type, type_value,
        overall_score, love_score, career_score, wealth_score, health_score,
        overall_content, love_content, career_content, wealth_content, health_content,
        lucky_color, lucky_number, lucky_direction
      ) VALUES (
        target_date,
        'birth_animal',
        animal_sign,
        -- 随机运势评分 3-5分
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        3 + floor(random() * 3)::INTEGER,
        -- 运势内容
        '综合运势良好，诸事顺利。',
        '感情运势平稳，真诚相待。',
        '事业运势上扬，努力进取。',
        '财运稳定，理财得当。',
        '健康平安，注意休息。',
        -- 随机幸运色
        (ARRAY['红色', '橙色', '黄色', '绿色', '蓝色', '紫色', '白色', '黑色', '粉色', '金色'])[1 + floor(random() * 10)::INTEGER],
        -- 随机幸运数字
        (1 + floor(random() * 9)::INTEGER)::TEXT,
        -- 根据生肖生成建议
        CASE
          WHEN animal_sign = '鼠' THEN '机智灵活，适合谋划新项目。'
          WHEN animal_sign = '牛' THEN '脚踏实地，勤奋努力见成效。'
          WHEN animal_sign = '虎' THEN '勇往直前，但要注意收敛锋芒。'
          WHEN animal_sign = '兔' THEN '温和谨慎，人际关系和谐顺利。'
          WHEN animal_sign = '龙' THEN '运势旺盛，把握机遇大展宏图。'
          WHEN animal_sign = '蛇' THEN '智慧深邃，适合深思熟虑后行动。'
          WHEN animal_sign = '马' THEN '活力充沛，积极进取会有收获。'
          WHEN animal_sign = '羊' THEN '温柔体贴，关注家庭情感生活。'
          WHEN animal_sign = '猴' THEN '聪明伶俐，灵活应变化解难题。'
          WHEN animal_sign = '鸡' THEN '勤勉认真，注重细节精益求精。'
          WHEN animal_sign = '狗' THEN '忠诚可靠，真诚待人赢得信任。'
          WHEN animal_sign = '猪' THEN '乐观豁达，享受生活平和喜乐。'
        END
      );
    END LOOP;

  END LOOP;
END $$;

-- 统计插入结果
SELECT
  '运势数据插入完成' as message,
  COUNT(*) as total_records,
  COUNT(DISTINCT date) as days_count,
  COUNT(CASE WHEN type = 'zodiac' THEN 1 END) as zodiac_count,
  COUNT(CASE WHEN type = 'birth_animal' THEN 1 END) as birth_animal_count
FROM daily_horoscopes
WHERE date >= CURRENT_DATE;

-- 显示日期范围
SELECT
  MIN(date) as start_date,
  MAX(date) as end_date,
  COUNT(DISTINCT date) as total_days
FROM daily_horoscopes
WHERE date >= CURRENT_DATE;

-- 显示每个类型的数量
SELECT
  type,
  CASE
    WHEN type = 'zodiac' THEN '星座'
    WHEN type = 'birth_animal' THEN '生肖'
  END as type_name,
  COUNT(DISTINCT type_value) as types_count,
  COUNT(*) as records_count
FROM daily_horoscopes
WHERE date >= CURRENT_DATE
GROUP BY type;
