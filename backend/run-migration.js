const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 54320,
  database: 'fortune_db',
  user: 'fortune_user',
  password: 'fortune_pass_2025'
});

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'migrations', '013_enhance_notifications.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔄 Running notification enhancement migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');

    // Test if tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('notification_templates', 'user_notification_reads', 'notification_send_logs')
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
