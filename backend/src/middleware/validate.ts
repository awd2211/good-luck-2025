import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * 通用验证中间件
 * @param schema Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 验证请求体
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // 格式化错误信息
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          status: 'error',
          message: '请求数据验证失败',
          errors
        });
      }

      // 其他错误
      return res.status(500).json({
        status: 'error',
        message: '服务器内部错误'
      });
    }
  };
};

/**
 * 验证并返回解析后的数据（用于控制器中）
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      throw new Error(`数据验证失败: ${JSON.stringify(errors)}`);
    }
    throw error;
  }
};
