#!/bin/bash

# 生产环境启动脚本
# 端口配置: 后端 60301, 用户前端 60302, 管理后台 60303

echo "========================================="
echo "🚀 生产环境部署"
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

# 构建所有项目
echo "📦 开始构建项目..."
echo ""

echo "1️⃣  构建后端..."
cd backend
npm run build:prod
if [ $? -ne 0 ]; then
    echo "❌ 后端构建失败"
    exit 1
fi
echo "✅ 后端构建完成"
echo ""

echo "2️⃣  构建用户前端..."
cd ../frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 用户前端构建失败"
    exit 1
fi
echo "✅ 用户前端构建完成"
echo ""

echo "3️⃣  构建管理后台..."
cd ../admin-frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 管理后台构建失败"
    exit 1
fi
echo "✅ 管理后台构建完成"
echo ""

# 启动服务
echo "========================================="
echo "🚀 启动生产服务"
echo "========================================="
echo ""

# 停止已存在的PM2进程
echo "停止旧的PM2进程..."
pm2 delete fortune-backend-prod 2>/dev/null || true
pm2 delete fortune-frontend-prod 2>/dev/null || true
pm2 delete fortune-admin-prod 2>/dev/null || true

# 启动后端
echo "1️⃣  启动后端服务 (端口 60301)..."
cd ../backend
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "2️⃣  启动用户前端 (端口 60302)..."
cd ../frontend
pm2 start npm --name "fortune-frontend-prod" -- run preview
pm2 save

echo ""
echo "3️⃣  启动管理后台 (端口 60303)..."
cd ../admin-frontend
pm2 start npm --name "fortune-admin-prod" -- run preview
pm2 save

echo ""
echo "========================================="
echo "✅ 生产环境部署完成！"
echo "========================================="
echo ""
echo "服务访问地址:"
echo "  后端 API:    http://localhost:60301"
echo "  用户前端:    http://localhost:60302"
echo "  管理后台:    http://localhost:60303"
echo "  API 文档:    http://localhost:60301/api-docs"
echo ""
echo "查看运行状态: pm2 status"
echo "查看日志:     pm2 logs"
echo "停止所有服务: pm2 delete all"
echo ""
