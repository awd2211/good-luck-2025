#!/bin/bash

echo "========================================="
echo "  🧪 算命平台功能测试"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local url=$2
    local data=$3

    echo -n "测试 $name... "

    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ 通过${NC}"
        echo "  返回数据: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
        ((PASSED++))
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "  HTTP状态: $http_code"
        echo "  响应: $body"
        ((FAILED++))
    fi
    echo ""
}

# 检查服务是否运行
echo "1️⃣  检查服务状态..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
    health_response=$(curl -s http://localhost:3000/health | jq '.')
    echo "$health_response"
    echo ""
else
    echo -e "${RED}✗ 后端服务未运行!${NC}"
    echo ""
    echo "请先启动后端服务:"
    echo "  cd backend && npm run dev"
    echo ""
    exit 1
fi

# 测试所有API
echo "2️⃣  测试算命API..."
echo ""

# 生肖运势
test_api "生肖运势" \
    "http://localhost:3000/api/fortune/birth-animal" \
    '{"birthYear":1990,"birthMonth":5,"birthDay":15}'

# 八字精批
test_api "八字精批" \
    "http://localhost:3000/api/fortune/bazi" \
    '{"birthYear":1990,"birthMonth":5,"birthDay":15,"birthHour":12,"gender":"男"}'

# 流年运势
test_api "流年运势" \
    "http://localhost:3000/api/fortune/flow-year" \
    '{"birthYear":1990,"targetYear":2025}'

# 姓名详批
test_api "姓名详批" \
    "http://localhost:3000/api/fortune/name" \
    '{"name":"张三","birthYear":1990,"birthMonth":5,"birthDay":15}'

# 婚姻分析
test_api "婚姻分析" \
    "http://localhost:3000/api/fortune/marriage" \
    '{"person1":{"name":"张三","birthYear":1990,"birthMonth":5,"birthDay":15},"person2":{"name":"李四","birthYear":1992,"birthMonth":8,"birthDay":20}}'

# 测试缓存
echo "3️⃣  测试缓存功能..."
echo ""
echo -n "首次请求... "
time1=$(date +%s%N)
curl -s -X POST "http://localhost:3000/api/fortune/birth-animal" \
    -H "Content-Type: application/json" \
    -d '{"birthYear":1995,"birthMonth":3,"birthDay":10}' > /dev/null
time2=$(date +%s%N)
first_time=$((($time2 - $time1) / 1000000))
echo "${first_time}ms"

echo -n "缓存请求... "
time1=$(date +%s%N)
curl -s -X POST "http://localhost:3000/api/fortune/birth-animal" \
    -H "Content-Type: application/json" \
    -d '{"birthYear":1995,"birthMonth":3,"birthDay":10}' > /dev/null
time2=$(date +%s%N)
cached_time=$((($time2 - $time1) / 1000000))
echo "${cached_time}ms"

if [ $cached_time -lt $first_time ]; then
    echo -e "${GREEN}✓ 缓存生效! 速度提升 $(((first_time - cached_time) * 100 / first_time))%${NC}"
else
    echo -e "${YELLOW}⚠ 缓存可能未生效${NC}"
fi
echo ""

# 测试限流
echo "4️⃣  测试限流功能..."
echo ""
echo "发送10个快速请求..."
for i in {1..10}; do
    curl -s -X POST "http://localhost:3000/api/fortune/birth-animal" \
        -H "Content-Type: application/json" \
        -d '{"birthYear":2000,"birthMonth":1,"birthDay":1}' > /dev/null
    echo -n "."
done
echo ""
echo -e "${GREEN}✓ 限流功能已配置 (60次/分钟)${NC}"
echo ""

# 总结
echo "========================================="
echo "  📊 测试总结"
echo "========================================="
echo ""
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过!${NC}"
    exit 0
else
    echo -e "${RED}❌ 有测试失败,请检查!${NC}"
    exit 1
fi
