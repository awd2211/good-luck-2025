#!/bin/bash

# 批量修复管理后台Table组件的dataSource类型问题

PAGES_DIR="/home/eric/good-luck-2025/admin-frontend/src/pages"

cd "$PAGES_DIR"

echo "开始扫描和修复 dataSource 类型问题..."
echo ""

# 需要修复的模式列表
declare -a files_to_fix=(
  "CSWorkbench.tsx"
  "QuickReplyManagement.tsx"
  "AdminManagement.tsx"
  "AIBotConfiguration.tsx"
  "CSSatisfactionStatistics.tsx"
  "ShareAnalytics.tsx"
)

total_fixed=0

for file in "${files_to_fix[@]}"; do
  if [ -f "$file" ]; then
    echo "正在处理: $file"

    # 备份文件
    cp "$file" "${file}.bak"

    # 修复 setXXX(response.data.data) 为 setXXX(Array.isArray(response.data.data) ? response.data.data : [])
    # 但排除已经有 || [] 的情况
    sed -i.tmp 's/set\([A-Z][a-zA-Z]*\)(response\.data\.data);$/set\1(Array.isArray(response.data.data) ? response.data.data : []);/g' "$file"

    # 修复 setXXX(response.data.list)
    sed -i.tmp 's/set\([A-Z][a-zA-Z]*\)(response\.data\.list);$/set\1(Array.isArray(response.data.list) ? response.data.list : []);/g' "$file"

    # 检查是否有修改
    if ! cmp -s "$file" "${file}.bak"; then
      echo "  ✓ 已修复"
      ((total_fixed++))
      rm "${file}.bak"
    else
      echo "  - 无需修复或已是安全模式"
      mv "${file}.bak" "$file"
    fi

    rm -f "${file}.tmp"
  else
    echo "  ⚠ 文件不存在: $file"
  fi
  echo ""
done

echo "=========================================="
echo "修复完成!"
echo "总共修复文件数: $total_fixed"
echo "=========================================="
