import { Request, Response } from 'express';
import { getAllCoupons, getCouponById, createCoupon, updateCoupon, updateCouponStatus, deleteCoupon } from '../services/couponService';

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const result = await getAllCoupons({ page: req.query.page ? parseInt(req.query.page as string) : undefined, pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined, status: req.query.status as string });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取优惠券列表失败' });
  }
};

export const getCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await getCouponById(parseInt(req.params.id));
    if (!coupon) return res.status(404).json({ success: false, message: '优惠券不存在' });
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取优惠券失败' });
  }
};

export const addCoupon = async (req: Request, res: Response) => {
  try {
    const newCoupon = await createCoupon(req.body);
    res.status(201).json({ success: true, message: '优惠券创建成功', data: newCoupon });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建优惠券失败' });
  }
};

export const modifyCoupon = async (req: Request, res: Response) => {
  try {
    const updated = await updateCoupon(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ success: false, message: '优惠券不存在' });
    res.json({ success: true, message: '优惠券更新成功', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新优惠券失败' });
  }
};

export const modifyCouponStatus = async (req: Request, res: Response) => {
  try {
    const updated = await updateCouponStatus(parseInt(req.params.id), req.body.status);
    if (!updated) return res.status(404).json({ success: false, message: '优惠券不存在' });
    res.json({ success: true, message: '优惠券状态更新成功', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新优惠券状态失败' });
  }
};

export const removeCoupon = async (req: Request, res: Response) => {
  try {
    const success = await deleteCoupon(parseInt(req.params.id));
    if (!success) return res.status(404).json({ success: false, message: '优惠券不存在' });
    res.json({ success: true, message: '优惠券删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除优惠券失败' });
  }
};
