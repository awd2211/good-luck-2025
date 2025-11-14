/**
 * 优化后的 RBAC 权限配置（前端）
 * 与后端权限模型完全一致
 */

// 角色定义（与后端完全一致）
export enum Role {
  SUPER_ADMIN = 'super_admin',     // 超级管理员
  ADMIN = 'admin',                 // 管理员
  MANAGER = 'manager',             // 经理
  VIEWER = 'viewer',               // 访客
  CS_MANAGER = 'cs_manager',       // 客服主管
  CS_AGENT = 'cs_agent',           // 客服专员
}

// 资源类型（与后端完全一致）
export enum Resource {
  // 核心业务
  USERS = 'users',
  ORDERS = 'orders',

  // 算命业务
  FORTUNE_SERVICES = 'fortune_services',
  FORTUNE_CONTENT = 'fortune_content',

  // 营销系统
  BANNERS = 'banners',
  NOTIFICATIONS = 'notifications',
  COUPONS = 'coupons',

  // 用户交互
  REVIEWS = 'reviews',
  FEEDBACKS = 'feedbacks',
  REFUNDS = 'refunds',

  // 财务与支付
  FINANCIAL = 'financial',

  // 系统管理
  SYSTEM_CONFIG = 'system_config',
  AI_MODELS = 'ai_models',
  ADMINS = 'admins',
  ROLES = 'roles',

  // 统计与日志
  STATS = 'stats',
  AUDIT = 'audit',
  ATTRIBUTION = 'attribution',

  // 客服系统
  CS_WORKBENCH = 'cs_workbench',
  CS_TEAM = 'cs_team',
  CS_STATS = 'cs_stats',
}

// 操作类型（与后端完全一致）
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE = 'manage',
}

// 权限点枚举（用于页面和按钮级权限控制）
export enum Permission {
  // 用户管理
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',

  // 订单管理
  ORDERS_VIEW = 'orders:view',
  ORDERS_CREATE = 'orders:create',
  ORDERS_EDIT = 'orders:edit',
  ORDERS_DELETE = 'orders:delete',

  // 算命服务
  FORTUNE_SERVICES_VIEW = 'fortune_services:view',
  FORTUNE_SERVICES_CREATE = 'fortune_services:create',
  FORTUNE_SERVICES_EDIT = 'fortune_services:edit',
  FORTUNE_SERVICES_DELETE = 'fortune_services:delete',

  // 算命内容
  FORTUNE_CONTENT_VIEW = 'fortune_content:view',
  FORTUNE_CONTENT_CREATE = 'fortune_content:create',
  FORTUNE_CONTENT_EDIT = 'fortune_content:edit',
  FORTUNE_CONTENT_DELETE = 'fortune_content:delete',

  // 横幅管理
  BANNERS_VIEW = 'banners:view',
  BANNERS_CREATE = 'banners:create',
  BANNERS_EDIT = 'banners:edit',
  BANNERS_DELETE = 'banners:delete',

  // 通知管理
  NOTIFICATIONS_VIEW = 'notifications:view',
  NOTIFICATIONS_CREATE = 'notifications:create',
  NOTIFICATIONS_EDIT = 'notifications:edit',
  NOTIFICATIONS_DELETE = 'notifications:delete',

  // 优惠券
  COUPONS_VIEW = 'coupons:view',
  COUPONS_CREATE = 'coupons:create',
  COUPONS_EDIT = 'coupons:edit',
  COUPONS_DELETE = 'coupons:delete',

  // 评价
  REVIEWS_VIEW = 'reviews:view',
  REVIEWS_EDIT = 'reviews:edit',
  REVIEWS_DELETE = 'reviews:delete',

  // 反馈
  FEEDBACKS_VIEW = 'feedbacks:view',
  FEEDBACKS_EDIT = 'feedbacks:edit',

  // 退款
  REFUNDS_VIEW = 'refunds:view',
  REFUNDS_EDIT = 'refunds:edit',

  // 财务
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_EDIT = 'financial:edit',

  // 系统配置
  SYSTEM_CONFIG_VIEW = 'system_config:view',
  SYSTEM_CONFIG_EDIT = 'system_config:edit',

  // AI模型
  AI_MODELS_VIEW = 'ai_models:view',
  AI_MODELS_CREATE = 'ai_models:create',
  AI_MODELS_EDIT = 'ai_models:edit',
  AI_MODELS_DELETE = 'ai_models:delete',

  // 管理员
  ADMINS_VIEW = 'admins:view',
  ADMINS_CREATE = 'admins:create',
  ADMINS_EDIT = 'admins:edit',
  ADMINS_DELETE = 'admins:delete',

  // 角色
  ROLES_VIEW = 'roles:view',
  ROLES_CREATE = 'roles:create',
  ROLES_EDIT = 'roles:edit',
  ROLES_DELETE = 'roles:delete',

  // 统计
  STATS_VIEW = 'stats:view',

  // 审计日志
  AUDIT_VIEW = 'audit:view',

  // 归因分析
  ATTRIBUTION_VIEW = 'attribution:view',

  // 客服工作台
  CS_WORKBENCH_VIEW = 'cs_workbench:view',
  CS_WORKBENCH_CREATE = 'cs_workbench:create',
  CS_WORKBENCH_EDIT = 'cs_workbench:edit',

  // 客服团队
  CS_TEAM_VIEW = 'cs_team:view',
  CS_TEAM_CREATE = 'cs_team:create',
  CS_TEAM_EDIT = 'cs_team:edit',
  CS_TEAM_DELETE = 'cs_team:delete',

  // 客服统计
  CS_STATS_VIEW = 'cs_stats:view',

  // 向后兼容的别名
  USER_VIEW = 'users:view',
  USER_CREATE = 'users:create',
  USER_EDIT = 'users:edit',
  USER_DELETE = 'users:delete',
  USER_EXPORT = 'users:export',
  ORDER_VIEW = 'orders:view',
  ORDER_CREATE = 'orders:create',
  ORDER_EDIT = 'orders:edit',
  ORDER_DELETE = 'orders:delete',
  FORTUNE_VIEW = 'fortune_services:view',
  FORTUNE_CATEGORY_VIEW = 'fortune_services:view',
  FORTUNE_SERVICE_VIEW = 'fortune_services:view',
  REFUND_VIEW = 'refunds:view',
  REFUND_REVIEW = 'refunds:edit',
  COUPON_VIEW = 'coupons:view',
  COUPON_CREATE = 'coupons:create',
  COUPON_EDIT = 'coupons:edit',
  COUPON_DELETE = 'coupons:delete',
  BANNER_VIEW = 'banners:view',
  BANNER_CREATE = 'banners:create',
  BANNER_EDIT = 'banners:edit',
  BANNER_DELETE = 'banners:delete',
  NOTIFICATION_VIEW = 'notifications:view',
  NOTIFICATION_CREATE = 'notifications:create',
  NOTIFICATION_EDIT = 'notifications:edit',
  NOTIFICATION_DELETE = 'notifications:delete',
  FEEDBACK_VIEW = 'feedbacks:view',
  FEEDBACK_HANDLE = 'feedbacks:edit',
  REVIEW_VIEW = 'reviews:view',
  REVIEW_EDIT = 'reviews:edit',
  REVIEW_DELETE = 'reviews:delete',
  REVIEW_REPLY = 'reviews:edit',
  CS_AGENT_VIEW = 'cs_team:view',
  ADMIN_VIEW = 'admins:view',
  LOG_VIEW = 'audit:view',
  ROLE_VIEW = 'roles:view',
}

// 角色权限映射
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),

  [Role.ADMIN]: [
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_EDIT,
    Permission.ORDERS_DELETE,
    Permission.FORTUNE_SERVICES_VIEW,
    Permission.FORTUNE_SERVICES_CREATE,
    Permission.FORTUNE_SERVICES_EDIT,
    Permission.FORTUNE_SERVICES_DELETE,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.FORTUNE_CONTENT_CREATE,
    Permission.FORTUNE_CONTENT_EDIT,
    Permission.FORTUNE_CONTENT_DELETE,
    Permission.BANNERS_VIEW,
    Permission.BANNERS_CREATE,
    Permission.BANNERS_EDIT,
    Permission.BANNERS_DELETE,
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_CREATE,
    Permission.NOTIFICATIONS_EDIT,
    Permission.NOTIFICATIONS_DELETE,
    Permission.COUPONS_VIEW,
    Permission.COUPONS_CREATE,
    Permission.COUPONS_EDIT,
    Permission.COUPONS_DELETE,
    Permission.REVIEWS_VIEW,
    Permission.REVIEWS_EDIT,
    Permission.REVIEWS_DELETE,
    Permission.FEEDBACKS_VIEW,
    Permission.FEEDBACKS_EDIT,
    Permission.REFUNDS_VIEW,
    Permission.REFUNDS_EDIT,
    Permission.FINANCIAL_VIEW,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.SYSTEM_CONFIG_EDIT,
    Permission.AI_MODELS_VIEW,
    Permission.AI_MODELS_CREATE,
    Permission.AI_MODELS_EDIT,
    Permission.AI_MODELS_DELETE,
    Permission.ADMINS_VIEW,
    Permission.STATS_VIEW,
    Permission.AUDIT_VIEW,
    Permission.ATTRIBUTION_VIEW,
    Permission.CS_WORKBENCH_VIEW,
    Permission.CS_WORKBENCH_CREATE,
    Permission.CS_WORKBENCH_EDIT,
    Permission.CS_TEAM_VIEW,
    Permission.CS_TEAM_CREATE,
    Permission.CS_TEAM_EDIT,
    Permission.CS_TEAM_DELETE,
    Permission.CS_STATS_VIEW,
  ],

  [Role.MANAGER]: [
    Permission.USERS_VIEW,
    Permission.USERS_EDIT,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_EDIT,
    Permission.FORTUNE_SERVICES_VIEW,
    Permission.FORTUNE_SERVICES_EDIT,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.FORTUNE_CONTENT_EDIT,
    Permission.BANNERS_VIEW,
    Permission.BANNERS_EDIT,
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_EDIT,
    Permission.COUPONS_VIEW,
    Permission.COUPONS_EDIT,
    Permission.REVIEWS_VIEW,
    Permission.REVIEWS_EDIT,
    Permission.FEEDBACKS_VIEW,
    Permission.FEEDBACKS_EDIT,
    Permission.REFUNDS_VIEW,
    Permission.REFUNDS_EDIT,
    Permission.FINANCIAL_VIEW,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.AI_MODELS_VIEW,
    Permission.AI_MODELS_EDIT,
    Permission.STATS_VIEW,
    Permission.AUDIT_VIEW,
    Permission.ATTRIBUTION_VIEW,
  ],

  [Role.VIEWER]: [
    Permission.USERS_VIEW,
    Permission.ORDERS_VIEW,
    Permission.FORTUNE_SERVICES_VIEW,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.BANNERS_VIEW,
    Permission.NOTIFICATIONS_VIEW,
    Permission.COUPONS_VIEW,
    Permission.REVIEWS_VIEW,
    Permission.FEEDBACKS_VIEW,
    Permission.REFUNDS_VIEW,
    Permission.FINANCIAL_VIEW,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.AI_MODELS_VIEW,
    Permission.STATS_VIEW,
    Permission.AUDIT_VIEW,
    Permission.ATTRIBUTION_VIEW,
  ],

  [Role.CS_MANAGER]: [
    Permission.CS_WORKBENCH_VIEW,
    Permission.CS_WORKBENCH_CREATE,
    Permission.CS_WORKBENCH_EDIT,
    Permission.CS_TEAM_VIEW,
    Permission.CS_TEAM_CREATE,
    Permission.CS_TEAM_EDIT,
    Permission.CS_TEAM_DELETE,
    Permission.CS_STATS_VIEW,
  ],

  [Role.CS_AGENT]: [
    Permission.CS_WORKBENCH_VIEW,
    Permission.CS_WORKBENCH_CREATE,
    Permission.CS_WORKBENCH_EDIT,
  ],
}

// 角色中文名称
export const roleNames: Record<Role, string> = {
  [Role.SUPER_ADMIN]: '超级管理员',
  [Role.ADMIN]: '管理员',
  [Role.MANAGER]: '经理',
  [Role.VIEWER]: '访客',
  [Role.CS_MANAGER]: '客服主管',
  [Role.CS_AGENT]: '客服专员',
}

// 资源中文名称
export const resourceNames: Record<Resource, string> = {
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
}

/**
 * 检查用户是否有某个权限
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  const permissions = rolePermissions[role]
  return permissions ? permissions.includes(permission) : false
}

/**
 * 检查用户是否可以访问某个资源
 */
export const canAccessResource = (role: Role, resource: Resource): boolean => {
  const permissions = rolePermissions[role]
  if (!permissions) return false

  // 检查是否有该资源的任何权限
  const resourcePrefix = `${resource}:`
  return permissions.some(p => p.startsWith(resourcePrefix))
}

/**
 * 获取用户对某个资源的所有操作权限
 */
export const getResourceActions = (role: Role, resource: Resource): Action[] => {
  const permissions = rolePermissions[role]
  if (!permissions) return []

  const actions: Action[] = []
  const resourcePrefix = `${resource}:`

  permissions.forEach(p => {
    if (p.startsWith(resourcePrefix)) {
      const action = p.split(':')[1] as Action
      if (action && Object.values(Action).includes(action)) {
        actions.push(action)
      }
    }
  })

  return actions
}

/**
 * 创建权限检查器
 */
export const createPermissionChecker = (role: Role) => {
  return {
    has: (permission: Permission) => hasPermission(role, permission),
    canAccess: (resource: Resource) => canAccessResource(role, resource),
    getActions: (resource: Resource) => getResourceActions(role, resource),
    canView: (resource: Resource) => hasPermission(role, `${resource}:view` as Permission),
    canCreate: (resource: Resource) => hasPermission(role, `${resource}:create` as Permission),
    canEdit: (resource: Resource) => hasPermission(role, `${resource}:edit` as Permission),
    canDelete: (resource: Resource) => hasPermission(role, `${resource}:delete` as Permission),
  }
}
