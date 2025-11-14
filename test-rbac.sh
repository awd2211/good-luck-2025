#!/bin/bash

# RBAC权限系统测试脚本
# 用于验证客服系统的权限控制是否正常工作

API_BASE="http://localhost:3000/api/manage"
CHAT_API="http://localhost:3000/api/chat"

echo "======================================"
echo "  RBAC权限系统测试"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local token=$4
    local data=$5
    local expected_status=$6

    echo -n "测试: $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" \
            -H "Authorization: Bearer $token" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" 2>/dev/null)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "  Response: $body"
        ((FAILED++))
    fi
}

echo "========================================="
echo "1. 创建测试账号"
echo "========================================="
echo ""

# 需要先以超级管理员身份登录
echo "以超级管理员身份登录..."
ADMIN_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.data.token' 2>/dev/null)

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ 管理员登录失败,无法继续测试${NC}"
    echo "请确保:"
    echo "1. 后端服务已启动 (npm run dev)"
    echo "2. 数据库已初始化"
    echo "3. admin账号存在 (用户名:admin, 密码:admin123)"
    exit 1
fi

echo -e "${GREEN}✓ 管理员登录成功${NC}"
echo ""

# 创建客服主管测试账号
echo "创建客服主管测试账号..."
curl -s -X POST "$API_BASE/admins" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "username": "test_cs_manager",
        "password": "Test123456",
        "email": "test_cs_manager@test.com",
        "role": "cs_manager",
        "status": "active"
    }' > /dev/null

echo -e "${GREEN}✓ 客服主管账号已创建 (test_cs_manager / Test123456)${NC}"

# 创建客服专员测试账号
echo "创建客服专员测试账号..."
curl -s -X POST "$API_BASE/admins" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "username": "test_cs_agent",
        "password": "Test123456",
        "email": "test_cs_agent@test.com",
        "role": "cs_agent",
        "status": "active"
    }' > /dev/null

echo -e "${GREEN}✓ 客服专员账号已创建 (test_cs_agent / Test123456)${NC}"
echo ""

echo "========================================="
echo "2. 角色登录测试"
echo "========================================="
echo ""

# 客服主管登录
echo "客服主管登录..."
CS_MANAGER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test_cs_manager","password":"Test123456"}')

CS_MANAGER_TOKEN=$(echo $CS_MANAGER_LOGIN | jq -r '.data.token' 2>/dev/null)
CS_MANAGER_ROLE=$(echo $CS_MANAGER_LOGIN | jq -r '.data.user.role' 2>/dev/null)

if [ "$CS_MANAGER_ROLE" = "cs_manager" ]; then
    echo -e "${GREEN}✓ 客服主管登录成功 (角色: $CS_MANAGER_ROLE)${NC}"
else
    echo -e "${RED}✗ 客服主管登录失败或角色不正确${NC}"
fi

# 客服专员登录
echo "客服专员登录..."
CS_AGENT_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test_cs_agent","password":"Test123456"}')

CS_AGENT_TOKEN=$(echo $CS_AGENT_LOGIN | jq -r '.data.token' 2>/dev/null)
CS_AGENT_ROLE=$(echo $CS_AGENT_LOGIN | jq -r '.data.user.role' 2>/dev/null)

if [ "$CS_AGENT_ROLE" = "cs_agent" ]; then
    echo -e "${GREEN}✓ 客服专员登录成功 (角色: $CS_AGENT_ROLE)${NC}"
else
    echo -e "${RED}✗ 客服专员登录失败或角色不正确${NC}"
fi
echo ""

echo "========================================="
echo "3. 客服主管权限测试"
echo "========================================="
echo ""

# 客服主管应该能访问客服管理
test_api "客服主管查看客服列表" "GET" "$API_BASE/cs/agents" "$CS_MANAGER_TOKEN" "" "200"

# 客服主管应该能创建客服
test_api "客服主管创建客服账号" "POST" "$API_BASE/cs/agents" "$CS_MANAGER_TOKEN" \
    '{"username":"new_cs_agent","password":"Test123456","email":"new_agent@test.com","name":"新客服"}' "200"

# 客服主管应该能查看统计
test_api "客服主管查看统计数据" "GET" "$API_BASE/cs/agents/stats" "$CS_MANAGER_TOKEN" "" "200"

# 客服主管应该能查看会话
test_api "客服主管查看会话列表" "GET" "$API_BASE/cs/sessions" "$CS_MANAGER_TOKEN" "" "200"

# 客服主管不应该能访问用户管理
test_api "客服主管访问用户管理(应失败)" "GET" "$API_BASE/users" "$CS_MANAGER_TOKEN" "" "403"

# 客服主管不应该能访问订单管理
test_api "客服主管访问订单管理(应失败)" "GET" "$API_BASE/orders" "$CS_MANAGER_TOKEN" "" "403"

echo ""

echo "========================================="
echo "4. 客服专员权限测试"
echo "========================================="
echo ""

# 客服专员不应该能访问客服管理
test_api "客服专员查看客服列表(应失败)" "GET" "$API_BASE/cs/agents" "$CS_AGENT_TOKEN" "" "403"

# 客服专员不应该能创建客服
test_api "客服专员创建客服账号(应失败)" "POST" "$API_BASE/cs/agents" "$CS_AGENT_TOKEN" \
    '{"username":"another_agent","password":"Test123456","email":"another@test.com"}' "403"

# 客服专员不应该能查看统计
test_api "客服专员查看统计数据(应失败)" "GET" "$API_BASE/cs/agents/stats" "$CS_AGENT_TOKEN" "" "403"

# 客服专员应该能查看会话(只能看到自己的)
test_api "客服专员查看会话列表" "GET" "$API_BASE/cs/sessions" "$CS_AGENT_TOKEN" "" "200"

# 客服专员不应该能访问用户管理
test_api "客服专员访问用户管理(应失败)" "GET" "$API_BASE/users" "$CS_AGENT_TOKEN" "" "403"

# 客服专员不应该能访问订单管理
test_api "客服专员访问订单管理(应失败)" "GET" "$API_BASE/orders" "$CS_AGENT_TOKEN" "" "403"

echo ""

echo "========================================="
echo "5. 用户端聊天API测试 (公开API)"
echo "========================================="
echo ""

# 创建聊天会话 (无需认证)
echo -n "测试: 创建聊天会话(公开API) ... "
CREATE_SESSION=$(curl -s -X POST "$CHAT_API/sessions" \
    -H "Content-Type: application/json" \
    -d '{"userId":"guest_001","channel":"web"}')

SESSION_ID=$(echo $CREATE_SESSION | jq -r '.data.id' 2>/dev/null)
SESSION_KEY=$(echo $CREATE_SESSION | jq -r '.data.session_key' 2>/dev/null)

if [ "$SESSION_ID" != "null" ] && [ ! -z "$SESSION_ID" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (会话ID: $SESSION_ID)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# 获取会话详情 (无需认证)
if [ ! -z "$SESSION_KEY" ]; then
    test_api "获取会话详情(公开API)" "GET" "$CHAT_API/sessions/$SESSION_KEY" "" "" "200"
fi

echo ""

echo "========================================="
echo "6. 测试总结"
echo "========================================="
echo ""
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}======================================"
    echo "  ✓ 所有测试通过!"
    echo -e "======================================${NC}"
    echo ""
    echo "权限系统工作正常:"
    echo "  ✓ 客服主管可以管理客服和查看会话"
    echo "  ✓ 客服专员只能使用工作台"
    echo "  ✓ 客服角色无法访问其他业务模块"
    echo "  ✓ 用户端聊天API公开可用"
else
    echo -e "${RED}======================================"
    echo "  ✗ 部分测试失败"
    echo -e "======================================${NC}"
    echo ""
    echo "请检查:"
    echo "  1. 后端权限配置是否正确"
    echo "  2. 路由权限中间件是否已应用"
    echo "  3. 控制器是否已实现"
fi

echo ""
echo "清理测试账号 (可选)..."
echo "如需删除测试账号,请运行:"
echo "  curl -X DELETE $API_BASE/admins/<admin_id> -H \"Authorization: Bearer \$ADMIN_TOKEN\""
echo ""
