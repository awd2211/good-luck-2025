import { Request, Response } from 'express';
import { query } from '../config/database';
import { redisCache } from '../config/redis';

const CACHE_KEY_PREFIX = 'daily_horoscopes';
const CACHE_TTL = 1800; // 30分钟

/**
 * 获取每日运势列表
 */
export const getDailyHoroscopes = async (req: Request, res: Response) => {
  try {
    const { date, start_date, end_date, type, type_value, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (date) {
      conditions.push(`date = $${paramIndex++}`);
      params.push(date);
    }
    if (start_date) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(end_date);
    }
    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }
    if (type_value) {
      conditions.push(`type_value = $${paramIndex++}`);
      params.push(type_value);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM daily_horoscopes ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, Number(limit), offset];
    const dataResult = await query(
      `SELECT * FROM daily_horoscopes ${whereClause} ORDER BY date DESC, type, type_value LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    res.json({
      success: true,
      data: {
        list: dataResult.rows,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error: any) {
    console.error('获取运势列表失败:', error);
    res.status(500).json({ success: false, message: '获取运势列表失败', error: error.message });
  }
};

/**
 * 获取单个运势详情
 */
export const getDailyHoroscope = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM daily_horoscopes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '运势不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('获取运势详情失败:', error);
    res.status(500).json({ success: false, message: '获取运势详情失败', error: error.message });
  }
};

/**
 * 创建每日运势
 */
export const createDailyHoroscope = async (req: Request, res: Response) => {
  try {
    const {
      date, type, type_value,
      overall_score, love_score, career_score, wealth_score, health_score,
      overall_content, love_content, career_content, wealth_content, health_content,
      lucky_color, lucky_number, lucky_direction,
      status = 'published', created_by
    } = req.body;

    if (!date || !type || !type_value) {
      return res.status(400).json({ success: false, message: '日期、类型和类型值为必填项' });
    }

    const result = await query(
      `INSERT INTO daily_horoscopes (
        date, type, type_value,
        overall_score, love_score, career_score, wealth_score, health_score,
        overall_content, love_content, career_content, wealth_content, health_content,
        lucky_color, lucky_number, lucky_direction, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        date, type, type_value,
        overall_score, love_score, career_score, wealth_score, health_score,
        overall_content, love_content, career_content, wealth_content, health_content,
        lucky_color, lucky_number, lucky_direction, status, created_by
      ]
    );

    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);
    res.status(201).json({ success: true, message: '运势创建成功', data: result.rows[0] });
  } catch (error: any) {
    console.error('创建运势失败:', error);
    res.status(500).json({ success: false, message: '创建运势失败', error: error.message });
  }
};

/**
 * 更新每日运势
 */
export const updateDailyHoroscope = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const checkResult = await query('SELECT id FROM daily_horoscopes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '运势不存在' });
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'date', 'type', 'type_value',
      'overall_score', 'love_score', 'career_score', 'wealth_score', 'health_score',
      'overall_content', 'love_content', 'career_content', 'wealth_content', 'health_content',
      'lucky_color', 'lucky_number', 'lucky_direction', 'status', 'created_by'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    params.push(id);
    const sql = `UPDATE daily_horoscopes SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);

    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);
    res.json({ success: true, message: '运势更新成功', data: result.rows[0] });
  } catch (error: any) {
    console.error('更新运势失败:', error);
    res.status(500).json({ success: false, message: '更新运势失败', error: error.message });
  }
};

/**
 * 删除每日运势
 */
export const deleteDailyHoroscope = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM daily_horoscopes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '运势不存在' });
    }
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);
    res.json({ success: true, message: '运势删除成功' });
  } catch (error: any) {
    console.error('删除运势失败:', error);
    res.status(500).json({ success: false, message: '删除运势失败', error: error.message });
  }
};

/**
 * 按日期和类型查询运势
 */
export const getHoroscopeByDateAndType = async (req: Request, res: Response) => {
  try {
    const { date, type } = req.params;

    const cacheKey = `${CACHE_KEY_PREFIX}:${date}:${type}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const result = await query(
      'SELECT * FROM daily_horoscopes WHERE date = $1 AND type = $2 ORDER BY type_value',
      [date, type]
    );

    await redisCache.set(cacheKey, result.rows, CACHE_TTL);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('查询运势失败:', error);
    res.status(500).json({ success: false, message: '查询运势失败', error: error.message });
  }
};

/**
 * 批量生成运势
 */
export const batchGenerateHoroscopes = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, types = ['zodiac', 'birth_animal'] } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: '开始日期和结束日期为必填项' });
    }

    const zodiacSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    const birthAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    const luckyColors = ['红色', '橙色', '黄色', '绿色', '蓝色', '紫色', '白色', '黑色', '粉色', '金色'];
    const directions = ['东方', '西方', '南方', '北方', '东南方', '西南方', '东北方', '西北方'];

    const zodiacAdvice: Record<string, string> = {
      '白羊座': '今日适合主动出击，把握机会展现自我。',
      '金牛座': '保持稳健步伐，财务规划需谨慎考虑。',
      '双子座': '沟通交流是今日重点，多与他人互动。',
      '巨蟹座': '关注家庭和情感，给予亲人更多关怀。',
      '狮子座': '发挥领导才能，但要注意团队协作。',
      '处女座': '注重细节完善，工作效率将有提升。',
      '天秤座': '平衡各方关系，保持优雅从容态度。',
      '天蝎座': '洞察力敏锐，适合深度思考和规划。',
      '射手座': '拓展视野，尝试新事物会有惊喜。',
      '摩羯座': '踏实努力，坚持目标终将有收获。',
      '水瓶座': '创新思维活跃，独特想法受到认可。',
      '双鱼座': '发挥想象力和同理心，艺术灵感丰富。'
    };

    const animalAdvice: Record<string, string> = {
      '鼠': '机智灵活，适合谋划新项目。',
      '牛': '脚踏实地，勤奋努力见成效。',
      '虎': '勇往直前，但要注意收敛锋芒。',
      '兔': '温和谨慎，人际关系和谐顺利。',
      '龙': '运势旺盛，把握机遇大展宏图。',
      '蛇': '智慧深邃，适合深思熟虑后行动。',
      '马': '活力充沛，积极进取会有收获。',
      '羊': '温柔体贴，关注家庭情感生活。',
      '猴': '聪明伶俐，灵活应变化解难题。',
      '鸡': '勤勉认真，注重细节精益求精。',
      '狗': '忠诚可靠，真诚待人赢得信任。',
      '猪': '乐观豁达，享受生活平和喜乐。'
    };

    const start = new Date(start_date);
    const end = new Date(end_date);
    const insertedRecords = [];

    // 遍历日期范围
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];

      // 生成星座运势
      if (types.includes('zodiac')) {
        for (const sign of zodiacSigns) {
          const randomScore = () => Math.floor(Math.random() * 3) + 3; // 3-5分
          const randomColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
          const randomNumber = Math.floor(Math.random() * 9) + 1;
          const randomDirection = directions[Math.floor(Math.random() * directions.length)];

          const result = await query(
            `INSERT INTO daily_horoscopes (
              date, type, type_value,
              overall_score, love_score, career_score, wealth_score, health_score,
              overall_content, love_content, career_content, wealth_content, health_content,
              lucky_color, lucky_number, lucky_direction, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (date, type, type_value) DO NOTHING
            RETURNING id`,
            [
              dateStr, 'zodiac', sign,
              randomScore(), randomScore(), randomScore(), randomScore(), randomScore(),
              '综合运势良好，各方面发展平稳。',
              '感情运势温和，适合增进感情。',
              '事业运势上升，把握工作机会。',
              '财运平稳，适当理财有收益。',
              '健康状况良好，保持良好作息。',
              randomColor, randomNumber.toString(), zodiacAdvice[sign], 'published'
            ]
          );

          if (result.rows.length > 0) {
            insertedRecords.push(result.rows[0]);
          }
        }
      }

      // 生成生肖运势
      if (types.includes('birth_animal')) {
        for (const animal of birthAnimals) {
          const randomScore = () => Math.floor(Math.random() * 3) + 3; // 3-5分
          const randomColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
          const randomNumber = Math.floor(Math.random() * 9) + 1;
          const randomDirection = directions[Math.floor(Math.random() * directions.length)];

          const result = await query(
            `INSERT INTO daily_horoscopes (
              date, type, type_value,
              overall_score, love_score, career_score, wealth_score, health_score,
              overall_content, love_content, career_content, wealth_content, health_content,
              lucky_color, lucky_number, lucky_direction, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (date, type, type_value) DO NOTHING
            RETURNING id`,
            [
              dateStr, 'birth_animal', animal,
              randomScore(), randomScore(), randomScore(), randomScore(), randomScore(),
              '综合运势良好，诸事顺利。',
              '感情运势平稳，真诚相待。',
              '事业运势上扬，努力进取。',
              '财运稳定，理财得当。',
              '健康平安，注意休息。',
              randomColor, randomNumber.toString(), animalAdvice[animal], 'published'
            ]
          );

          if (result.rows.length > 0) {
            insertedRecords.push(result.rows[0]);
          }
        }
      }
    }

    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`);
    res.json({
      success: true,
      message: `批量生成成功，共插入 ${insertedRecords.length} 条记录`,
      data: { count: insertedRecords.length }
    });
  } catch (error: any) {
    console.error('批量生成运势失败:', error);
    res.status(500).json({ success: false, message: '批量生成运势失败', error: error.message });
  }
};
