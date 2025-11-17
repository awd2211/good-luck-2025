#!/bin/bash

# 批量修复所有Table组件的dataSource，添加数组类型保护

cd /home/eric/good-luck-2025/admin-frontend/src/pages

echo "开始批量修复Table dataSource..."

# 查找所有需要修复的模式并替换
for file in *.tsx; do
  if [ -f "$file" ]; then
    # 模式1: dataSource={variable} -> dataSource={Array.isArray(variable) ? variable : []}
    # 但要避免已经有保护的情况

    # 检查文件是否包含 dataSource
    if grep -q "dataSource=" "$file"; then
      echo "检查: $file"

      # 备份文件
      cp "$file" "$file.bak"

      # 使用sed进行智能替换（只替换简单的变量引用，不替换已有保护的）
      # dataSource={xxx} -> dataSource={Array.isArray(xxx) ? xxx : []}
      # 但跳过已经包含 Array.isArray, || [], ?.的情况

      # 这个脚本比较复杂，我们使用node来处理
    fi
  fi
done

echo "修复完成"
