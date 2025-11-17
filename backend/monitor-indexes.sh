#!/bin/bash

# ============================================================================
# 索引使用率监控脚本
# 用途：监控数据库索引的使用情况，识别未使用或低效的索引
# 使用：./monitor-indexes.sh
# ============================================================================

# 数据库连接信息
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54320}"
DB_NAME="${DB_NAME:-fortune_db}"
DB_USER="${DB_USER:-fortune_user}"
DB_PASSWORD="${DB_PASSWORD:-fortune_pass_2025}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}数据库索引使用率监控报告${NC}"
echo -e "${BLUE}生成时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# 检查数据库连接
echo -e "${YELLOW}📊 检查数据库连接...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo -e "${RED}❌ 数据库连接失败！${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 数据库连接成功${NC}"
echo ""

# ============================================================================
# 1. 查找未使用的索引
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 1. 未使用的索引（idx_scan = 0）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

UNUSED_INDEXES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT
    schemaname || '.' || tablename AS table_name,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%pkey'
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
")

if [ -z "$UNUSED_INDEXES" ]; then
    echo -e "${GREEN}✅ 没有发现未使用的索引${NC}"
else
    echo "$UNUSED_INDEXES" | while IFS='|' read -r table index size scans; do
        table=$(echo $table | xargs)
        index=$(echo $index | xargs)
        size=$(echo $size | xargs)
        echo -e "${RED}⚠️  表: $table | 索引: $index | 大小: $size | 扫描次数: 0${NC}"
    done
fi
echo ""

# ============================================================================
# 2. 查找低使用率索引（扫描次数 < 100）
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 2. 低使用率索引（idx_scan < 100）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

LOW_USAGE_INDEXES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT
    schemaname || '.' || tablename AS table_name,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS scans
FROM pg_stat_user_indexes
WHERE idx_scan > 0 AND idx_scan < 100
  AND indexrelname NOT LIKE '%pkey'
  AND schemaname = 'public'
ORDER BY idx_scan ASC
LIMIT 20;
")

if [ -z "$LOW_USAGE_INDEXES" ]; then
    echo -e "${GREEN}✅ 没有发现低使用率索引${NC}"
else
    echo "$LOW_USAGE_INDEXES" | while IFS='|' read -r table index size scans; do
        table=$(echo $table | xargs)
        index=$(echo $index | xargs)
        size=$(echo $size | xargs)
        scans=$(echo $scans | xargs)
        echo -e "${YELLOW}⚠️  表: $table | 索引: $index | 大小: $size | 扫描次数: $scans${NC}"
    done
fi
echo ""

# ============================================================================
# 3. 查找高使用率索引（Top 20）
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 3. 最常用的索引（Top 20）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TOP_INDEXES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT
    schemaname || '.' || tablename AS table_name,
    indexname,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan > 0
  AND schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
")

echo "$TOP_INDEXES" | while IFS='|' read -r table index scans reads fetches; do
    table=$(echo $table | xargs)
    index=$(echo $index | xargs)
    scans=$(echo $scans | xargs)
    reads=$(echo $reads | xargs)
    fetches=$(echo $fetches | xargs)
    echo -e "${GREEN}✅ 表: $table | 索引: $index | 扫描: $scans 次 | 读取: $reads | 获取: $fetches${NC}"
done
echo ""

# ============================================================================
# 4. 表的索引使用率统计
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 4. 表的索引使用率（顺序扫描 vs 索引扫描）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TABLE_STATS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT
    schemaname || '.' || tablename AS table_name,
    seq_scan AS sequential_scans,
    idx_scan AS index_scans,
    CASE
        WHEN seq_scan + idx_scan > 0
        THEN ROUND((idx_scan::numeric / (seq_scan + idx_scan) * 100), 2)
        ELSE 0
    END AS index_usage_pct,
    n_live_tup AS live_tuples
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (seq_scan + idx_scan) DESC
LIMIT 30;
")

echo "$TABLE_STATS" | while IFS='|' read -r table seq_scans idx_scans usage tuples; do
    table=$(echo $table | xargs)
    seq_scans=$(echo $seq_scans | xargs)
    idx_scans=$(echo $idx_scans | xargs)
    usage=$(echo $usage | xargs)
    tuples=$(echo $tuples | xargs)

    if (( $(echo "$usage < 50" | bc -l) )); then
        color=$RED
        status="⚠️ 低"
    elif (( $(echo "$usage < 80" | bc -l) )); then
        color=$YELLOW
        status="⚠️ 中"
    else
        color=$GREEN
        status="✅ 高"
    fi

    echo -e "${color}$status 表: $table | 顺序扫描: $seq_scans | 索引扫描: $idx_scans | 索引使用率: $usage% | 行数: $tuples${NC}"
done
echo ""

# ============================================================================
# 5. 索引大小统计
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 5. 索引大小统计（Top 20 最大索引）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

INDEX_SIZES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT
    schemaname || '.' || tablename AS table_name,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_relation_size(indexrelid) AS size_bytes
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
")

echo "$INDEX_SIZES" | while IFS='|' read -r table index size bytes; do
    table=$(echo $table | xargs)
    index=$(echo $index | xargs)
    size=$(echo $size | xargs)
    echo -e "${BLUE}📦 表: $table | 索引: $index | 大小: $size${NC}"
done
echo ""

# ============================================================================
# 6. 物化视图统计
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 6. 物化视图统计${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MV_STATS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT
    schemaname || '.' || matviewname AS view_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||matviewname) DESC;
")

if [ -z "$MV_STATS" ]; then
    echo -e "${YELLOW}⚠️  没有发现物化视图${NC}"
else
    echo "$MV_STATS" | while IFS='|' read -r view size; do
        view=$(echo $view | xargs)
        size=$(echo $size | xargs)
        echo -e "${GREEN}✅ 物化视图: $view | 大小: $size${NC}"
    done
fi
echo ""

# ============================================================================
# 7. 优化建议
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 优化建议${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 计算未使用索引数量
UNUSED_COUNT=$(echo "$UNUSED_INDEXES" | grep -c "⚠" || echo "0")
LOW_USAGE_COUNT=$(echo "$LOW_USAGE_INDEXES" | grep -c "⚠" || echo "0")

if [ "$UNUSED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $UNUSED_COUNT 个未使用的索引，建议考虑删除以减少写入开销${NC}"
fi

if [ "$LOW_USAGE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $LOW_USAGE_COUNT 个低使用率索引，建议进一步分析是否需要保留${NC}"
fi

echo -e "${GREEN}✅ 定期运行此脚本以监控索引使用情况${NC}"
echo -e "${GREEN}✅ 对于未使用的索引，删除前请确认其业务用途${NC}"
echo -e "${GREEN}✅ 索引使用率低可能是正常的（如备份索引、季节性查询等）${NC}"
echo ""

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}监控报告完成${NC}"
echo -e "${BLUE}============================================================================${NC}"
