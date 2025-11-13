-- 为每种角色添加测试管理员账号
-- 密码统一为: Admin123!

-- 1. 超级管理员 (super_admin)
-- 用户名: superadmin / 密码: Admin123!
INSERT INTO admins (id, username, password, email, role)
VALUES (
  'admin_super_001',
  'superadmin',
  '$2b$10$tvPcKlS734hDHkuDU0Vdau4GjTmVqjljwcrNv6BsKU3l6R0JW7yu2',  -- Admin123!
  'superadmin@fortune.com',
  'super_admin'
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 2. 管理员 (manager)
-- 用户名: manager / 密码: Admin123!
INSERT INTO admins (id, username, password, email, role)
VALUES (
  'admin_manager_001',
  'manager',
  '$2b$10$tvPcKlS734hDHkuDU0Vdau4GjTmVqjljwcrNv6BsKU3l6R0JW7yu2',  -- Admin123!
  'manager@fortune.com',
  'manager'
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 3. 编辑 (editor)
-- 用户名: editor / 密码: Admin123!
INSERT INTO admins (id, username, password, email, role)
VALUES (
  'admin_editor_001',
  'editor',
  '$2b$10$tvPcKlS734hDHkuDU0Vdau4GjTmVqjljwcrNv6BsKU3l6R0JW7yu2',  -- Admin123!
  'editor@fortune.com',
  'editor'
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 4. 查看者 (viewer)
-- 用户名: viewer / 密码: Admin123!
INSERT INTO admins (id, username, password, email, role)
VALUES (
  'admin_viewer_001',
  'viewer',
  '$2b$10$tvPcKlS734hDHkuDU0Vdau4GjTmVqjljwcrNv6BsKU3l6R0JW7yu2',  -- Admin123!
  'viewer@fortune.com',
  'viewer'
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 查看插入结果
SELECT
  '管理员账号创建完成' as message,
  COUNT(*) as total_admins
FROM admins;

-- 显示所有管理员账号信息
SELECT
  id,
  username,
  email,
  role,
  CASE
    WHEN role = 'super_admin' THEN '超级管理员 - 拥有所有权限'
    WHEN role = 'manager' THEN '管理员 - 大部分权限,不能管理管理员'
    WHEN role = 'editor' THEN '编辑 - 只能管理内容,不能管理用户和订单'
    WHEN role = 'viewer' THEN '查看者 - 只能查看数据,不能修改'
  END as role_description,
  created_at
FROM admins
WHERE username IN ('superadmin', 'manager', 'editor', 'viewer')
ORDER BY
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'editor' THEN 3
    WHEN 'viewer' THEN 4
  END;

-- 显示登录信息提示
SELECT
  '=== 测试账号登录信息 ===' as info
UNION ALL
SELECT '用户名: superadmin | 密码: Admin123! | 角色: 超级管理员'
UNION ALL
SELECT '用户名: manager    | 密码: Admin123! | 角色: 管理员'
UNION ALL
SELECT '用户名: editor     | 密码: Admin123! | 角色: 编辑'
UNION ALL
SELECT '用户名: viewer     | 密码: Admin123! | 角色: 查看者';
