/**
 * 执行通知系统增强迁移
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 54320,
  database: 'fortune_db',
  user: 'fortune_user',
  password: 'fortune_pass_2025',
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始通知系统增强迁移...\n');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'migrations', '013_enhance_notifications.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行SQL
    await client.query(sql);

    console.log('✅ 通知系统增强迁移成功！');
    console.log('\n已添加功能：');
    console.log('  1. ✅ 通知模板表 (notification_templates)');
    console.log('  2. ✅ 用户阅读记录表 (user_notification_reads)');
    console.log('  3. ✅ 通知发送日志表 (notification_send_logs)');
    console.log('  4. ✅ 定时发送功能字段');
    console.log('  5. ✅ 通知统计视图');
    console.log('  6. ✅ 5个预设通知模板');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行迁移
runMigration()
  .then(() => {
    console.log('\n✨ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 出错了:', error.message);
    process.exit(1);
  });
