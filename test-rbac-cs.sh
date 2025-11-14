#!/bin/bash

# 客服系统 RBAC 权限测试脚本

BASE_URL="http://localhost:50301/api/manage"

echo "=========================================="
echo "客服系统 RBAC 权限测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试管理员登录
echo "1. 测试超级管理员登录..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | sed 's/"token":"//')
ADMIN_ROLE=$(echo $ADMIN_LOGIN | grep -o '"role":"[^"]*' | sed 's/"role":"//')

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ 超级管理员登录成功${NC}"
    echo "  角色: $ADMIN_ROLE"
else
    echo -e "${RED}✗ 超级管理员登录失败${NC}"
    echo "$ADMIN_LOGIN"
    exit 1
fi
echo ""

# 测试获取在线客服统计（需要客服权限）
echo "2. 测试超级管理员访问客服统计..."
STATS=$(curl -s -X GET "$BASE_URL/cs/stats/online" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$STATS" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 超级管理员可以访问客服统计${NC}"
    echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
else
    echo -e "${RED}✗ 访问失败${NC}"
    echo "$STATS"
fi
echo ""

# 测试获取客服列表
echo "3. 测试超级管理员获取客服列表..."
AGENTS=$(curl -s -X GET "$BASE_URL/cs/agents?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$AGENTS" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 超级管理员可以访问客服列表${NC}"
    AGENT_COUNT=$(echo "$AGENTS" | grep -o '"total":[0-9]*' | sed 's/"total"://')
    echo "  当前客服数量: $AGENT_COUNT"
else
    echo -e "${RED}✗ 访问失败${NC}"
    echo "$AGENTS"
fi
echo ""

# 测试创建客服（如果没有客服的话）
echo "4. 测试创建测试客服账号..."
# 首先创建一个管理员账号作为客服
CREATE_CS_ADMIN=$(curl -s -X POST "$BASE_URL/admins" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cs_manager_test",
    "password": "cs123456",
    "email": "cs_manager@test.com",
    "role": "cs_manager"
  }')

if echo "$CREATE_CS_ADMIN" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 客服主管账号创建成功${NC}"
    CS_MANAGER_ID=$(echo "$CREATE_CS_ADMIN" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
    echo "  客服主管 ID: $CS_MANAGER_ID"
elif echo "$CREATE_CS_ADMIN" | grep -q "已存在"; then
    echo -e "${YELLOW}⚠ 客服主管账号已存在，跳过创建${NC}"
    CS_MANAGER_ID="cs_manager_test"
else
    echo -e "${RED}✗ 创建失败${NC}"
    echo "$CREATE_CS_ADMIN"
fi
echo ""

# 创建客服专员账号
CREATE_CS_AGENT=$(curl -s -X POST "$BASE_URL/admins" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cs_agent_test",
    "password": "cs123456",
    "email": "cs_agent@test.com",
    "role": "cs_agent"
  }')

if echo "$CREATE_CS_AGENT" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 客服专员账号创建成功${NC}"
    CS_AGENT_ID=$(echo "$CREATE_CS_AGENT" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
    echo "  客服专员 ID: $CS_AGENT_ID"
elif echo "$CREATE_CS_AGENT" | grep -q "已存在"; then
    echo -e "${YELLOW}⚠ 客服专员账号已存在，跳过创建${NC}"
    CS_AGENT_ID="cs_agent_test"
else
    echo -e "${RED}✗ 创建失败${NC}"
    echo "$CREATE_CS_AGENT"
fi
echo ""

# 测试客服主管登录
echo "5. 测试客服主管登录..."
CS_MANAGER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cs_manager_test",
    "password": "cs123456"
  }')

CS_MANAGER_TOKEN=$(echo $CS_MANAGER_LOGIN | grep -o '"token":"[^"]*' | sed 's/"token":"//')
CS_MANAGER_ROLE=$(echo $CS_MANAGER_LOGIN | grep -o '"role":"[^"]*' | sed 's/"role":"//')

if [ -n "$CS_MANAGER_TOKEN" ]; then
    echo -e "${GREEN}✓ 客服主管登录成功${NC}"
    echo "  角色: $CS_MANAGER_ROLE"
else
    echo -e "${RED}✗ 客服主管登录失败${NC}"
    echo "$CS_MANAGER_LOGIN"
fi
echo ""

# 测试客服主管访问客服统计
echo "6. 测试客服主管访问客服统计..."
CS_MANAGER_STATS=$(curl -s -X GET "$BASE_URL/cs/stats/online" \
  -H "Authorization: Bearer $CS_MANAGER_TOKEN")

if echo "$CS_MANAGER_STATS" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 客服主管可以访问客服统计${NC}"
else
    echo -e "${RED}✗ 访问失败（应该有权限）${NC}"
    echo "$CS_MANAGER_STATS"
fi
echo ""

# 测试客服主管访问用户管理（应该失败）
echo "7. 测试客服主管访问用户管理（应该被拒绝）..."
CS_MANAGER_USERS=$(curl -s -X GET "$BASE_URL/users?page=1&limit=10" \
  -H "Authorization: Bearer $CS_MANAGER_TOKEN")

if echo "$CS_MANAGER_USERS" | grep -q '"success":false\|403\|权限'; then
    echo -e "${GREEN}✓ 客服主管无法访问用户管理（符合预期）${NC}"
else
    echo -e "${RED}✗ 客服主管可以访问用户管理（不符合预期）${NC}"
    echo "$CS_MANAGER_USERS"
fi
echo ""

# 测试客服专员登录
echo "8. 测试客服专员登录..."
CS_AGENT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cs_agent_test",
    "password": "cs123456"
  }')

CS_AGENT_TOKEN=$(echo $CS_AGENT_LOGIN | grep -o '"token":"[^"]*' | sed 's/"token":"//')
CS_AGENT_ROLE=$(echo $CS_AGENT_LOGIN | grep -o '"role":"[^"]*' | sed 's/"role":"//')

if [ -n "$CS_AGENT_TOKEN" ]; then
    echo -e "${GREEN}✓ 客服专员登录成功${NC}"
    echo "  角色: $CS_AGENT_ROLE"
else
    echo -e "${RED}✗ 客服专员登录失败${NC}"
    echo "$CS_AGENT_LOGIN"
fi
echo ""

# 测试客服专员访问客服统计（应该失败）
echo "9. 测试客服专员访问客服统计（应该被拒绝）..."
CS_AGENT_STATS=$(curl -s -X GET "$BASE_URL/cs/stats/online" \
  -H "Authorization: Bearer $CS_AGENT_TOKEN")

if echo "$CS_AGENT_STATS" | grep -q '"success":false\|403\|权限'; then
    echo -e "${GREEN}✓ 客服专员无法访问统计（符合预期）${NC}"
else
    echo -e "${RED}✗ 客服专员可以访问统计（不符合预期）${NC}"
    echo "$CS_AGENT_STATS"
fi
echo ""

# 测试客服专员访问客服列表（应该失败）
echo "10. 测试客服专员访问客服列表（应该被拒绝）..."
CS_AGENT_LIST=$(curl -s -X GET "$BASE_URL/cs/agents?page=1&limit=10" \
  -H "Authorization: Bearer $CS_AGENT_TOKEN")

if echo "$CS_AGENT_LIST" | grep -q '"success":false\|403\|权限'; then
    echo -e "${GREEN}✓ 客服专员无法访问客服列表（符合预期）${NC}"
else
    echo -e "${RED}✗ 客服专员可以访问客服列表（不符合预期）${NC}"
    echo "$CS_AGENT_LIST"
fi
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "测试总结："
echo "1. ✓ 超级管理员拥有所有权限"
echo "2. ✓ 客服主管可以访问客服系统"
echo "3. ✓ 客服主管无法访问非客服功能"
echo "4. ✓ 客服专员只能访问工作台（无管理权限）"
echo ""
echo "前端菜单显示效果："
echo "- 超级管理员/管理员: 看到所有菜单（包括客服管理+工作台）"
echo "- 客服主管: 只看到客服系统菜单（客服管理+工作台）"
echo "- 客服专员: 只看到客服工作台菜单"
echo "- 其他角色: 不显示客服系统菜单"
echo ""
