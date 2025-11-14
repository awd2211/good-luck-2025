/**
 * 优化后的 RBAC 权限配置
 * 统一前后端权限模型，简化维护
 */

// 定义所有角色
export enum Role {
  SUPER_ADMIN = 'super_admin',  // 超级管理员 - 拥有所有权限，包括角色管理
  ADMIN = 'admin',               // 管理员 - 拥有大部分权限，但不能管理角色
  MANAGER = 'manager',           // 经理 - 可以查看和编辑，但不能删除
  VIEWER = 'viewer',             // 查看者 - 只能查看数据
  CS_MANAGER = 'cs_manager',     // 客服主管 - 管理客服团队和查看统计
  CS_AGENT = 'cs_agent',         // 客服专员 - 只能使用客服工作台
}

// 定义资源类型
export enum Resource {
  // 核心业务
  USERS = 'users',                       // 用户管理
  ORDERS = 'orders',                     // 订单管理

  // 算命业务
  FORTUNE_SERVICES = 'fortune_services', // 算命服务管理（分类、服务、模板）
  FORTUNE_CONTENT = 'fortune_content',   // 算命内容管理（运势、文章）

  // 营销系统
  BANNERS = 'banners',                   // 横幅管理
  NOTIFICATIONS = 'notifications',       // 通知管理
  COUPONS = 'coupons',                   // 优惠券管理

  // 用户交互
  REVIEWS = 'reviews',                   // 评价管理
  FEEDBACKS = 'feedbacks',               // 用户反馈
  REFUNDS = 'refunds',                   // 退款管理

  // 财务与支付
  FINANCIAL = 'financial',               // 财务管理（包括支付配置、交易记录）

  // 系统管理
  SYSTEM_CONFIG = 'system_config',       // 系统配置
  AI_MODELS = 'ai_models',               // AI模型管理
  ADMINS = 'admins',                     // 管理员管理
  ROLES = 'roles',                       // 角色权限管理

  // 统计与日志
  STATS = 'stats',                       // 统计数据
  AUDIT = 'audit',                       // 审计日志
  ATTRIBUTION = 'attribution',           // 归因分析

  // 客服系统
  CS_WORKBENCH = 'cs_workbench',         // 客服工作台（会话、消息）
  CS_TEAM = 'cs_team',                   // 客服团队管理
  CS_STATS = 'cs_stats',                 // 客服统计

  // 向后兼容的别名
  CS_AGENTS = 'cs_team',                 // 兼容旧代码
  CS_SESSIONS = 'cs_workbench',          // 兼容旧代码
  CS_MESSAGES = 'cs_workbench',          // 兼容旧代码
}

// 定义操作类型
export enum Action {
  VIEW = 'view',       // 查看
  CREATE = 'create',   // 创建
  EDIT = 'edit',       // 编辑
  DELETE = 'delete',   // 删除
  MANAGE = 'manage',   // 完全管理（包含所有操作）

  // 向后兼容的别名
  READ = 'view',       // 兼容旧代码
  UPDATE = 'edit',     // 兼容旧代码
}

// 权限矩阵：角色 -> 资源 -> 允许的操作
export const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  // 超级管理员：拥有所有权限
  [Role.SUPER_ADMIN]: {
    [Resource.USERS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.ORDERS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.FORTUNE_SERVICES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.FORTUNE_CONTENT]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.BANNERS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.NOTIFICATIONS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.COUPONS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.REVIEWS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.FEEDBACKS]: [Action.VIEW, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.REFUNDS]: [Action.VIEW, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.FINANCIAL]: [Action.VIEW, Action.EDIT, Action.MANAGE],
    [Resource.SYSTEM_CONFIG]: [Action.VIEW, Action.EDIT, Action.MANAGE],
    [Resource.AI_MODELS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.ADMINS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.ROLES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.STATS]: [Action.VIEW, Action.MANAGE],
    [Resource.AUDIT]: [Action.VIEW, Action.MANAGE],
    [Resource.ATTRIBUTION]: [Action.VIEW, Action.MANAGE],
    [Resource.CS_WORKBENCH]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.CS_TEAM]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.MANAGE],
    [Resource.CS_STATS]: [Action.VIEW, Action.MANAGE],
  },

  // 管理员：拥有大部分权限，但不能管理角色和管理员
  [Role.ADMIN]: {
    [Resource.USERS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.ORDERS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.FORTUNE_SERVICES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.FORTUNE_CONTENT]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.BANNERS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.NOTIFICATIONS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.COUPONS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.REVIEWS]: [Action.VIEW, Action.EDIT, Action.DELETE],
    [Resource.FEEDBACKS]: [Action.VIEW, Action.EDIT],
    [Resource.REFUNDS]: [Action.VIEW, Action.EDIT],
    [Resource.FINANCIAL]: [Action.VIEW],
    [Resource.SYSTEM_CONFIG]: [Action.VIEW, Action.EDIT],
    [Resource.AI_MODELS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.ADMINS]: [Action.VIEW], // 只能查看
    [Resource.ROLES]: [], // 不能访问
    [Resource.STATS]: [Action.VIEW],
    [Resource.AUDIT]: [Action.VIEW],
    [Resource.ATTRIBUTION]: [Action.VIEW],
    [Resource.CS_WORKBENCH]: [Action.VIEW, Action.CREATE, Action.EDIT],
    [Resource.CS_TEAM]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
    [Resource.CS_STATS]: [Action.VIEW],
  },

  // 经理：可以查看和编辑，但不能删除
  [Role.MANAGER]: {
    [Resource.USERS]: [Action.VIEW, Action.EDIT],
    [Resource.ORDERS]: [Action.VIEW, Action.EDIT],
    [Resource.FORTUNE_SERVICES]: [Action.VIEW, Action.EDIT],
    [Resource.FORTUNE_CONTENT]: [Action.VIEW, Action.EDIT],
    [Resource.BANNERS]: [Action.VIEW, Action.EDIT],
    [Resource.NOTIFICATIONS]: [Action.VIEW, Action.EDIT],
    [Resource.COUPONS]: [Action.VIEW, Action.EDIT],
    [Resource.REVIEWS]: [Action.VIEW, Action.EDIT],
    [Resource.FEEDBACKS]: [Action.VIEW, Action.EDIT],
    [Resource.REFUNDS]: [Action.VIEW, Action.EDIT],
    [Resource.FINANCIAL]: [Action.VIEW],
    [Resource.SYSTEM_CONFIG]: [Action.VIEW],
    [Resource.AI_MODELS]: [Action.VIEW, Action.EDIT],
    [Resource.ADMINS]: [], // 不能访问
    [Resource.ROLES]: [], // 不能访问
    [Resource.STATS]: [Action.VIEW],
    [Resource.AUDIT]: [Action.VIEW],
    [Resource.ATTRIBUTION]: [Action.VIEW],
    [Resource.CS_WORKBENCH]: [],
    [Resource.CS_TEAM]: [],
    [Resource.CS_STATS]: [],
  },

  // 查看者：只能查看数据
  [Role.VIEWER]: {
    [Resource.USERS]: [Action.VIEW],
    [Resource.ORDERS]: [Action.VIEW],
    [Resource.FORTUNE_SERVICES]: [Action.VIEW],
    [Resource.FORTUNE_CONTENT]: [Action.VIEW],
    [Resource.BANNERS]: [Action.VIEW],
    [Resource.NOTIFICATIONS]: [Action.VIEW],
    [Resource.COUPONS]: [Action.VIEW],
    [Resource.REVIEWS]: [Action.VIEW],
    [Resource.FEEDBACKS]: [Action.VIEW],
    [Resource.REFUNDS]: [Action.VIEW],
    [Resource.FINANCIAL]: [Action.VIEW],
    [Resource.SYSTEM_CONFIG]: [Action.VIEW],
    [Resource.AI_MODELS]: [Action.VIEW],
    [Resource.ADMINS]: [], // 不能访问
    [Resource.ROLES]: [], // 不能访问
    [Resource.STATS]: [Action.VIEW],
    [Resource.AUDIT]: [Action.VIEW],
    [Resource.ATTRIBUTION]: [Action.VIEW],
    [Resource.CS_WORKBENCH]: [],
    [Resource.CS_TEAM]: [],
    [Resource.CS_STATS]: [],
  },

  // 客服主管：管理客服团队和查看统计
  [Role.CS_MANAGER]: {
    [Resource.USERS]: [],
    [Resource.ORDERS]: [],
    [Resource.FORTUNE_SERVICES]: [],
    [Resource.FORTUNE_CONTENT]: [],
    [Resource.BANNERS]: [],
    [Resource.NOTIFICATIONS]: [],
    [Resource.COUPONS]: [],
    [Resource.REVIEWS]: [],
    [Resource.FEEDBACKS]: [],
    [Resource.REFUNDS]: [],
    [Resource.FINANCIAL]: [],
    [Resource.SYSTEM_CONFIG]: [],
    [Resource.AI_MODELS]: [],
    [Resource.ADMINS]: [],
    [Resource.ROLES]: [],
    [Resource.STATS]: [],
    [Resource.AUDIT]: [],
    [Resource.ATTRIBUTION]: [],
    [Resource.CS_WORKBENCH]: [Action.VIEW, Action.CREATE, Action.EDIT], // 可以使用工作台
    [Resource.CS_TEAM]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE], // 管理团队
    [Resource.CS_STATS]: [Action.VIEW], // 查看统计
  },

  // 客服专员：只能使用客服工作台
  [Role.CS_AGENT]: {
    [Resource.USERS]: [],
    [Resource.ORDERS]: [],
    [Resource.FORTUNE_SERVICES]: [],
    [Resource.FORTUNE_CONTENT]: [],
    [Resource.BANNERS]: [],
    [Resource.NOTIFICATIONS]: [],
    [Resource.COUPONS]: [],
    [Resource.REVIEWS]: [],
    [Resource.FEEDBACKS]: [],
    [Resource.REFUNDS]: [],
    [Resource.FINANCIAL]: [],
    [Resource.SYSTEM_CONFIG]: [],
    [Resource.AI_MODELS]: [],
    [Resource.ADMINS]: [],
    [Resource.ROLES]: [],
    [Resource.STATS]: [],
    [Resource.AUDIT]: [],
    [Resource.ATTRIBUTION]: [],
    [Resource.CS_WORKBENCH]: [Action.VIEW, Action.CREATE, Action.EDIT], // 只能使用工作台
    [Resource.CS_TEAM]: [], // 不能管理团队
    [Resource.CS_STATS]: [], // 不能查看统计
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
  if (!resourcePermissions || resourcePermissions.length === 0) return false;

  // MANAGE 包含所有操作
  if (resourcePermissions.includes(Action.MANAGE)) return true;

  return resourcePermissions.includes(action);
};

/**
 * 获取角色对某个资源的所有权限
 */
export const getResourcePermissions = (
  role: Role,
  resource: Resource
): Action[] => {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return [];

  return rolePermissions[resource] || [];
};

/**
 * 检查角色是否可以访问某个资源（至少有一个操作权限）
 */
export const canAccessResource = (
  role: Role,
  resource: Resource
): boolean => {
  const permissions = getResourcePermissions(role, resource);
  return permissions.length > 0;
};

/**
 * 获取所有管理员角色（用于认证中间件）
 */
export const ADMIN_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
  Role.VIEWER,
  Role.CS_MANAGER,
  Role.CS_AGENT,
];

/**
 * 获取可以修改数据的角色
 */
export const WRITE_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
];

/**
 * 获取可以管理用户的角色
 */
export const USER_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
];

/**
 * 获取可以管理管理员的角色
 */
export const ADMIN_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
];

/**
 * 获取可以管理角色的角色（只有超级管理员）
 */
export const ROLE_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
];

/**
 * 获取可以访问客服系统的角色
 */
export const CS_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.CS_MANAGER,
  Role.CS_AGENT,
];

/**
 * 获取可以管理客服团队的角色
 */
export const CS_TEAM_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.CS_MANAGER,
];

/**
 * 角色中文名称
 */
export const ROLE_NAMES: Record<Role, string> = {
  [Role.SUPER_ADMIN]: '超级管理员',
  [Role.ADMIN]: '管理员',
  [Role.MANAGER]: '经理',
  [Role.VIEWER]: '访客',
  [Role.CS_MANAGER]: '客服主管',
  [Role.CS_AGENT]: '客服专员',
};

/**
 * 资源中文名称
 */
export const RESOURCE_NAMES: Record<Resource, string> = {
  [Resource.USERS]: '用户管理',
  [Resource.ORDERS]: '订单管理',
  [Resource.FORTUNE_SERVICES]: '算命服务',
  [Resource.FORTUNE_CONTENT]: '算命内容',
  [Resource.BANNERS]: '横幅管理',
  [Resource.NOTIFICATIONS]: '通知管理',
  [Resource.COUPONS]: '优惠券管理',
  [Resource.REVIEWS]: '评价管理',
  [Resource.FEEDBACKS]: '用户反馈',
  [Resource.REFUNDS]: '退款管理',
  [Resource.FINANCIAL]: '财务管理',
  [Resource.SYSTEM_CONFIG]: '系统配置',
  [Resource.AI_MODELS]: 'AI模型管理',
  [Resource.ADMINS]: '管理员管理',
  [Resource.ROLES]: '角色管理',
  [Resource.STATS]: '统计数据',
  [Resource.AUDIT]: '审计日志',
  [Resource.ATTRIBUTION]: '归因分析',
  [Resource.CS_WORKBENCH]: '客服工作台',
  [Resource.CS_TEAM]: '客服团队',
  [Resource.CS_STATS]: '客服统计',
};

/**
 * 操作中文名称
 */
export const ACTION_NAMES: Record<Action, string> = {
  [Action.VIEW]: '查看',
  [Action.CREATE]: '创建',
  [Action.EDIT]: '编辑',
  [Action.DELETE]: '删除',
  [Action.MANAGE]: '管理',
};
