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

// 姻缘分析
export function calculateMarriageAnalysis(data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: string;
}) {
  const shengxiao = getShengxiao(data.birthYear);
  const wuxing = getWuxing(data.birthYear);
  const ganzhi = getGanzhiYear(data.birthYear);

  // 根据出生信息计算姻缘评分
  const score = (data.birthYear + data.birthMonth * 10 + data.birthDay) % 100;

  // 计算最佳婚配生肖
  const currentZodiacIndex = (data.birthYear - 4) % 12;
  const bestMatchIndexes = [(currentZodiacIndex + 4) % 12, (currentZodiacIndex + 8) % 12];
  const bestMatches = bestMatchIndexes.map(i => SHENGXIAO[i]);

  return {
    personalInfo: {
      shengxiao,
      wuxing,
      ganzhi,
      gender: data.gender
    },
    marriageScore: score,
    marriageAge: {
      early: '23-27岁',
      middle: '28-32岁',
      late: '33-37岁',
      recommended: score > 70 ? '28-32岁' : '30-35岁'
    },
    bestMatches: {
      zodiac: bestMatches,
      personality: ['温柔体贴', '成熟稳重', '志趣相投'],
      advice: '寻找性格互补、价值观相近的伴侣'
    },
    loveCharacter: {
      strengths: ['专一深情', '真诚待人', '愿意付出'],
      weaknesses: score < 50 ? ['过于理想化', '缺乏主动'] : ['略显固执'],
      suggestion: '保持真诚，主动沟通，珍惜缘分'
    },
    futureOutlook: score >= 70 ? '姻缘美满，白头偕老' : score >= 50 ? '平稳幸福，需要经营' : '姻缘尚可，需多用心'
  };
}

// 姓名配对
export function calculateNameMatch(data: {
  name1: string;
  name2: string;
  birthYear1?: number;
  birthYear2?: number;
}) {
  // 计算姓名笔画数（简化版）
  const getStrokes = (name: string): number => {
    return name.split('').reduce((sum, char) => sum + char.charCodeAt(0) % 20 + 5, 0);
  };

  const strokes1 = getStrokes(data.name1);
  const strokes2 = getStrokes(data.name2);

  // 姓名配对评分
  const strokesDiff = Math.abs(strokes1 - strokes2);
  let matchScore: number;

  if (strokesDiff <= 3) matchScore = 95;
  else if (strokesDiff <= 6) matchScore = 85;
  else if (strokesDiff <= 10) matchScore = 75;
  else matchScore = 65;

  // 如果有生肖信息，加入生肖配对
  if (data.birthYear1 && data.birthYear2) {
    const zodiacDiff = Math.abs((data.birthYear1 - data.birthYear2) % 12);
    if (zodiacDiff === 0 || zodiacDiff === 4 || zodiacDiff === 8) {
      matchScore = Math.min(100, matchScore + 5); // 生肖三合加分
    } else if (zodiacDiff === 6) {
      matchScore = Math.max(60, matchScore - 10); // 生肖相冲减分
    }
  }

  return {
    name1: {
      name: data.name1,
      strokes: strokes1,
      zodiac: data.birthYear1 ? getShengxiao(data.birthYear1) : undefined
    },
    name2: {
      name: data.name2,
      strokes: strokes2,
      zodiac: data.birthYear2 ? getShengxiao(data.birthYear2) : undefined
    },
    matchScore,
    analysis: {
      nameCompatibility: matchScore >= 85 ? '姓名极为相配' : matchScore >= 75 ? '姓名比较相配' : '姓名一般相配',
      relationship: [
        matchScore >= 90 ? '天生一对' : '需要磨合',
        '相互吸引',
        '默契十足'
      ],
      fortune: {
        love: matchScore - 5,
        career: matchScore - 3,
        wealth: matchScore + 2
      },
      advice: matchScore >= 85 ? '珍惜这份缘分，携手共度人生' : '用心经营感情，相互理解包容'
    },
    result: matchScore >= 90 ? '完美匹配' : matchScore >= 80 ? '天作之合' : matchScore >= 70 ? '佳偶天成' : '需要努力'
  };
}

// 财运分析
export function calculateWealth(data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  targetYear?: number;
}) {
  const shengxiao = getShengxiao(data.birthYear);
  const wuxing = getWuxing(data.birthYear);
  const currentYear = data.targetYear || new Date().getFullYear();

  // 财运评分计算
  const baseScore = (data.birthYear + data.birthMonth * 5 + data.birthDay * 3) % 100;
  const yearDiff = currentYear - data.birthYear;
  const cycleBonus = (yearDiff % 12 === 0 || yearDiff % 12 === 6) ? 10 : 0; // 本命年和对冲年有特殊影响

  const wealthScore = Math.min(100, baseScore + cycleBonus);

  return {
    personalInfo: {
      shengxiao,
      wuxing,
      targetYear: currentYear
    },
    wealthScore,
    wealthLevel: wealthScore >= 85 ? '财运亨通' : wealthScore >= 70 ? '财运良好' : wealthScore >= 55 ? '财运平稳' : '需要努力',
    analysis: {
      income: {
        salary: wealthScore >= 75 ? '工资收入稳步上升' : '工资收入平稳',
        investment: wealthScore >= 80 ? '投资机会较多，需谨慎把握' : '投资需谨慎，不宜冒进',
        sideBusiness: wealthScore >= 70 ? '适合发展副业' : '暂不宜开展副业'
      },
      expenditure: {
        necessary: '日常开销适中',
        luxury: wealthScore >= 80 ? '有余力享受生活' : '需控制非必要开支',
        suggestion: '开源节流，理性消费'
      },
      investment: {
        stocks: wealthScore >= 75 ? '可适度参与' : '不建议',
        realEstate: wealthScore >= 80 ? '时机较好' : '需谨慎',
        funds: '稳健选择，建议配置'
      }
    },
    luckyMonths: [
      `${(data.birthMonth + 3) % 12 || 12}月`,
      `${(data.birthMonth + 6) % 12 || 12}月`,
      `${(data.birthMonth + 9) % 12 || 12}月`
    ],
    advice: wealthScore >= 75 ? '把握机遇，稳健投资，财富可期' : '踏实工作，稳扎稳打，积少成多'
  };
}

// 号码吉凶
export function calculateNumberDivination(data: {
  number: string;
  type: 'phone' | 'car' | 'house' | 'other';
}) {
  // 提取数字
  const digits = data.number.replace(/\D/g, '');

  if (!digits || digits.length === 0) {
    throw new Error('号码中必须包含数字');
  }

  // 计算数字之和
  const sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);

  // 计算尾数
  const lastDigit = parseInt(digits[digits.length - 1]);

  // 吉凶评分（基于数字学）
  const luckyDigits = [1, 6, 8, 9];
  const unluckyDigits = [4, 7];

  let score = 70; // 基础分

  // 尾数评分
  if (luckyDigits.includes(lastDigit)) score += 15;
  else if (unluckyDigits.includes(lastDigit)) score -= 10;

  // 总和评分（根据数字学）
  const sumMod = sum % 81; // 81数理
  if ([1, 3, 5, 6, 11, 13, 15, 16, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81].includes(sumMod)) {
    score += 10; // 吉数
  } else if ([2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 27, 28, 34, 36, 40, 42, 43, 44, 46, 49, 50, 53, 54, 55, 56, 58, 59, 60, 62, 64, 66, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80].includes(sumMod)) {
    score -= 5; // 凶数
  }

  // 连号检查
  let hasSequence = false;
  for (let i = 0; i < digits.length - 2; i++) {
    const d1 = parseInt(digits[i]);
    const d2 = parseInt(digits[i + 1]);
    const d3 = parseInt(digits[i + 2]);
    if (d2 === d1 + 1 && d3 === d2 + 1) {
      hasSequence = true;
      score += 5;
      break;
    }
  }

  // 重复数字
  const digitCounts = digits.split('').reduce((acc: Record<string, number>, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const maxRepeat = Math.max(...Object.values(digitCounts));
  if (maxRepeat >= 3) score += 8;

  score = Math.max(40, Math.min(100, score));

  return {
    number: data.number,
    type: data.type,
    score,
    level: score >= 85 ? '大吉' : score >= 75 ? '吉' : score >= 60 ? '中吉' : score >= 50 ? '平' : '凶',
    analysis: {
      digitSum: sum,
      lastDigit,
      mathScore: sumMod,
      features: [
        hasSequence ? '包含连号，财运佳' : undefined,
        maxRepeat >= 3 ? '有重复数字，印象深刻' : undefined,
        luckyDigits.includes(lastDigit) ? '尾数吉利' : undefined
      ].filter(Boolean),
      suitable: score >= 70 ? ['事业发展', '财富积累', '人际关系'] : ['日常使用'],
      unsuitable: score < 60 ? ['重要决策', '商业用途'] : []
    },
    suggestion: score >= 75
      ? '此号码吉祥如意，可放心使用'
      : score >= 60
      ? '此号码中规中矩，可以使用'
      : '建议更换号码或配合其他方式化解'
  };
}

// 紫微斗数
export function calculatePurpleStar(data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: string;
}) {
  const shengxiao = getShengxiao(data.birthYear);
  const wuxing = getWuxing(data.birthYear);
  const ganzhi = getGanzhiYear(data.birthYear);

  // 简化的紫微斗数计算（真实紫微斗数非常复杂）
  const yearPalace = (data.birthYear + data.birthMonth) % 12;
  const dayPalace = (data.birthDay + data.birthHour) % 12;

  const palaces = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '奴仆', '官禄', '田宅', '福德', '父母'];

  // 主星分配（简化版）
  const mainStars = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

  const lifeScore = (data.birthYear + data.birthMonth * 3 + data.birthDay * 2 + data.birthHour) % 100;

  return {
    basicInfo: {
      shengxiao,
      wuxing,
      ganzhi,
      gender: data.gender
    },
    mainStar: mainStars[yearPalace % mainStars.length],
    lifePalace: palaces[yearPalace],
    bodyPalace: palaces[dayPalace],
    score: {
      overall: lifeScore,
      career: (lifeScore + 5) % 100,
      wealth: (lifeScore + 10) % 100,
      marriage: (lifeScore - 5 + 100) % 100,
      health: (lifeScore + 3) % 100
    },
    character: {
      strengths: ['聪明机智', '意志坚定', '善于交际', '富有创造力'],
      weaknesses: ['略显急躁', '追求完美', '压力较大'],
      suitable: ['管理岗位', '创意工作', '自主创业'],
      unsuitable: ['机械重复', '完全听命']
    },
    fortune: {
      youth: '早年辛苦，需要积累',
      middle: '中年渐入佳境，事业有成',
      old: '晚年安稳，儿孙满堂',
      overall: lifeScore >= 75 ? '一生顺遂，福禄双全' : lifeScore >= 60 ? '平步青云，小有成就' : '需要努力，方能成功'
    },
    advice: {
      career: '把握机遇，勇于创新，稳扎稳打',
      wealth: '开源节流，理性投资，积少成多',
      marriage: '真诚相待，相互包容，白头偕老',
      health: '注意休息，适度运动，保持心态'
    },
    luckyElements: {
      colors: ['紫色', '金色', '红色'],
      numbers: [6, 9, 8],
      directions: ['南方', '西方'],
      stones: ['紫水晶', '黄玉', '红玛瑙']
    }
  };
}

/**
 * 命格测算
 */
export function calculateBaziMingge(data: {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  gender: string
}) {
  const shengxiao = SHENGXIAO[(data.birthYear - 4) % 12]
  const wuxing = WUXING[data.birthYear % 5]
  const ganzhi = getGanzhiYear(data.birthYear)

  // 命格等级评分
  const minggeScore = (data.birthYear + data.birthMonth * 5 + data.birthDay * 3 + data.birthHour * 2) % 100

  // 判断命格类型
  let minggeType = ''
  let minggeLevel = ''
  if (minggeScore >= 85) {
    minggeType = '贵格'
    minggeLevel = '上上'
  } else if (minggeScore >= 70) {
    minggeType = '富格'
    minggeLevel = '上中'
  } else if (minggeScore >= 55) {
    minggeType = '福格'
    minggeLevel = '中上'
  } else if (minggeScore >= 40) {
    minggeType = '平格'
    minggeLevel = '中'
  } else {
    minggeType = '劳碌格'
    minggeLevel = '中下'
  }

  return {
    basicInfo: {
      shengxiao,
      wuxing,
      ganzhi,
      gender: data.gender
    },
    mingge: {
      type: minggeType,
      level: minggeLevel,
      score: minggeScore,
      description: minggeType === '贵格' ? '天生贵人相助，容易成就大业' :
        minggeType === '富格' ? '财运亨通，一生衣食无忧' :
        minggeType === '福格' ? '平安喜乐，家庭和睦' :
        minggeType === '平格' ? '平稳安康，需要努力奋斗' : '早年辛苦，中晚年转运'
    },
    lifePhases: {
      youth: minggeScore >= 60 ? '少年得志，学业有成' : '需要刻苦努力，打好基础',
      middle: minggeScore >= 55 ? '中年事业有成，名利双收' : '稳扎稳打，逐步上升',
      old: minggeScore >= 50 ? '晚年安享天伦，福寿绵长' : '需要提前规划，保障晚年'
    },
    strengths: ['意志坚定', '聪明睿智', '善于把握机遇', '领导能力强'],
    weaknesses: ['有时过于自信', '不够耐心', '追求完美'],
    careerSuggestion: minggeScore >= 70 ? ['高级管理', '政府公职', '企业家'] : ['专业技术', '教育培训', '服务行业'],
    wealthFortune: minggeScore >= 65 ? '财运旺盛，投资理财皆宜' : '需要谨慎理财，稳健为主',
    marriageFortune: minggeScore >= 60 ? '姻缘美满，配偶贤惠' : '需要用心经营，互相包容',
    healthFortune: '身体康健，注意劳逸结合',
    advice: '把握命运，积极进取，勤奋努力，方能成就一番事业'
  }
}

/**
 * 生肖配对
 */
export function calculateZodiacMatch(data: {
  birthYear1: number
  birthYear2: number
}) {
  const zodiac1 = SHENGXIAO[(data.birthYear1 - 4) % 12]
  const zodiac2 = SHENGXIAO[(data.birthYear2 - 4) % 12]

  // 生肖配对表（简化版）
  const matchTable: Record<string, Record<string, number>> = {
    '鼠': { '牛': 90, '龙': 95, '猴': 95, '鸡': 85, '狗': 70, '羊': 65, '马': 60, '兔': 75, '虎': 70, '蛇': 80, '猪': 85, '鼠': 75 },
    '牛': { '鼠': 90, '蛇': 95, '鸡': 95, '龙': 85, '羊': 60, '马': 65, '狗': 70, '猴': 75, '虎': 70, '兔': 75, '猪': 80, '牛': 75 },
    '虎': { '猪': 95, '马': 95, '狗': 90, '兔': 85, '龙': 80, '猴': 60, '蛇': 65, '鸡': 70, '牛': 70, '羊': 75, '鼠': 75, '虎': 75 },
    '兔': { '狗': 95, '猪': 90, '羊': 95, '虎': 85, '龙': 70, '鸡': 60, '鼠': 75, '马': 75, '蛇': 75, '牛': 75, '猴': 80, '兔': 75 },
    '龙': { '鼠': 95, '猴': 95, '鸡': 90, '蛇': 85, '虎': 80, '狗': 60, '兔': 70, '猪': 75, '牛': 85, '羊': 75, '马': 75, '龙': 75 },
    '蛇': { '牛': 95, '鸡': 95, '猴': 90, '龙': 85, '虎': 65, '猪': 60, '狗': 70, '羊': 75, '兔': 75, '鼠': 80, '马': 75, '蛇': 75 },
    '马': { '虎': 95, '羊': 95, '狗': 90, '兔': 75, '蛇': 75, '鼠': 60, '牛': 65, '龙': 75, '猴': 75, '鸡': 75, '猪': 80, '马': 75 },
    '羊': { '马': 95, '兔': 95, '猪': 90, '虎': 75, '蛇': 75, '牛': 60, '鼠': 65, '狗': 70, '龙': 75, '猴': 75, '鸡': 75, '羊': 75 },
    '猴': { '鼠': 95, '龙': 95, '蛇': 90, '牛': 75, '兔': 80, '虎': 60, '猪': 70, '羊': 75, '马': 75, '鸡': 75, '狗': 75, '猴': 75 },
    '鸡': { '牛': 95, '蛇': 95, '龙': 90, '鼠': 85, '猴': 75, '兔': 60, '狗': 65, '虎': 70, '马': 75, '羊': 75, '猪': 75, '鸡': 75 },
    '狗': { '虎': 90, '马': 90, '兔': 95, '猴': 75, '蛇': 70, '龙': 60, '鸡': 65, '牛': 70, '羊': 70, '猪': 85, '鼠': 70, '狗': 75 },
    '猪': { '虎': 95, '兔': 90, '羊': 90, '狗': 85, '鼠': 85, '蛇': 60, '猴': 70, '鸡': 75, '牛': 80, '龙': 75, '马': 80, '猪': 75 }
  }

  const matchScore = matchTable[zodiac1]?.[zodiac2] || 75

  let matchLevel = ''
  let matchDescription = ''
  if (matchScore >= 90) {
    matchLevel = '天作之合'
    matchDescription = '你们的生肖配对堪称完美，性格互补，相处融洽，是难得的佳偶。'
  } else if (matchScore >= 80) {
    matchLevel = '良配'
    matchDescription = '你们的配对很好，彼此欣赏，能够共同成长，建立幸福家庭。'
  } else if (matchScore >= 70) {
    matchLevel = '中上'
    matchDescription = '你们的配对不错，虽有小摩擦，但只要互相理解包容，也能幸福美满。'
  } else if (matchScore >= 60) {
    matchLevel = '一般'
    matchDescription = '你们的配对较为普通，需要双方更多的努力和包容才能和谐相处。'
  } else {
    matchLevel = '需努力'
    matchDescription = '你们的配对有一定挑战，需要双方付出更多耐心和理解，方能长久。'
  }

  return {
    person1: { zodiac: zodiac1, birthYear: data.birthYear1 },
    person2: { zodiac: zodiac2, birthYear: data.birthYear2 },
    matchScore,
    matchLevel,
    description: matchDescription,
    strengths: matchScore >= 75 ? ['性格互补', '三观一致', '相互扶持', '共同成长'] : ['能够包容', '愿意改变', '互相学习'],
    challenges: matchScore < 75 ? ['性格差异', '沟通不畅', '价值观不同'] : ['小摩擦难免', '需要磨合'],
    advice: '真诚相待，相互包容，共同经营美好生活',
    luckyThings: {
      colors: ['红色', '金色', '粉色'],
      dates: ['初一', '初八', '十五'],
      activities: ['旅游', '聚餐', '看电影']
    }
  }
}

/**
 * 星座运势
 */
export function calculateStarFortune(data: {
  starSign: string
  period: string
}) {
  const starNames: Record<string, string> = {
    'aries': '白羊座',
    'taurus': '金牛座',
    'gemini': '双子座',
    'cancer': '巨蟹座',
    'leo': '狮子座',
    'virgo': '处女座',
    'libra': '天秤座',
    'scorpio': '天蝎座',
    'sagittarius': '射手座',
    'capricorn': '摩羯座',
    'aquarius': '水瓶座',
    'pisces': '双鱼座'
  }

  const starName = starNames[data.starSign] || data.starSign

  // 生成运势评分
  const hash = data.starSign.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const periodHash = data.period === 'today' ? 1 : data.period === 'week' ? 7 : data.period === 'month' ? 30 : 365
  const seed = (hash + periodHash + new Date().getDate()) % 100

  const loveScore = 60 + (seed % 40)
  const careerScore = 60 + ((seed + 13) % 40)
  const wealthScore = 60 + ((seed + 27) % 40)
  const healthScore = 60 + ((seed + 41) % 40)
  const overallScore = Math.round((loveScore + careerScore + wealthScore + healthScore) / 4)

  const periodName = data.period === 'today' ? '今日' : data.period === 'week' ? '本周' : data.period === 'month' ? '本月' : '今年'

  return {
    starSign: starName,
    period: periodName,
    score: {
      overall: overallScore,
      love: loveScore,
      career: careerScore,
      wealth: wealthScore,
      health: healthScore
    },
    fortune: {
      love: loveScore >= 80 ? '桃花运旺盛，有望遇到心仪对象' : loveScore >= 70 ? '感情平稳，适合增进感情' : '需要主动沟通，避免误会',
      career: careerScore >= 80 ? '工作顺利，有晋升机会' : careerScore >= 70 ? '表现稳定，按部就班' : '需要更加努力，提升能力',
      wealth: wealthScore >= 80 ? '财运亨通，适合投资' : wealthScore >= 70 ? '收入平稳，谨慎理财' : '控制开支，避免浪费',
      health: healthScore >= 80 ? '身体健康，精力充沛' : healthScore >= 70 ? '注意休息，保持运动' : '注意身体，避免过度劳累'
    },
    luckyThings: {
      number: (seed % 9) + 1,
      color: ['红色', '蓝色', '绿色', '紫色', '金色'][seed % 5],
      direction: ['东方', '南方', '西方', '北方'][seed % 4],
      time: data.period === 'today' ? `${(seed % 12) + 6}:00-${((seed % 12) + 7)}:00` : '全天'
    },
    advice: overallScore >= 80 ? '运势极佳，把握机会，大胆行动' : overallScore >= 70 ? '运势良好，稳中求进' : '保持平常心，脚踏实地'
  }
}

/**
 * 星座配对
 */
export function calculateStarMatch(data: {
  starSign1: string
  starSign2: string
}) {
  const starNames: Record<string, string> = {
    'aries': '白羊座',
    'taurus': '金牛座',
    'gemini': '双子座',
    'cancer': '巨蟹座',
    'leo': '狮子座',
    'virgo': '处女座',
    'libra': '天秤座',
    'scorpio': '天蝎座',
    'sagittarius': '射手座',
    'capricorn': '摩羯座',
    'aquarius': '水瓶座',
    'pisces': '双鱼座'
  }

  // 星座配对表（简化版）
  const matchScores: Record<string, Record<string, number>> = {
    'aries': { 'leo': 95, 'sagittarius': 95, 'gemini': 85, 'aquarius': 85, 'libra': 80, 'aries': 75, 'cancer': 60, 'capricorn': 65 },
    'taurus': { 'virgo': 95, 'capricorn': 95, 'cancer': 90, 'pisces': 85, 'taurus': 75, 'scorpio': 80, 'leo': 60, 'aquarius': 65 },
    'gemini': { 'libra': 95, 'aquarius': 95, 'aries': 85, 'leo': 85, 'sagittarius': 80, 'gemini': 75, 'virgo': 60, 'pisces': 65 },
    'cancer': { 'scorpio': 95, 'pisces': 95, 'taurus': 90, 'virgo': 85, 'cancer': 75, 'capricorn': 80, 'aries': 60, 'libra': 65 },
    'leo': { 'aries': 95, 'sagittarius': 95, 'gemini': 85, 'libra': 85, 'aquarius': 80, 'leo': 75, 'taurus': 60, 'scorpio': 65 },
    'virgo': { 'taurus': 95, 'capricorn': 95, 'cancer': 85, 'scorpio': 85, 'pisces': 80, 'virgo': 75, 'gemini': 60, 'sagittarius': 65 },
    'libra': { 'gemini': 95, 'aquarius': 95, 'leo': 85, 'sagittarius': 85, 'aries': 80, 'libra': 75, 'cancer': 65, 'capricorn': 70 },
    'scorpio': { 'cancer': 95, 'pisces': 95, 'virgo': 85, 'capricorn': 85, 'taurus': 80, 'scorpio': 75, 'leo': 65, 'aquarius': 60 },
    'sagittarius': { 'aries': 95, 'leo': 95, 'libra': 85, 'aquarius': 85, 'gemini': 80, 'sagittarius': 75, 'virgo': 65, 'pisces': 60 },
    'capricorn': { 'taurus': 95, 'virgo': 95, 'scorpio': 85, 'pisces': 85, 'cancer': 80, 'capricorn': 75, 'aries': 65, 'libra': 70 },
    'aquarius': { 'gemini': 95, 'libra': 95, 'aries': 85, 'sagittarius': 85, 'leo': 80, 'aquarius': 75, 'taurus': 65, 'scorpio': 60 },
    'pisces': { 'cancer': 95, 'scorpio': 95, 'taurus': 85, 'capricorn': 85, 'virgo': 80, 'pisces': 75, 'gemini': 65, 'sagittarius': 60 }
  }

  const star1 = starNames[data.starSign1] || data.starSign1
  const star2 = starNames[data.starSign2] || data.starSign2

  const matchScore = matchScores[data.starSign1]?.[data.starSign2] || 75

  let matchLevel = ''
  if (matchScore >= 90) matchLevel = '绝配'
  else if (matchScore >= 80) matchLevel = '很合适'
  else if (matchScore >= 70) matchLevel = '比较合适'
  else if (matchScore >= 60) matchLevel = '需要磨合'
  else matchLevel = '挑战较大'

  return {
    person1: { starSign: star1 },
    person2: { starSign: star2 },
    matchScore,
    matchLevel,
    compatibility: {
      love: matchScore >= 85 ? '爱情指数极高，彼此吸引' : matchScore >= 70 ? '爱情甜蜜，相处融洽' : '需要用心经营',
      friendship: matchScore >= 80 ? '友情深厚，志同道合' : matchScore >= 65 ? '友谊稳定，互相支持' : '需要互相理解',
      cooperation: matchScore >= 85 ? '合作默契，配合完美' : matchScore >= 70 ? '合作顺利，优势互补' : '需要加强沟通'
    },
    strengths: matchScore >= 75 ? ['性格互补', '三观一致', '相互吸引', '共同话题多'] : ['能够包容', '愿意改变'],
    challenges: matchScore < 75 ? ['性格差异大', '沟通需要耐心', '价值观不同'] : ['偶尔小摩擦', '需要磨合'],
    advice: matchScore >= 80 ? '珍惜彼此，共同成长，前途光明' : '多沟通理解，包容差异，用心经营'
  }
}

/**
 * 起名宝典
 */
export function calculateNameBaby(data: {
  lastName: string
  gender: string
  birthYear: number
  birthMonth: number
  birthDay: number
}) {
  const shengxiao = SHENGXIAO[(data.birthYear - 4) % 12]
  const wuxing = WUXING[data.birthYear % 5]

  // 根据性别推荐名字
  const maleNames = [
    { name: '俊杰', score: 96, meaning: '才智出众，品德高尚' },
    { name: '浩然', score: 95, meaning: '胸怀宽广，正气凛然' },
    { name: '宇轩', score: 94, meaning: '气宇轩昂，前程似锦' },
    { name: '睿哲', score: 93, meaning: '聪明睿智，富有哲理' },
    { name: '博文', score: 92, meaning: '学识渊博，文采斐然' }
  ]

  const femaleNames = [
    { name: '雨萱', score: 96, meaning: '清新脱俗，优雅端庄' },
    { name: '诗涵', score: 95, meaning: '富有诗意，内涵丰富' },
    { name: '婉瑜', score: 94, meaning: '温婉贤淑，美玉无瑕' },
    { name: '梦琪', score: 93, meaning: '如梦似幻，美好珍贵' },
    { name: '欣怡', score: 92, meaning: '欣欣向荣，怡然自得' }
  ]

  const recommendedNames = data.gender === 'male' ? maleNames : femaleNames

  return {
    basicInfo: {
      lastName: data.lastName,
      gender: data.gender === 'male' ? '男' : '女',
      shengxiao,
      wuxing,
      birthDate: `${data.birthYear}年${data.birthMonth}月${data.birthDay}日`
    },
    recommendedNames: recommendedNames.map(item => ({
      fullName: data.lastName + item.name,
      firstName: item.name,
      score: item.score,
      meaning: item.meaning,
      wuxing: wuxing,
      lucky: '吉'
    })),
    namingPrinciples: [
      '音韵和谐，朗朗上口',
      '寓意美好，富有内涵',
      '符合生辰八字',
      '笔画吉利，五格相宜',
      '避免谐音不雅'
    ],
    suggestions: `根据宝宝的生辰八字，五行属${wuxing}，生肖属${shengxiao}。以上推荐的名字都经过精心挑选，音韵和谐，寓意美好，非常适合您的宝宝。`,
    luckyElements: {
      colors: wuxing === '金' ? ['白色', '金色'] : wuxing === '木' ? ['绿色', '青色'] : wuxing === '水' ? ['黑色', '蓝色'] : wuxing === '火' ? ['红色', '紫色'] : ['黄色', '棕色'],
      numbers: [6, 8, 9],
      directions: wuxing === '金' ? ['西方'] : wuxing === '木' ? ['东方'] : wuxing === '水' ? ['北方'] : wuxing === '火' ? ['南方'] : ['中央']
    }
  }
}

/**
 * 事业运势
 */
export function calculateCareer(data: {
  birthYear: number
  birthMonth: number
  birthDay: number
  currentJob?: string
  targetYear: number
}) {
  const shengxiao = SHENGXIAO[(data.birthYear - 4) % 12]
  const wuxing = WUXING[data.birthYear % 5]
  const age = data.targetYear - data.birthYear

  // 计算事业运势评分
  const careerScore = (data.birthYear + data.birthMonth * 7 + data.birthDay * 5 + data.targetYear) % 100

  let careerLevel = ''
  let careerDescription = ''
  if (careerScore >= 85) {
    careerLevel = '大吉'
    careerDescription = '事业运势极佳，升职加薪指日可待，是大展拳脚的好时机'
  } else if (careerScore >= 70) {
    careerLevel = '上吉'
    careerDescription = '事业稳步上升，工作顺利，有贵人相助，前景光明'
  } else if (careerScore >= 55) {
    careerLevel = '中吉'
    careerDescription = '事业平稳发展，虽有小挫折，但总体向好，需耐心努力'
  } else if (careerScore >= 40) {
    careerLevel = '平稳'
    careerDescription = '事业较为平淡，需要积极主动，抓住机遇，才能突破'
  } else {
    careerLevel = '需努力'
    careerDescription = '事业面临挑战，需要加倍努力，调整心态，迎难而上'
  }

  return {
    basicInfo: {
      shengxiao,
      wuxing,
      age,
      currentJob: data.currentJob || '未提供',
      targetYear: data.targetYear
    },
    careerFortune: {
      score: careerScore,
      level: careerLevel,
      description: careerDescription
    },
    yearlyFortune: {
      Q1: careerScore >= 70 ? '开局良好，把握机会' : '需要耐心，稳扎稳打',
      Q2: careerScore >= 65 ? '稳步上升，表现突出' : '保持努力，积累经验',
      Q3: careerScore >= 60 ? '迎来高峰，大展拳脚' : '坚持不懈，终有收获',
      Q4: careerScore >= 55 ? '收获满满，再接再厉' : '总结经验，准备来年'
    },
    opportunities: careerScore >= 70 ? ['升职加薪', '项目负责人', '跨部门调动', '培训学习'] : ['提升技能', '拓展人脉', '参与项目'],
    challenges: careerScore < 70 ? ['竞争压力', '工作量大', '需要学习新技能'] : ['维持现有成绩', '平衡工作生活'],
    suitableIndustries: wuxing === '金' ? ['金融', '科技', '管理'] : wuxing === '木' ? ['教育', '文化', '医疗'] : wuxing === '水' ? ['贸易', '物流', '咨询'] : wuxing === '火' ? ['传媒', '艺术', '餐饮'] : ['房地产', '农业', '制造'],
    advice: {
      workStyle: careerScore >= 70 ? '积极主动，勇于创新，把握机遇' : '稳扎稳打，持续学习，提升能力',
      networking: '多参加行业活动，拓展人脉资源，寻找合作机会',
      learning: '关注行业趋势，学习新技能，保持竞争力',
      balance: '注意工作与生活平衡，保持身心健康，可持续发展'
    },
    luckyMonths: [3, 6, 9, 11].filter(() => Math.random() > 0.3)
  }
}
