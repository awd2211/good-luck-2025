import { Request, Response } from 'express';
import {
  calculateBirthFortune,
  calculateBazi,
  calculateFlowYear,
  calculateNameScore,
  calculateMarriage
} from '../services/fortuneService';

// 生肖运势
export const getBirthFortune = (req: Request, res: Response) => {
  try {
    const { birthYear, birthMonth, birthDay, birthHour } = req.body;

    if (!birthYear || !birthMonth || !birthDay) {
      return res.status(400).json({ error: '请提供完整的生日信息' });
    }

    const result = calculateBirthFortune({ birthYear, birthMonth, birthDay, birthHour });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '计算失败' });
  }
};

// 八字精批
export const getBaziAnalysis = (req: Request, res: Response) => {
  try {
    const { birthYear, birthMonth, birthDay, birthHour, gender } = req.body;

    if (!birthYear || !birthMonth || !birthDay || !birthHour || !gender) {
      return res.status(400).json({ error: '请提供完整的八字信息' });
    }

    const result = calculateBazi({ birthYear, birthMonth, birthDay, birthHour, gender });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '计算失败' });
  }
};

// 流年运势
export const getFlowYearFortune = (req: Request, res: Response) => {
  try {
    const { birthYear, targetYear } = req.body;

    if (!birthYear || !targetYear) {
      return res.status(400).json({ error: '请提供出生年份和目标年份' });
    }

    const result = calculateFlowYear({ birthYear, targetYear });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '计算失败' });
  }
};

// 姓名详批
export const getNameAnalysis = (req: Request, res: Response) => {
  try {
    const { name, birthYear, birthMonth, birthDay } = req.body;

    if (!name || !birthYear || !birthMonth || !birthDay) {
      return res.status(400).json({ error: '请提供姓名和生日信息' });
    }

    const result = calculateNameScore({ name, birthYear, birthMonth, birthDay });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '计算失败' });
  }
};

// 婚姻分析
export const getMarriageAnalysis = (req: Request, res: Response) => {
  try {
    const {
      person1: { name: name1, birthYear: birthYear1, birthMonth: birthMonth1, birthDay: birthDay1 },
      person2: { name: name2, birthYear: birthYear2, birthMonth: birthMonth2, birthDay: birthDay2 }
    } = req.body;

    if (!name1 || !birthYear1 || !name2 || !birthYear2) {
      return res.status(400).json({ error: '请提供双方的姓名和生日信息' });
    }

    const result = calculateMarriage({
      person1: { name: name1, birthYear: birthYear1, birthMonth: birthMonth1, birthDay: birthDay1 },
      person2: { name: name2, birthYear: birthYear2, birthMonth: birthMonth2, birthDay: birthDay2 }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '计算失败' });
  }
};
