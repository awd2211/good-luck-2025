#!/usr/bin/env python3
"""
批量修复管理后台Table组件的dataSource类型问题
"""
import os
import re
from pathlib import Path

# 目标目录
PAGES_DIR = Path("/home/eric/good-luck-2025/admin-frontend/src/pages")

# 问题模式和修复方案
PATTERNS = {
    # 问题1: setState 直接使用 response.data (可能不是数组)
    'direct_response_data': {
        'pattern': r'set(\w+)\(response\.data\)',
        'replace': r'set\1(Array.isArray(response.data) ? response.data : [])'
    },
    # 问题2: setState 使用 response.data.data (可能不是数组)
    'response_data_data': {
        'pattern': r'set(\w+)\(response\.data\.data\)',
        'replace': r'set\1(Array.isArray(response.data.data) ? response.data.data : [])'
    },
    # 问题3: setState 使用 response.data.list (可能不是数组)
    'response_data_list': {
        'pattern': r'set(\w+)\(response\.data\.list\)',
        'replace': r'set\1(Array.isArray(response.data.list) ? response.data.list : [])'
    },
}

def analyze_file(file_path):
    """分析单个文件中的问题"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    issues = []

    # 检查是否使用了Table组件
    if 'dataSource=' not in content:
        return None, content

    # 查找所有dataSource使用
    datasource_matches = re.finditer(r'dataSource=\{(\w+)\}', content)
    state_vars = set()
    for match in datasource_matches:
        state_vars.add(match.group(1))

    # 检查每个state变量的初始化和设置
    for var in state_vars:
        # 检查初始化
        init_pattern = rf'useState<[^>]+>\(\s*([^)]+)\s*\)'
        init_matches = re.finditer(init_pattern, content)

        # 检查是否有不安全的setState调用
        for pattern_name, pattern_info in PATTERNS.items():
            unsafe_pattern = pattern_info['pattern'].replace(r'(\w+)', f'({var})')
            if re.search(unsafe_pattern, content):
                issues.append({
                    'type': pattern_name,
                    'var': var,
                    'pattern': pattern_info
                })

    return issues, content

def fix_file(file_path, content, issues):
    """修复文件中的问题"""
    fixed_content = content
    changes_made = []

    for issue in issues:
        var = issue['var']
        pattern = issue['pattern']['pattern'].replace(r'(\w+)', f'({var})')
        replace = issue['pattern']['replace'].replace(r'\1', var)

        # 执行替换
        new_content = re.sub(pattern, replace, fixed_content)
        if new_content != fixed_content:
            changes_made.append(f"修复 {issue['type']}: {var}")
            fixed_content = new_content

    return fixed_content, changes_made

def main():
    """主函数"""
    print("开始批量检查和修复 Table dataSource 类型问题...\n")

    all_files = []
    problem_files = []
    fixed_files = []

    # 遍历所有tsx文件
    for tsx_file in PAGES_DIR.glob("*.tsx"):
        all_files.append(tsx_file.name)

        issues, content = analyze_file(tsx_file)

        if issues is None:
            continue

        if issues:
            problem_files.append({
                'file': tsx_file.name,
                'issues': issues,
                'content': content,
                'path': tsx_file
            })

    print(f"📊 检查统计:")
    print(f"   - 总文件数: {len(all_files)}")
    print(f"   - 使用Table的文件数: {len([f for f in all_files if 'dataSource=' in Path(PAGES_DIR/f).read_text()])}")
    print(f"   - 发现问题的文件数: {len(problem_files)}\n")

    if problem_files:
        print("🔍 问题详情:\n")
        for pf in problem_files:
            print(f"  📄 {pf['file']}")
            for issue in pf['issues']:
                print(f"     ⚠️  {issue['type']}: {issue['var']}")

        print("\n开始修复...\n")

        for pf in problem_files:
            fixed_content, changes = fix_file(pf['path'], pf['content'], pf['issues'])

            if changes:
                # 写入修复后的内容
                with open(pf['path'], 'w', encoding='utf-8') as f:
                    f.write(fixed_content)

                fixed_files.append({
                    'file': pf['file'],
                    'changes': changes
                })
                print(f"  ✅ {pf['file']}")
                for change in changes:
                    print(f"     - {change}")

    print(f"\n✨ 修复完成!")
    print(f"   - 修复文件数: {len(fixed_files)}")

    return len(fixed_files)

if __name__ == '__main__':
    main()
