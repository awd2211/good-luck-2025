import { Request, Response } from 'express';
import { getAllReviews, getReviewById, createReview, updateReviewStatus, replyToReview, deleteReview } from '../services/reviewService';

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, status } = req.query;
    const result = await getAllReviews({ page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined, status: status as string });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取评价列表失败' });
  }
};

export const getReview = async (req: Request, res: Response) => {
  try {
    const review = await getReviewById(parseInt(req.params.id));
    if (!review) return res.status(404).json({ success: false, message: '评价不存在' });
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取评价失败' });
  }
};

export const addReview = async (req: Request, res: Response) => {
  try {
    const newReview = await createReview(req.body);
    res.status(201).json({ success: true, message: '评价创建成功', data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建评价失败' });
  }
};

export const modifyReviewStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await updateReviewStatus(parseInt(req.params.id), status);
    if (!updated) return res.status(404).json({ success: false, message: '评价不存在' });
    res.json({ success: true, message: '评价状态更新成功', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新评价状态失败' });
  }
};

export const handleReplyReview = async (req: Request, res: Response) => {
  try {
    const { reply_content } = req.body;
    const updated = await replyToReview(parseInt(req.params.id), reply_content);
    if (!updated) return res.status(404).json({ success: false, message: '评价不存在' });
    res.json({ success: true, message: '回复成功', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '回复评价失败' });
  }
};

export const removeReview = async (req: Request, res: Response) => {
  try {
    const success = await deleteReview(parseInt(req.params.id));
    if (!success) return res.status(404).json({ success: false, message: '评价不存在' });
    res.json({ success: true, message: '评价删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除评价失败' });
  }
};
