import { Request, Response, NextFunction } from 'express';

// 自定义错误类
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 异步错误包装器
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 全局错误处理中间件
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // 生产环境不暴露详细错误信息
  const errorResponse: any = {
    status: 'error',
    message,
  };

  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  // 记录非操作性错误
  if (!isOperational) {
    console.error('❌ 未处理的错误:', err);
  }

  res.status(statusCode).json(errorResponse);
};

// 404 处理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`无法找到路径: ${req.originalUrl}`, 404);
  next(error);
};

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
