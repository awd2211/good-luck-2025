import { Request, Response } from 'express';
import { getAllFeedbacks, getFeedbackById, createFeedback, updateFeedback, deleteFeedback } from '../services/feedbackService';

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, status, type, priority } = req.query;
    const result = await getAllFeedbacks({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string,
      type: type as string,
      priority: priority as string,
    });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages } });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ success: false, message: '获取反馈列表失败' });
  }
};

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const feedback = await getFeedbackById(parseInt(id));
    if (!feedback) return res.status(404).json({ success: false, message: '反馈不存在' });
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({ success: false, message: '获取反馈失败' });
  }
};

export const addFeedback = async (req: Request, res: Response) => {
  try {
    const feedbackData = req.body;
    if (!feedbackData.title || !feedbackData.content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }
    const newFeedback = await createFeedback(feedbackData);
    res.status(201).json({ success: true, message: '反馈提交成功', data: newFeedback });
  } catch (error) {
    console.error('创建反馈失败:', error);
    res.status(500).json({ success: false, message: '创建反馈失败' });
  }
};

export const modifyFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, handler_comment } = req.body;
    const user = (req as any).user;
    const updatedFeedback = await updateFeedback(parseInt(id), {
      status,
      handler_id: user.id,
      handler_name: user.username,
      handler_comment,
    });
    if (!updatedFeedback) return res.status(404).json({ success: false, message: '反馈不存在' });
    res.json({ success: true, message: '反馈处理成功', data: updatedFeedback });
  } catch (error) {
    console.error('更新反馈失败:', error);
    res.status(500).json({ success: false, message: '更新反馈失败' });
  }
};

export const removeFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteFeedback(parseInt(id));
    if (!success) return res.status(404).json({ success: false, message: '反馈不存在' });
    res.json({ success: true, message: '反馈删除成功' });
  } catch (error) {
    console.error('删除反馈失败:', error);
    res.status(500).json({ success: false, message: '删除反馈失败' });
  }
};
