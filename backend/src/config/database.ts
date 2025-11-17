import { Pool } from 'pg';
import { config } from './index';

// 创建数据库连接池
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.poolMax,
  min: config.database.poolMin,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  statement_timeout: config.database.statementTimeout, // 查询超时
});

// 连接池事件监听
pool.on('connect', () => {
  console.log('✅ 数据库连接成功');
});

pool.on('acquire', () => {
  const stats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
  if (config.app.isDevelopment) {
    console.log('📊 连接池状态:', stats);
  }
});

pool.on('remove', () => {
  console.log('⚠️ 连接被移除');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err);
});

// 导出查询方法
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('执行查询:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('查询错误:', { text, error });
    throw error;
  }
};

export default pool;
