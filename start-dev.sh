#!/bin/bash

# 开发环境启动脚本
# 端口配置: 后端 50301, 用户前端 50302, 管理后台 50303

echo "========================================="
echo "🚀 启动开发环境"
echo "========================================="
echo ""

# 检查数据库和Redis
echo "📦 检查数据库和Redis..."
if ! docker ps | grep -q fortune-postgres; then
    echo "❌ PostgreSQL未运行，启动中..."
    docker compose up -d postgres
    sleep 3
fi

if ! docker ps | grep -q fortune-redis; then
    echo "❌ Redis未运行，启动中..."
    docker start fortune-redis 2>/dev/null || docker run -d --name fortune-redis -p 6380:6379 redis:7-alpine
    sleep 2
fi

echo "✅ 数据库和Redis已就绪"
echo ""

# 提示用户选择启动哪些服务
echo "请选择要启动的服务:"
echo "1) 只启动后端 (端口 50301)"
echo "2) 只启动用户前端 (端口 50302)"
echo "3) 只启动管理后台 (端口 50303)"
echo "4) 启动后端 + 用户前端"
echo "5) 启动后端 + 管理后台"
echo "6) 启动全部服务"
echo ""
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo "🔧 启动后端服务..."
        cd backend && npm run dev
        ;;
    2)
        echo "🎨 启动用户前端..."
        cd frontend && npm run dev
        ;;
    3)
        echo "🔧 启动管理后台..."
        cd admin-frontend && npm run dev
        ;;
    4)
        echo "🔧 启动后端和用户前端..."
        echo "后端将在新终端启动，请手动启动前端: cd frontend && npm run dev"
        cd backend && npm run dev
        ;;
    5)
        echo "🔧 启动后端和管理后台..."
        echo "后端将在新终端启动，请手动启动管理后台: cd admin-frontend && npm run dev"
        cd backend && npm run dev
        ;;
    6)
        echo "🔧 启动全部服务..."
        echo ""
        echo "请在3个不同的终端窗口中运行以下命令:"
        echo ""
        echo "终端1 (后端):      cd backend && npm run dev"
        echo "终端2 (用户前端):  cd frontend && npm run dev"
        echo "终端3 (管理后台):  cd admin-frontend && npm run dev"
        echo ""
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac
