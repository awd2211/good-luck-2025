#!/bin/bash

# 批量修复管理后台数据访问问题

echo "🔧 开始批量修复数据访问问题..."

# 1. 修复 res.data.data 的访问方式
echo "1️⃣  修复 res.data.data 访问..."
find src/pages -name "*.tsx" -type f | while read file; do
  if grep -q "res\.data\.data" "$file"; then
    sed -i 's/res\.data\.data\([^a-zA-Z_]\)/\(res.data.data || res.data\)\1/g' "$file"
    echo "   ✅ 修复: $file"
  fi
done

# 2. 修复 .toFixed() 调用前添加默认值
echo "2️⃣  修复 toFixed 调用..."
find src/pages -name "*.tsx" -type f | while read file; do
  # 查找未保护的 toFixed 调用
  if grep -q "\.toFixed(" "$file"; then
    # 这需要更精细的处理，手动检查
    echo "   ⚠️  需要手动检查: $file (contains .toFixed())"
  fi
done

echo "✅ 批量修复完成！"
echo ""
echo "📝 下一步："
echo "   1. 检查修改的文件"
echo "   2. 手动修复 .toFixed() 调用"
echo "   3. 重新测试所有页面"
