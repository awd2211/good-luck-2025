#!/bin/bash

# 用户端API测试脚本
# 测试购物车、收藏、浏览历史、算命服务列表等功能

set -e

API_URL="${API_URL:-http://localhost:3000/api}"
PHONE="13900000001"
TOKEN=""
USER_ID=""
FORTUNE_ID=""
CART_ITEM_ID=""
FAVORITE_ID=""
HISTORY_ID=""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# 测试HTTP请求
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    print_info "测试: $description"

    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    fi

    echo "$response" | jq '.'

    # 检查响应是否成功
    success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        print_success "$description - 成功"
        echo "$response"
    else
        print_error "$description - 失败"
        echo "$response"
        return 1
    fi
}

# 1. 用户认证测试
print_header "1. 用户认证测试"

# 1.1 发送验证码
print_info "1.1 发送验证码"
response=$(curl -s -X POST "$API_URL/auth/send-code" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"$PHONE\"}")
echo "$response" | jq '.'
print_success "验证码已发送（查看后端日志获取验证码）"

# 等待用户输入验证码
echo ""
read -p "请输入验证码: " CODE

# 1.2 验证码登录
print_info "1.2 验证码登录"
response=$(curl -s -X POST "$API_URL/auth/login/code" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"$PHONE\", \"code\": \"$CODE\"}")
echo "$response" | jq '.'

TOKEN=$(echo "$response" | jq -r '.data.token')
USER_ID=$(echo "$response" | jq -r '.data.user.id')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    print_error "登录失败，请检查验证码"
    exit 1
fi

print_success "登录成功，Token: ${TOKEN:0:20}..."
print_success "用户ID: $USER_ID"

# 2. 算命服务列表测试
print_header "2. 算命服务列表测试"

# 2.1 获取分类列表
test_api "GET" "/fortunes/categories" "" "获取分类列表"

# 2.2 获取热门服务
response=$(test_api "GET" "/fortunes/popular?limit=5" "" "获取热门服务")
FORTUNE_ID=$(echo "$response" | jq -r '.data[0].id')
print_info "获取到Fortune ID: $FORTUNE_ID"

# 2.3 获取推荐服务
test_api "GET" "/fortunes/recommended?limit=5" "" "获取推荐服务"

# 2.4 获取服务列表（分页）
test_api "GET" "/fortunes?page=1&limit=5" "" "获取服务列表（分页）"

# 2.5 按分类筛选
test_api "GET" "/fortunes?category=bazi&page=1&limit=5" "" "按分类筛选（八字）"

# 2.6 价格排序
test_api "GET" "/fortunes?sort=price_asc&limit=5" "" "价格从低到高排序"

# 2.7 搜索服务
test_api "GET" "/fortunes?keyword=八字&limit=5" "" "搜索服务（关键词：八字）"

# 2.8 获取服务详情
test_api "GET" "/fortunes/$FORTUNE_ID" "" "获取服务详情"

# 3. 购物车测试
print_header "3. 购物车测试"

# 3.1 添加到购物车
response=$(test_api "POST" "/cart" "{\"fortuneId\": $FORTUNE_ID, \"quantity\": 1}" "添加到购物车")
CART_ITEM_ID=$(echo "$response" | jq -r '.data.id')

# 3.2 再次添加同一商品（应该增加数量）
test_api "POST" "/cart" "{\"fortuneId\": $FORTUNE_ID, \"quantity\": 2}" "再次添加到购物车（增加数量）"

# 3.3 获取购物车
test_api "GET" "/cart" "" "获取购物车"

# 3.4 更新商品数量
test_api "PUT" "/cart/$CART_ITEM_ID" "{\"quantity\": 5}" "更新购物车商品数量"

# 3.5 获取更新后的购物车
test_api "GET" "/cart" "" "获取更新后的购物车"

# 4. 收藏测试
print_header "4. 收藏测试"

# 4.1 添加收藏
test_api "POST" "/favorites" "{\"fortuneId\": $FORTUNE_ID}" "添加收藏"

# 4.2 检查收藏状态
test_api "GET" "/favorites/check/$FORTUNE_ID" "" "检查收藏状态"

# 4.3 获取收藏列表
test_api "GET" "/favorites?page=1&limit=10" "" "获取收藏列表"

# 4.4 批量检查收藏状态
test_api "POST" "/favorites/batch-check" "{\"fortuneIds\": [1, 2, 3, $FORTUNE_ID]}" "批量检查收藏状态"

# 5. 浏览历史测试
print_header "5. 浏览历史测试"

# 5.1 添加浏览记录
response=$(test_api "POST" "/history" "{\"fortuneId\": $FORTUNE_ID}" "添加浏览记录")
HISTORY_ID=$(echo "$response" | jq -r '.data.id')

# 5.2 再次添加同一商品（应该更新时间）
test_api "POST" "/history" "{\"fortuneId\": $FORTUNE_ID}" "再次添加浏览记录（更新时间）"

# 5.3 添加其他商品浏览记录
test_api "POST" "/history" "{\"fortuneId\": 2}" "添加其他商品浏览记录"
test_api "POST" "/history" "{\"fortuneId\": 3}" "添加更多浏览记录"

# 5.4 获取浏览历史
test_api "GET" "/history?page=1&limit=10" "" "获取浏览历史"

# 6. 清理操作测试
print_header "6. 清理操作测试"

# 6.1 删除单条浏览记录
if [ ! -z "$HISTORY_ID" ] && [ "$HISTORY_ID" != "null" ]; then
    test_api "DELETE" "/history/$HISTORY_ID" "" "删除单条浏览记录"
fi

# 6.2 批量删除购物车商品（测试失败场景）
test_api "POST" "/cart/batch-delete" "{\"ids\": [9999]}" "批量删除不存在的购物车商品"

# 6.3 取消收藏
test_api "DELETE" "/favorites/$FORTUNE_ID" "" "取消收藏"

# 6.4 删除购物车商品
if [ ! -z "$CART_ITEM_ID" ] && [ "$CART_ITEM_ID" != "null" ]; then
    test_api "DELETE" "/cart/$CART_ITEM_ID" "" "删除购物车商品"
fi

# 6.5 清空浏览历史
test_api "DELETE" "/history" "" "清空浏览历史"

# 6.6 清空购物车
test_api "DELETE" "/cart" "" "清空购物车"

# 7. 错误处理测试
print_header "7. 错误处理测试"

# 7.1 添加不存在的商品到购物车
print_info "7.1 添加不存在的商品到购物车（应该失败）"
response=$(curl -s -X POST "$API_URL/cart" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"fortuneId\": 99999}")
echo "$response" | jq '.'

# 7.2 重复添加收藏
print_info "7.2 重复添加收藏（应该失败）"
test_api "POST" "/favorites" "{\"fortuneId\": $FORTUNE_ID}" "添加收藏" || true
response=$(curl -s -X POST "$API_URL/favorites" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"fortuneId\": $FORTUNE_ID}")
echo "$response" | jq '.'

# 7.3 取消不存在的收藏
print_info "7.3 取消不存在的收藏（应该失败）"
response=$(curl -s -X DELETE "$API_URL/favorites/99999" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN")
echo "$response" | jq '.'

# 7.4 无效的数量
print_info "7.4 添加无效数量的商品（应该失败）"
response=$(curl -s -X POST "$API_URL/cart" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"fortuneId\": $FORTUNE_ID, \"quantity\": 0}")
echo "$response" | jq '.'

# 8. 用户信息测试
print_header "8. 用户信息测试"

# 8.1 获取用户信息
test_api "GET" "/auth/me" "" "获取用户信息"

# 8.2 更新用户信息
test_api "PUT" "/auth/profile" "{\"nickname\": \"测试用户\", \"avatar\": \"https://example.com/avatar.jpg\"}" "更新用户信息"

# 8.3 再次获取用户信息
test_api "GET" "/auth/me" "" "获取更新后的用户信息"

# 完成
print_header "测试完成"
print_success "所有测试已完成！"
echo ""
print_info "注意事项："
echo "  1. 首次运行需要先执行数据库迁移: ./db-cli.sh connect -c \"\\i backend/migrations/015_create_user_tables.sql\""
echo "  2. 确保后端服务正在运行: cd backend && npm run dev"
echo "  3. 查看后端日志获取验证码"
echo ""
