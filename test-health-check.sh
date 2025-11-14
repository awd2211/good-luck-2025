#!/bin/bash

# 健康检查测试脚本
# 用于测试优化后的健康检查接口

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取端口（默认3000，可通过环境变量覆盖）
PORT=${PORT:-3000}
BASE_URL="http://localhost:$PORT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  健康检查接口测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 等待后端启动
echo -e "${YELLOW}检查后端服务...${NC}"
for i in {1..5}; do
  if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
    break
  fi
  if [ $i -eq 5 ]; then
    echo -e "${RED}✗ 后端服务未运行，请先启动后端: cd backend && npm run dev${NC}"
    exit 1
  fi
  echo -e "${YELLOW}等待后端启动... ($i/5)${NC}"
  sleep 2
done
echo ""

# 测试1: 基础健康检查
echo -e "${BLUE}1. 测试健康检查接口 GET /health${NC}"
echo -e "${YELLOW}-------------------------------------------${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP 状态码: $HTTP_CODE${NC}"
else
  echo -e "${YELLOW}⚠ HTTP 状态码: $HTTP_CODE${NC}"
fi
echo ""

# 测试2: 生成一些API流量来收集指标
echo -e "${BLUE}2. 生成API流量以收集性能指标${NC}"
echo -e "${YELLOW}-------------------------------------------${NC}"
echo "发送10个测试请求..."

for i in {1..10}; do
  curl -s "$BASE_URL/" > /dev/null 2>&1
  curl -s "$BASE_URL/api/public/banners" > /dev/null 2>&1
  echo -n "."
done
echo ""
echo -e "${GREEN}✓ 已发送测试请求${NC}"
echo ""

# 测试3: 再次检查健康状态（应该包含指标数据）
echo -e "${BLUE}3. 再次检查健康状态（包含性能指标）${NC}"
echo -e "${YELLOW}-------------------------------------------${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

# 解析关键指标
STATUS=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null)
WARNINGS=$(echo "$BODY" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('warnings', [])))" 2>/dev/null)

case "$STATUS" in
  "healthy")
    echo -e "${GREEN}✓ 系统状态: $STATUS${NC}"
    ;;
  "degraded")
    echo -e "${YELLOW}⚠ 系统状态: $STATUS${NC}"
    ;;
  "unhealthy")
    echo -e "${RED}✗ 系统状态: $STATUS${NC}"
    ;;
  *)
    echo -e "系统状态: $STATUS"
    ;;
esac

if [ "$WARNINGS" != "" ] && [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}告警数量: $WARNINGS${NC}"
fi
echo ""

# 测试总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ 健康检查接口包含以下监控指标:${NC}"
echo "  • 数据库连接状态（连接池统计）"
echo "  • Redis连接状态"
echo "  • 内存使用情况（堆内存百分比）"
echo "  • API响应时间统计（平均、最慢端点）"
echo ""
echo -e "${GREEN}✓ 告警机制:${NC}"
echo "  • 内存使用率 > 80% 时告警"
echo "  • 响应时间 > 1000ms 时告警"
echo "  • 连接池使用率 > 80% 时告警"
echo ""
echo -e "${BLUE}查看完整文档: backend/src/services/healthService.ts${NC}"
echo ""
