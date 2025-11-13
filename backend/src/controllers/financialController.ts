import { Request, Response } from 'express';
import { getFinancialStats, getFinancialData } from '../services/financialService';

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getFinancialStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取财务统计失败:', error);
    res.status(500).json({ success: false, message: '获取财务统计失败' });
  }
};

export const getData = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    const data = await getFinancialData(start_date as string, end_date as string);
    res.json({ success: true, data });
  } catch (error) {
    console.error('获取财务数据失败:', error);
    res.status(500).json({ success: false, message: '获取财务数据失败' });
  }
};
