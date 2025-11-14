import { Request, Response } from 'express'
import { query } from '../../config/database'

/**
 * 获取用户协议
 */
export const getUserAgreement = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT config_value, updated_at FROM system_configs WHERE config_key = $1',
      ['user_agreement']
    )

    const config = result.rows[0]
    const content = config?.config_value as any

    res.json({
      success: true,
      data: {
        title: '用户协议',
        content: content?.content || '暂无用户协议内容',
        updatedAt: config?.updated_at,
      },
    })
  } catch (error) {
    console.error('获取用户协议失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户协议失败',
    })
  }
}

/**
 * 获取隐私政策
 */
export const getPrivacyPolicy = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT config_value, updated_at FROM system_configs WHERE config_key = $1',
      ['privacy_policy']
    )

    const config = result.rows[0]
    const content = config?.config_value as any

    res.json({
      success: true,
      data: {
        title: '隐私政策',
        content: content?.content || '暂无隐私政策内容',
        updatedAt: config?.updated_at,
      },
    })
  } catch (error) {
    console.error('获取隐私政策失败:', error)
    res.status(500).json({
      success: false,
      message: '获取隐私政策失败',
    })
  }
}
