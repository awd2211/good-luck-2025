// Express类型扩展
declare namespace Express {
  export interface Request {
    user?: {
      id: string
      username: string
      role: string
      email: string
    }
  }
}
