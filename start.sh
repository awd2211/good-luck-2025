#!/bin/bash

echo "======================================"
echo "  掌握财富运势 - 启动脚本"
echo "======================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js,请先安装 Node.js (>= 16.0.0)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查依赖是否已安装
if [ ! -d "backend/node_modules" ]; then
    echo "📦 正在安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 正在安装前端依赖..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🚀 正在启动服务..."
echo ""

# 启动后端服务 (后台运行)
echo "📡 启动后端服务 (http://localhost:3000)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
sleep 3

# 检查后端是否成功启动
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败,请查看 backend.log"
    exit 1
fi

echo ""

# 启动前端服务 (前台运行)
echo "🌐 启动前端服务 (http://localhost:5173)..."
echo ""
echo "======================================"
echo "  服务已启动!"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:3000"
echo "  按 Ctrl+C 停止服务"
echo "======================================"
echo ""

cd frontend
npm run dev

# 当前端服务停止时,也停止后端服务
echo ""
echo "🛑 正在停止后端服务..."
kill $BACKEND_PID 2>/dev/null
echo "✅ 所有服务已停止"
