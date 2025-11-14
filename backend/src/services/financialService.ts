import pool from '../config/database';

export const getFinancialStats = async () => {
  const result = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN status = 'completed' AND DATE(create_time) = CURRENT_DATE THEN amount ELSE 0 END), 0) as today_revenue,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_orders,
      COUNT(CASE WHEN status = 'completed' AND DATE(create_time) = CURRENT_DATE THEN 1 END) as today_orders
    FROM orders
  `);
  
  const stats = result.rows[0];
  stats.avg_order_value = stats.total_orders > 0 ? stats.total_revenue / stats.total_orders : 0;
  
  const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
  stats.total_users = parseInt(usersResult.rows[0].total_users);
  
  return stats;
};

export const getFinancialData = async (startDate?: string, endDate?: string) => {
  const query = `
    SELECT
      DATE(create_time) as date,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as order_count
    FROM orders
    WHERE DATE(create_time) >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
      AND DATE(create_time) <= COALESCE($2::date, CURRENT_DATE)
    GROUP BY DATE(create_time)
    ORDER BY date DESC
  `;
  
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
};
