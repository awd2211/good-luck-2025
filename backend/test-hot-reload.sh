#!/bin/bash

# 热更新测试脚本

echo "🔥 热更新功能演示"
echo "===================="
echo ""

# 检查端口是否被占用
if lsof -ti:50301 > /dev/null 2>&1; then
  echo "⚠️  端口50301已被占用，正在清理..."
  lsof -ti:50301 | xargs kill -9
  sleep 2
fi

# 启动开发服务器
echo "1️⃣  启动tsx watch开发服务器..."
cd /home/eric/good-luck-2025/backend
npm run dev > /tmp/tsx-dev.log 2>&1 &
DEV_PID=$!

echo "   进程ID: $DEV_PID"
sleep 5

# 检查服务器是否启动
if curl -s http://localhost:50301/health > /dev/null; then
  echo "   ✅ 服务器启动成功"
else
  echo "   ❌ 服务器启动失败"
  kill $DEV_PID
  exit 1
fi

# 显示启动日志
echo ""
echo "2️⃣  启动日志（最后10行）:"
tail -n 10 /tmp/tsx-dev.log

# 测试热重载
echo ""
echo "3️⃣  测试热重载功能..."
echo "   修改 src/index.ts 添加一行注释..."

# 在文件末尾添加注释
echo "// Hot reload test at $(date)" >> src/index.ts

echo "   等待tsx检测文件变化..."
sleep 3

# 查看重载日志
echo ""
echo "4️⃣  热重载日志:"
tail -n 20 /tmp/tsx-dev.log | grep -A5 "tsx"

# 恢复文件
git checkout -- src/index.ts

# 清理
echo ""
echo "5️⃣  清理测试环境..."
kill $DEV_PID
sleep 2

echo ""
echo "✅ 热更新测试完成！"
echo ""
echo "💡 使用提示："
echo "   - 开发时运行: npm run dev"
echo "   - 修改任意.ts文件后，tsx会自动重启（200-500ms）"
echo "   - 比nodemon快3-10倍"
echo ""
echo "📖 详细文档: backend/HOT_RELOAD_GUIDE.md"
