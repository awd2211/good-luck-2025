/**
 * 邮件测试控制器
 */

import { Request, Response } from 'express'
import { sendTestEmail } from '../services/emailService'

/**
 * 发送测试邮件
 */
export const testEmail = async (req: Request, res: Response) => {
  try {
    const { toEmail, smtpConfig } = req.body

    if (!toEmail) {
      return res.status(400).json({
        success: false,
        message: '请提供接收测试邮件的邮箱地址',
      })
    }

    const result = await sendTestEmail(toEmail, smtpConfig)

    res.json({
      success: true,
      message: '测试邮件已发送，请检查邮箱',
      data: result,
    })
  } catch (error: any) {
    console.error('发送测试邮件失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '发送测试邮件失败',
    })
  }
}
