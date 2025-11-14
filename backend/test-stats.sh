#!/bin/bash

# 后端测试统计脚本

echo "================================"
echo "    后端测试统计报告"
echo "================================"
echo ""

# 运行测试并获取结果
echo "📊 运行测试..."
npm test 2>&1 | grep -E "(Test Suites|Tests:|Time:)" | tee /tmp/test-stats.txt

echo ""
echo "================================"
echo "    测试文件统计"
echo "================================"
echo ""

# 统计测试文件
UNIT_TESTS=$(find src/__tests__/unit -name "*.test.ts" | wc -l)
INTEGRATION_TESTS=$(find src/__tests__/integration -name "*.test.ts" | wc -l)
TOTAL_TEST_FILES=$((UNIT_TESTS + INTEGRATION_TESTS))

echo "📁 单元测试文件: $UNIT_TESTS"
echo "📁 集成测试文件: $INTEGRATION_TESTS"
echo "📁 总测试文件: $TOTAL_TEST_FILES"

echo ""
echo "================================"
echo "    测试覆盖率"
echo "================================"
echo ""

# 生成覆盖率报告
echo "📈 生成覆盖率报告..."
npm run test:coverage 2>&1 | grep -A 10 "services/user" | grep -E "(Service|\.ts)"

echo ""
echo "================================"
echo "✅ 测试统计完成"
echo "================================"
echo ""
echo "💡 提示:"
echo "  - 查看详细覆盖率: open coverage/lcov-report/index.html"
echo "  - 运行监听模式: npm run test:watch"
echo "  - 只运行单元测试: npm run test:unit"
echo ""
