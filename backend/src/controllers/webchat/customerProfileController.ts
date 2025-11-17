/**
 * 客户画像控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as profileService from '../../services/webchat/customerProfileService';

// 获取客户画像列表
export const getCustomerProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vipLevel, riskScoreMin, riskScoreMax, page, limit } = req.query;

    const params = {
      vipLevel: vipLevel ? Number(vipLevel) : undefined,
      riskScoreMin: riskScoreMin ? Number(riskScoreMin) : undefined,
      riskScoreMax: riskScoreMax ? Number(riskScoreMax) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    };

    const result = await profileService.getCustomerProfiles(params);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 获取单个客户画像
export const getCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const result = await profileService.getCustomerProfile(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// 更新客户画像
export const updateCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const profile = await profileService.updateCustomerProfile(userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// 记录客户行为
export const logCustomerBehavior = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const behavior = await profileService.logCustomerBehavior(req.body);
    res.status(201).json({ success: true, data: behavior });
  } catch (error) {
    next(error);
  }
};

// 获取统计信息
export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await profileService.getCustomerStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// 搜索客户
export const searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }
    const profiles = await profileService.searchCustomers(keyword as string);
    res.json({ success: true, data: profiles });
  } catch (error) {
    next(error);
  }
};
