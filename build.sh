#!/bin/bash

# 构建脚本 - 构建所有项目

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始构建项目..."
echo "========================================="

# 创建日志目录
mkdir -p logs

# 1. 构建后端
echo ""
echo ">>> 构建后端..."
cd backend
npm run build
cd ..
echo "✓ 后端构建完成"

# 2. 构建用户前端
echo ""
echo ">>> 构建用户前端..."
cd frontend
npm run build
cd ..
echo "✓ 用户前端构建完成"

# 3. 构建管理后台
echo ""
echo ">>> 构建管理后台..."
cd admin-frontend
npm run build
cd ..
echo "✓ 管理后台构建完成"

echo ""
echo "========================================="
echo "✓ 所有项目构建完成！"
echo "========================================="
echo ""
echo "下一步: 运行 ./pm2.sh start 启动所有服务"
echo ""
