// 天干地支数据
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const WUXING = ['木', '火', '土', '金', '水'];

// 生肖运势评语库
const FORTUNE_TEMPLATES = {
  excellent: ['运势极佳', '贵人相助', '财运亨通', '事业有成'],
  good: ['运势良好', '稳步发展', '小有收获', '平安顺利'],
  medium: ['运势平平', '需要努力', '保持谨慎', '稳中求进'],
  bad: ['运势欠佳', '需要注意', '谨防小人', '低调行事']
};

// 根据年份计算生肖
function getShengxiao(year: number): string {
  const index = (year - 4) % 12;
  return SHENGXIAO[index];
}

// 根据年份计算天干地支
function getGanzhiYear(year: number): string {
  const tianganIndex = (year - 4) % 10;
  const dizhiIndex = (year - 4) % 12;
  return TIANGAN[tianganIndex] + DIZHI[dizhiIndex];
}

// 计算五行
function getWuxing(year: number): string {
  const index = Math.floor(((year - 4) % 10) / 2);
  return WUXING[index];
}

// 生肖运势计算
export function calculateBirthFortune(data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
}) {
  const shengxiao = getShengxiao(data.birthYear);
  const ganzhi = getGanzhiYear(data.birthYear);
  const wuxing = getWuxing(data.birthYear);

  // 简单的运势评分算法（可根据需要优化）
  const score = (data.birthYear + data.birthMonth + data.birthDay) % 100;
  let fortuneLevel: keyof typeof FORTUNE_TEMPLATES;

  if (score >= 80) fortuneLevel = 'excellent';
  else if (score >= 60) fortuneLevel = 'good';
  else if (score >= 40) fortuneLevel = 'medium';
  else fortuneLevel = 'bad';

  return {
    shengxiao,
    ganzhi,
    wuxing,
    score,
    fortune: {
      overall: FORTUNE_TEMPLATES[fortuneLevel][0],
      career: FORTUNE_TEMPLATES[fortuneLevel][1],
      wealth: FORTUNE_TEMPLATES[fortuneLevel][2],
      health: FORTUNE_TEMPLATES[fortuneLevel][3]
    },
    luckyColors: ['红色', '金色', '紫色'],
    luckyNumbers: [6, 8, 9],
    luckyDirections: ['东方', '南方']
  };
}

// 八字精批
export function calculateBazi(data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: string;
}) {
  const yearGanzhi = getGanzhiYear(data.birthYear);
  const shengxiao = getShengxiao(data.birthYear);

  // 简化的八字计算（实际八字计算非常复杂）
  const monthGanzhi = TIANGAN[(data.birthMonth - 1) % 10] + DIZHI[(data.birthMonth - 1) % 12];
  const dayGanzhi = TIANGAN[(data.birthDay - 1) % 10] + DIZHI[(data.birthDay - 1) % 12];
  const hourGanzhi = TIANGAN[(data.birthHour) % 10] + DIZHI[(data.birthHour / 2) % 12];

  return {
    bazi: {
      year: yearGanzhi,
      month: monthGanzhi,
      day: dayGanzhi,
      hour: hourGanzhi
    },
    shengxiao,
    wuxing: {
      wood: Math.floor(Math.random() * 30) + 10,
      fire: Math.floor(Math.random() * 30) + 10,
      earth: Math.floor(Math.random() * 30) + 10,
      metal: Math.floor(Math.random() * 30) + 10,
      water: Math.floor(Math.random() * 30) + 10
    },
    personality: '性格坚毅,处事稳重,有领导才能',
    careerAdvice: '适合从事管理、金融、教育等行业',
    wealthFortune: '财运较好,中年后财富稳定增长',
    healthAdvice: '注意肝脏和心脏健康,保持良好作息'
  };
}

// 流年运势
export function calculateFlowYear(data: { birthYear: number; targetYear: number }) {
  const birthShengxiao = getShengxiao(data.birthYear);
  const targetShengxiao = getShengxiao(data.targetYear);
  const targetGanzhi = getGanzhiYear(data.targetYear);

  const age = data.targetYear - data.birthYear;
  const compatibility = Math.abs((data.targetYear - data.birthYear) % 12 - 6);

  let fortuneLevel: keyof typeof FORTUNE_TEMPLATES;
  if (compatibility <= 2) fortuneLevel = 'excellent';
  else if (compatibility <= 4) fortuneLevel = 'good';
  else if (compatibility <= 5) fortuneLevel = 'medium';
  else fortuneLevel = 'bad';

  return {
    year: data.targetYear,
    ganzhi: targetGanzhi,
    shengxiao: targetShengxiao,
    age,
    birthShengxiao,
    fortune: {
      overall: FORTUNE_TEMPLATES[fortuneLevel][0],
      career: FORTUNE_TEMPLATES[fortuneLevel][1],
      wealth: FORTUNE_TEMPLATES[fortuneLevel][2],
      love: compatibility > 3 ? '桃花运一般' : '桃花运旺盛',
      health: FORTUNE_TEMPLATES[fortuneLevel][3]
    },
    monthlyFortune: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      score: Math.floor(Math.random() * 40) + 60,
      advice: '保持积极心态'
    }))
  };
}

// 姓名详批
export function calculateNameScore(data: {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}) {
  // 简化的姓名笔画计算
  const nameLength = data.name.length;
  const strokeCount = nameLength * 8; // 简化计算

  const score = (strokeCount + data.birthMonth + data.birthDay) % 100;
  const normalizedScore = score < 60 ? score + 30 : score;

  return {
    name: data.name,
    totalScore: normalizedScore,
    scores: {
      tiange: Math.floor(Math.random() * 20) + 80,
      dige: Math.floor(Math.random() * 20) + 80,
      renge: Math.floor(Math.random() * 20) + 80,
      waige: Math.floor(Math.random() * 20) + 80,
      zongge: Math.floor(Math.random() * 20) + 80
    },
    wuxing: {
      primary: WUXING[nameLength % 5],
      secondary: WUXING[(nameLength + 1) % 5]
    },
    personality: '聪明伶俐,善于交际,有艺术天赋',
    careerAdvice: '适合创意、设计、文化类工作',
    suggestions: normalizedScore < 70 ? ['建议改名或加字号', '可佩戴吉祥物品'] : ['名字吉利', '继续保持']
  };
}

// 婚姻分析
export function calculateMarriage(data: {
  person1: { name: string; birthYear: number; birthMonth: number; birthDay: number };
  person2: { name: string; birthYear: number; birthMonth: number; birthDay: number };
}) {
  const shengxiao1 = getShengxiao(data.person1.birthYear);
  const shengxiao2 = getShengxiao(data.person2.birthYear);

  const wuxing1 = getWuxing(data.person1.birthYear);
  const wuxing2 = getWuxing(data.person2.birthYear);

  // 生肖相配度计算
  const zodiacDiff = Math.abs((data.person1.birthYear - data.person2.birthYear) % 12);
  let compatibilityScore: number;

  if (zodiacDiff === 0 || zodiacDiff === 4 || zodiacDiff === 8) {
    compatibilityScore = 95; // 三合
  } else if (zodiacDiff === 6) {
    compatibilityScore = 60; // 相冲
  } else if (zodiacDiff === 3 || zodiacDiff === 9) {
    compatibilityScore = 70; // 相刑
  } else {
    compatibilityScore = 85; // 一般
  }

  return {
    person1: {
      name: data.person1.name,
      shengxiao: shengxiao1,
      wuxing: wuxing1
    },
    person2: {
      name: data.person2.name,
      shengxiao: shengxiao2,
      wuxing: wuxing2
    },
    compatibility: {
      overall: compatibilityScore,
      love: compatibilityScore - 5,
      personality: compatibilityScore + 2,
      career: compatibilityScore - 3
    },
    analysis: {
      strengths: ['性格互补', '志趣相投', '相互扶持'],
      weaknesses: compatibilityScore < 70 ? ['需要磨合', '沟通很重要'] : ['无明显问题'],
      advice: '真诚沟通,相互理解,共同成长'
    },
    result: compatibilityScore >= 85 ? '非常相配' : compatibilityScore >= 70 ? '比较相配' : '需要努力'
  };
}
