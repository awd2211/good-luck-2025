#!/bin/bash

# 一键部署脚本 - 构建并启动所有服务

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始一键部署..."
echo "========================================="

# 1. 检查数据库
echo ""
echo ">>> 检查数据库状态..."
./db-cli.sh status

# 2. 构建所有项目
echo ""
echo ">>> 构建所有项目..."
./build.sh

# 3. 启动PM2服务
echo ""
echo ">>> 启动PM2服务..."
./pm2.sh start

echo ""
echo "========================================="
echo "✓ 部署完成！"
echo "========================================="
echo ""
echo "服务地址:"
echo "  - 后端API:      http://localhost:50301"
echo "  - 用户前端:     http://localhost:50302"
echo "  - 管理后台:     http://localhost:50303"
echo ""
echo "常用命令:"
echo "  ./pm2.sh status     # 查看服务状态"
echo "  ./pm2.sh logs       # 查看日志"
echo "  ./pm2.sh restart    # 重启服务"
echo "  ./pm2.sh stop       # 停止服务"
echo ""
