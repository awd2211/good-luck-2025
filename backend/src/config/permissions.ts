/**
 * 角色和权限配置
 */

// 定义所有角色
export enum Role {
  SUPER_ADMIN = 'super_admin',  // 超级管理员 - 拥有所有权限
  MANAGER = 'manager',           // 管理员 - 大部分权限，但不能管理管理员
  EDITOR = 'editor',             // 编辑 - 只能管理内容，不能管理用户和订单
  VIEWER = 'viewer',             // 查看者 - 只能查看数据，不能修改
}

// 定义资源类型
export enum Resource {
  USERS = 'users',               // 用户管理
  ORDERS = 'orders',             // 订单管理
  BANNERS = 'banners',           // 横幅管理
  NOTIFICATIONS = 'notifications', // 通知管理
  REFUNDS = 'refunds',           // 退款管理
  FEEDBACKS = 'feedbacks',       // 用户反馈
  REVIEWS = 'reviews',           // 评价管理
  COUPONS = 'coupons',           // 优惠券管理
  FINANCIAL = 'financial',       // 财务管理
  STATS = 'stats',               // 统计数据
  AUDIT = 'audit',               // 审计日志
  ADMINS = 'admins',             // 管理员管理
  FORTUNE_SERVICES = 'fortune_services',  // 算命服务管理（分类和服务产品）
  FORTUNE_CONTENT = 'fortune_content',    // 算命内容管理（模板、运势、文章、素材）
  FORTUNE_MARKETING = 'fortune_marketing', // 算命营销管理（首页配置、促销）
  SYSTEM_CONFIG = 'system_config',        // 系统配置
}

// 定义操作类型
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',  // 完全管理权限
}

// 权限矩阵：角色 -> 资源 -> 允许的操作
export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  [Role.SUPER_ADMIN]: {
    [Resource.USERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.ORDERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.BANNERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.NOTIFICATIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.REFUNDS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.FEEDBACKS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.REVIEWS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.COUPONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.FINANCIAL]: [Action.READ, Action.MANAGE],
    [Resource.STATS]: [Action.READ, Action.MANAGE],
    [Resource.AUDIT]: [Action.READ, Action.MANAGE],
    [Resource.ADMINS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.FORTUNE_SERVICES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.FORTUNE_CONTENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.FORTUNE_MARKETING]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.SYSTEM_CONFIG]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
  },

  [Role.MANAGER]: {
    [Resource.USERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.ORDERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.BANNERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.NOTIFICATIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.REFUNDS]: [Action.READ, Action.UPDATE],
    [Resource.FEEDBACKS]: [Action.READ, Action.UPDATE],
    [Resource.REVIEWS]: [Action.READ, Action.UPDATE],
    [Resource.COUPONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.FINANCIAL]: [Action.READ],
    [Resource.STATS]: [Action.READ],
    [Resource.AUDIT]: [Action.READ],
    [Resource.ADMINS]: [Action.READ], // 只能查看管理员列表
    [Resource.FORTUNE_SERVICES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.FORTUNE_CONTENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.FORTUNE_MARKETING]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.SYSTEM_CONFIG]: [Action.READ, Action.UPDATE],
  },

  [Role.EDITOR]: {
    [Resource.USERS]: [Action.READ],
    [Resource.ORDERS]: [Action.READ],
    [Resource.BANNERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.NOTIFICATIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.REFUNDS]: [Action.READ],
    [Resource.FEEDBACKS]: [Action.READ],
    [Resource.REVIEWS]: [Action.READ, Action.UPDATE],
    [Resource.COUPONS]: [Action.READ],
    [Resource.FINANCIAL]: [Action.READ],
    [Resource.STATS]: [Action.READ],
    [Resource.AUDIT]: [Action.READ],
    [Resource.ADMINS]: [], // 不能访问管理员
    [Resource.FORTUNE_SERVICES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.FORTUNE_CONTENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.FORTUNE_MARKETING]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.SYSTEM_CONFIG]: [Action.READ],
  },

  [Role.VIEWER]: {
    [Resource.USERS]: [Action.READ],
    [Resource.ORDERS]: [Action.READ],
    [Resource.BANNERS]: [Action.READ],
    [Resource.NOTIFICATIONS]: [Action.READ],
    [Resource.REFUNDS]: [Action.READ],
    [Resource.FEEDBACKS]: [Action.READ],
    [Resource.REVIEWS]: [Action.READ],
    [Resource.COUPONS]: [Action.READ],
    [Resource.FINANCIAL]: [Action.READ],
    [Resource.STATS]: [Action.READ],
    [Resource.AUDIT]: [Action.READ],
    [Resource.ADMINS]: [], // 不能访问管理员
    [Resource.FORTUNE_SERVICES]: [Action.READ],
    [Resource.FORTUNE_CONTENT]: [Action.READ],
    [Resource.FORTUNE_MARKETING]: [Action.READ],
    [Resource.SYSTEM_CONFIG]: [Action.READ],
  },
};

/**
 * 检查角色是否有权限执行某个操作
 */
export const hasPermission = (
  role: Role,
  resource: Resource,
  action: Action
): boolean => {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
};

/**
 * 获取管理员角色列表（用于requireRole中间件）
 */
export const ADMIN_ROLES = [
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.EDITOR,
  Role.VIEWER,
];

/**
 * 获取可以修改数据的角色
 */
export const WRITE_ROLES = [
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.EDITOR,
];

/**
 * 获取可以管理用户的角色
 */
export const USER_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
  Role.MANAGER,
];

/**
 * 获取可以管理管理员的角色
 */
export const ADMIN_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
];
