/**
 * Fix banner trigger issue
 *
 * This script fixes the database trigger that was preventing banner updates.
 * The trigger function was looking for 'update_time' field but banners table uses 'updated_at'.
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

async function fixBannerTrigger() {
  const client = await pool.connect();

  try {
    console.log('🔧 开始修复 banner 触发器...\n');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'migrations', 'fix_banner_trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行SQL
    await client.query(sql);

    console.log('✅ Banner 触发器修复成功！');
    console.log('\n现在可以正常编辑和更新横幅了。');

  } catch (error) {
    console.error('❌ 修复失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行修复
fixBannerTrigger()
  .then(() => {
    console.log('\n✨ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 出错了:', error.message);
    process.exit(1);
  });
