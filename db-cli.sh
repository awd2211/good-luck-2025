#!/bin/bash
# 数据库管理快捷脚本

PGUSER="fortune_user"
PGDB="fortune_db"

case "$1" in
  start)
    echo "启动数据库..."
    docker compose up -d
    ;;
  stop)
    echo "停止数据库..."
    docker compose down
    ;;
  restart)
    echo "重启数据库..."
    docker compose restart postgres
    ;;
  reset)
    echo "重置数据库（将删除所有数据）..."
    read -p "确认要重置吗？(yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      docker compose down -v
      docker compose up -d
      echo "数据库已重置"
    else
      echo "已取消"
    fi
    ;;
  connect)
    echo "连接到数据库..."
    docker compose exec postgres psql -U $PGUSER -d $PGDB
    ;;
  logs)
    echo "查看数据库日志..."
    docker compose logs postgres
    ;;
  status)
    echo "检查数据库状态..."
    docker compose ps postgres
    ;;
  backup)
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "备份数据库到 $BACKUP_FILE..."
    docker compose exec postgres pg_dump -U $PGUSER $PGDB > "$BACKUP_FILE"
    echo "备份完成: $BACKUP_FILE"
    ;;
  users)
    echo "查看用户列表..."
    docker compose exec postgres psql -U $PGUSER -d $PGDB -c "SELECT id, username, phone, status, order_count FROM users;"
    ;;
  orders)
    echo "查看订单列表..."
    docker compose exec postgres psql -U $PGUSER -d $PGDB -c "SELECT order_id, username, fortune_name, amount, status FROM orders ORDER BY create_time DESC;"
    ;;
  banners)
    echo "查看横幅列表..."
    docker compose exec postgres psql -U $PGUSER -d $PGDB -c "SELECT id, title, status, position FROM banners ORDER BY position;"
    ;;
  notifications)
    echo "查看通知列表..."
    docker compose exec postgres psql -U $PGUSER -d $PGDB -c "SELECT id, title, type, status FROM notifications ORDER BY created_at DESC;"
    ;;
  *)
    echo "数据库管理快捷脚本"
    echo ""
    echo "用法: $0 {命令}"
    echo ""
    echo "可用命令:"
    echo "  start          - 启动数据库"
    echo "  stop           - 停止数据库"
    echo "  restart        - 重启数据库"
    echo "  reset          - 重置数据库（删除所有数据并重新初始化）"
    echo "  connect        - 连接到数据库"
    echo "  logs           - 查看数据库日志"
    echo "  status         - 检查数据库状态"
    echo "  backup         - 备份数据库"
    echo "  users          - 查看用户列表"
    echo "  orders         - 查看订单列表"
    echo "  banners        - 查看横幅列表"
    echo "  notifications  - 查看通知列表"
    echo ""
    exit 1
    ;;
esac
