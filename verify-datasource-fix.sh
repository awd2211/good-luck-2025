#!/bin/bash

echo "======================================"
echo "验证 Table dataSource 修复"
echo "======================================"
echo ""

cd /home/eric/good-luck-2025/admin-frontend/src/pages

echo "1. 检查修复后的代码模式..."
echo ""

# 统计使用 Array.isArray 的数量
array_checks=$(grep -h "Array.isArray(response" *.tsx | wc -l)
echo "✅ 使用 Array.isArray 进行类型检查: $array_checks 处"

# 统计使用 || [] 的数量（已有的安全模式）
or_empty=$(grep -h "|| \[\]" *.tsx | grep -c "response\.data")
echo "✅ 使用 || [] 默认值: $or_empty 处"

# 统计使用可选链的分页
pagination_safe=$(grep -h "pagination?\." *.tsx | wc -l)
echo "✅ 使用可选链访问分页: $pagination_safe 处"

echo ""
echo "2. 检查可能遗漏的不安全模式..."
echo ""

# 查找可能不安全的模式（排除已修复的）
unsafe=$(grep -h "set[A-Z][a-zA-Z]*(response\.data\.[a-z]" *.tsx | \
  grep -v "||" | \
  grep -v "?" | \
  grep -v "Array.isArray" | \
  grep -v "filter" | \
  wc -l)

if [ $unsafe -eq 0 ]; then
  echo "✅ 未发现不安全的 dataSource 赋值模式"
else
  echo "⚠️  发现 $unsafe 处可能不安全的模式:"
  grep -hn "set[A-Z][a-zA-Z]*(response\.data\.[a-z]" *.tsx | \
    grep -v "||" | \
    grep -v "?" | \
    grep -v "Array.isArray" | \
    grep -v "filter" | \
    head -5
fi

echo ""
echo "3. 统计修复的文件..."
echo ""

fixed_files=(
  "KnowledgeBase.tsx"
  "SessionTransferManagement.tsx"
  "CSPerformance.tsx"
  "CSWorkbench.tsx"
  "QuickReplyManagement.tsx"
  "AIBotConfiguration.tsx"
  "CSSatisfactionStatistics.tsx"
  "ShareAnalytics.tsx"
)

for file in "${fixed_files[@]}"; do
  if [ -f "$file" ]; then
    count=$(grep -c "Array.isArray" "$file" 2>/dev/null || echo "0")
    echo "  ✅ $file: $count 处修复"
  fi
done

echo ""
echo "======================================"
echo "修复验证完成"
echo "======================================"
