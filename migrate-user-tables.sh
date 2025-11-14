#!/bin/bash

# 数据库迁移脚本 - 创建用户端所需的表

set -e

echo "=========================================="
echo "用户端数据库迁移"
echo "=========================================="
echo ""

# 数据库连接信息
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54320}"
DB_NAME="${DB_NAME:-fortune_db}"
DB_USER="${DB_USER:-fortune_user}"
DB_PASSWORD="${DB_PASSWORD:-fortune_pass_2025}"

# 迁移文件
MIGRATION_FILE="backend/migrations/015_create_user_tables.sql"

# 检查迁移文件是否存在
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ 迁移文件不存在: $MIGRATION_FILE"
    exit 1
fi

echo "📋 迁移文件: $MIGRATION_FILE"
echo "🔗 数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 检查数据库是否运行
echo "🔍 检查数据库连接..."
docker compose ps postgres > /dev/null 2>&1 || {
    echo "❌ 数据库未运行，正在启动..."
    docker compose up -d postgres
    echo "⏳ 等待数据库启动..."
    sleep 5
}

# 执行迁移
echo "🚀 开始执行迁移..."
echo ""

# 使用 docker exec 执行 SQL
docker compose exec -T postgres psql -U $DB_USER -d $DB_NAME < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 迁移成功完成！"
    echo ""
    echo "已创建/更新的表："
    echo "  - users (添加 nickname, avatar, password_hash, balance 字段)"
    echo "  - fortunes (算命服务表)"
    echo "  - cart_items (购物车表)"
    echo "  - favorites (收藏表)"
    echo "  - browse_history (浏览历史表)"
    echo ""
    echo "已插入示例数据："
    echo "  - 8个算命服务（生肖、八字、流年、姓名、合婚等）"
    echo ""
    echo "下一步："
    echo "  1. 启动后端: cd backend && npm run dev"
    echo "  2. 运行测试: ./test-user-api.sh"
    echo ""
else
    echo ""
    echo "❌ 迁移失败！"
    echo "请检查错误信息并重试"
    exit 1
fi
