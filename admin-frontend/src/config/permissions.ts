/**
 * RBAC 权限管理配置
 */

// 权限操作枚举
export enum Permission {
  // 用户管理
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_EXPORT = 'user:export',

  // 订单管理
  ORDER_VIEW = 'order:view',
  ORDER_CREATE = 'order:create',
  ORDER_EDIT = 'order:edit',
  ORDER_DELETE = 'order:delete',
  ORDER_EXPORT = 'order:export',
  ORDER_REFUND = 'order:refund',

  // 算命管理
  FORTUNE_VIEW = 'fortune:view',
  FORTUNE_CREATE = 'fortune:create',
  FORTUNE_EDIT = 'fortune:edit',
  FORTUNE_DELETE = 'fortune:delete',

  // 算命分类管理
  FORTUNE_CATEGORY_VIEW = 'fortune_category:view',
  FORTUNE_CATEGORY_CREATE = 'fortune_category:create',
  FORTUNE_CATEGORY_EDIT = 'fortune_category:edit',
  FORTUNE_CATEGORY_DELETE = 'fortune_category:delete',

  // 算命服务管理
  FORTUNE_SERVICE_VIEW = 'fortune_service:view',
  FORTUNE_SERVICE_CREATE = 'fortune_service:create',
  FORTUNE_SERVICE_EDIT = 'fortune_service:edit',
  FORTUNE_SERVICE_DELETE = 'fortune_service:delete',

  // 系统配置管理
  SYSTEM_CONFIG_VIEW = 'system_config:view',
  SYSTEM_CONFIG_CREATE = 'system_config:create',
  SYSTEM_CONFIG_EDIT = 'system_config:edit',
  SYSTEM_CONFIG_DELETE = 'system_config:delete',

  // 算命内容管理（模板、运势、文章）
  FORTUNE_CONTENT_VIEW = 'fortune_content:view',
  FORTUNE_CONTENT_CREATE = 'fortune_content:create',
  FORTUNE_CONTENT_EDIT = 'fortune_content:edit',
  FORTUNE_CONTENT_DELETE = 'fortune_content:delete',

  // 统计分析
  STATS_VIEW = 'stats:view',
  STATS_EXPORT = 'stats:export',

  // 系统设置
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',

  // 日志管理
  LOG_VIEW = 'log:view',
  LOG_DELETE = 'log:delete',

  // 角色权限管理
  ROLE_VIEW = 'role:view',
  ROLE_CREATE = 'role:create',
  ROLE_EDIT = 'role:edit',
  ROLE_DELETE = 'role:delete',

  // 轮播图管理
  BANNER_VIEW = 'banner:view',
  BANNER_CREATE = 'banner:create',
  BANNER_EDIT = 'banner:edit',
  BANNER_DELETE = 'banner:delete',

  // 通知管理
  NOTIFICATION_VIEW = 'notification:view',
  NOTIFICATION_CREATE = 'notification:create',
  NOTIFICATION_EDIT = 'notification:edit',
  NOTIFICATION_DELETE = 'notification:delete',

  // 财务管理
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_EXPORT = 'financial:export',

  // 退款管理
  REFUND_VIEW = 'refund:view',
  REFUND_REVIEW = 'refund:review',

  // 用户反馈管理
  FEEDBACK_VIEW = 'feedback:view',
  FEEDBACK_HANDLE = 'feedback:handle',

  // 评价管理
  REVIEW_VIEW = 'review:view',
  REVIEW_REPLY = 'review:reply',
  REVIEW_EDIT = 'review:edit',
  REVIEW_DELETE = 'review:delete',

  // 优惠券管理
  COUPON_VIEW = 'coupon:view',
  COUPON_CREATE = 'coupon:create',
  COUPON_EDIT = 'coupon:edit',
  COUPON_DELETE = 'coupon:delete',

  // 管理员管理
  ADMIN_VIEW = 'admin:view',
  ADMIN_CREATE = 'admin:create',
  ADMIN_EDIT = 'admin:edit',
  ADMIN_DELETE = 'admin:delete',
}

// 角色定义
export enum Role {
  SUPER_ADMIN = 'super_admin',     // 超级管理员
  ADMIN = 'admin',                 // 管理员
  MANAGER = 'manager',             // 经理
  EDITOR = 'editor',               // 编辑员
  OPERATOR = 'operator',           // 操作员
  VIEWER = 'viewer',               // 只读用户
}

// 角色权限映射
export const rolePermissions: Record<Role, Permission[]> = {
  // 超级管理员：拥有所有权限
  [Role.SUPER_ADMIN]: Object.values(Permission),

  // 管理员：拥有大部分权限，除了角色管理
  [Role.ADMIN]: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.USER_EXPORT,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_EDIT,
    Permission.ORDER_DELETE,
    Permission.ORDER_EXPORT,
    Permission.ORDER_REFUND,
    Permission.FORTUNE_VIEW,
    Permission.FORTUNE_CREATE,
    Permission.FORTUNE_EDIT,
    Permission.FORTUNE_DELETE,
    Permission.FORTUNE_CATEGORY_VIEW,
    Permission.FORTUNE_CATEGORY_CREATE,
    Permission.FORTUNE_CATEGORY_EDIT,
    Permission.FORTUNE_CATEGORY_DELETE,
    Permission.FORTUNE_SERVICE_VIEW,
    Permission.FORTUNE_SERVICE_CREATE,
    Permission.FORTUNE_SERVICE_EDIT,
    Permission.FORTUNE_SERVICE_DELETE,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.SYSTEM_CONFIG_CREATE,
    Permission.SYSTEM_CONFIG_EDIT,
    Permission.SYSTEM_CONFIG_DELETE,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.FORTUNE_CONTENT_CREATE,
    Permission.FORTUNE_CONTENT_EDIT,
    Permission.FORTUNE_CONTENT_DELETE,
    Permission.STATS_VIEW,
    Permission.STATS_EXPORT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.LOG_VIEW,
    Permission.BANNER_VIEW,
    Permission.BANNER_CREATE,
    Permission.BANNER_EDIT,
    Permission.BANNER_DELETE,
    Permission.NOTIFICATION_VIEW,
    Permission.NOTIFICATION_CREATE,
    Permission.NOTIFICATION_EDIT,
    Permission.NOTIFICATION_DELETE,
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_EXPORT,
    Permission.REFUND_VIEW,
    Permission.REFUND_REVIEW,
    Permission.FEEDBACK_VIEW,
    Permission.FEEDBACK_HANDLE,
    Permission.REVIEW_VIEW,
    Permission.REVIEW_REPLY,
    Permission.REVIEW_EDIT,
    Permission.REVIEW_DELETE,
    Permission.COUPON_VIEW,
    Permission.COUPON_CREATE,
    Permission.COUPON_EDIT,
    Permission.COUPON_DELETE,
  ],

  // 经理：可以查看和编辑，但不能删除
  [Role.MANAGER]: [
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.USER_EXPORT,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
    Permission.ORDER_EXPORT,
    Permission.ORDER_REFUND,
    Permission.FORTUNE_VIEW,
    Permission.FORTUNE_EDIT,
    Permission.FORTUNE_CATEGORY_VIEW,
    Permission.FORTUNE_CATEGORY_EDIT,
    Permission.FORTUNE_SERVICE_VIEW,
    Permission.FORTUNE_SERVICE_EDIT,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.SYSTEM_CONFIG_EDIT,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.FORTUNE_CONTENT_EDIT,
    Permission.STATS_VIEW,
    Permission.STATS_EXPORT,
    Permission.SETTINGS_VIEW,
    Permission.LOG_VIEW,
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_EXPORT,
    Permission.REFUND_VIEW,
    Permission.REFUND_REVIEW,
    Permission.FEEDBACK_VIEW,
    Permission.FEEDBACK_HANDLE,
    Permission.REVIEW_VIEW,
    Permission.REVIEW_REPLY,
    Permission.REVIEW_EDIT,
    Permission.COUPON_VIEW,
    Permission.COUPON_EDIT,
  ],

  // 编辑员：可以查看和编辑内容
  [Role.EDITOR]: [
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
    Permission.FORTUNE_VIEW,
    Permission.FORTUNE_EDIT,
    Permission.FORTUNE_CATEGORY_VIEW,
    Permission.FORTUNE_CATEGORY_EDIT,
    Permission.FORTUNE_SERVICE_VIEW,
    Permission.FORTUNE_SERVICE_EDIT,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.FORTUNE_CONTENT_EDIT,
    Permission.STATS_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.LOG_VIEW,
  ],

  // 操作员：只能查看和创建
  [Role.OPERATOR]: [
    Permission.USER_VIEW,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.FORTUNE_VIEW,
    Permission.FORTUNE_CATEGORY_VIEW,
    Permission.FORTUNE_SERVICE_VIEW,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.STATS_VIEW,
  ],

  // 只读用户：只能查看
  [Role.VIEWER]: [
    Permission.USER_VIEW,
    Permission.ORDER_VIEW,
    Permission.FORTUNE_VIEW,
    Permission.FORTUNE_CATEGORY_VIEW,
    Permission.FORTUNE_SERVICE_VIEW,
    Permission.SYSTEM_CONFIG_VIEW,
    Permission.FORTUNE_CONTENT_VIEW,
    Permission.STATS_VIEW,
    Permission.SETTINGS_VIEW,
  ],
}

// 角色中文名称
export const roleNames: Record<Role, string> = {
  [Role.SUPER_ADMIN]: '超级管理员',
  [Role.ADMIN]: '管理员',
  [Role.MANAGER]: '经理',
  [Role.EDITOR]: '编辑员',
  [Role.OPERATOR]: '操作员',
  [Role.VIEWER]: '访客',
}

// 权限中文名称
export const permissionNames: Record<Permission, string> = {
  [Permission.USER_VIEW]: '查看用户',
  [Permission.USER_CREATE]: '创建用户',
  [Permission.USER_EDIT]: '编辑用户',
  [Permission.USER_DELETE]: '删除用户',
  [Permission.USER_EXPORT]: '导出用户',
  [Permission.ORDER_VIEW]: '查看订单',
  [Permission.ORDER_CREATE]: '创建订单',
  [Permission.ORDER_EDIT]: '编辑订单',
  [Permission.ORDER_DELETE]: '删除订单',
  [Permission.ORDER_EXPORT]: '导出订单',
  [Permission.ORDER_REFUND]: '订单退款',
  [Permission.FORTUNE_VIEW]: '查看算命',
  [Permission.FORTUNE_CREATE]: '创建算命',
  [Permission.FORTUNE_EDIT]: '编辑算命',
  [Permission.FORTUNE_DELETE]: '删除算命',
  [Permission.FORTUNE_CATEGORY_VIEW]: '查看算命分类',
  [Permission.FORTUNE_CATEGORY_CREATE]: '创建算命分类',
  [Permission.FORTUNE_CATEGORY_EDIT]: '编辑算命分类',
  [Permission.FORTUNE_CATEGORY_DELETE]: '删除算命分类',
  [Permission.FORTUNE_SERVICE_VIEW]: '查看算命服务',
  [Permission.FORTUNE_SERVICE_CREATE]: '创建算命服务',
  [Permission.FORTUNE_SERVICE_EDIT]: '编辑算命服务',
  [Permission.FORTUNE_SERVICE_DELETE]: '删除算命服务',
  [Permission.SYSTEM_CONFIG_VIEW]: '查看系统配置',
  [Permission.SYSTEM_CONFIG_CREATE]: '创建系统配置',
  [Permission.SYSTEM_CONFIG_EDIT]: '编辑系统配置',
  [Permission.SYSTEM_CONFIG_DELETE]: '删除系统配置',
  [Permission.FORTUNE_CONTENT_VIEW]: '查看算命内容',
  [Permission.FORTUNE_CONTENT_CREATE]: '创建算命内容',
  [Permission.FORTUNE_CONTENT_EDIT]: '编辑算命内容',
  [Permission.FORTUNE_CONTENT_DELETE]: '删除算命内容',
  [Permission.STATS_VIEW]: '查看统计',
  [Permission.STATS_EXPORT]: '导出统计',
  [Permission.SETTINGS_VIEW]: '查看设置',
  [Permission.SETTINGS_EDIT]: '编辑设置',
  [Permission.LOG_VIEW]: '查看日志',
  [Permission.LOG_DELETE]: '删除日志',
  [Permission.ROLE_VIEW]: '查看角色',
  [Permission.ROLE_CREATE]: '创建角色',
  [Permission.ROLE_EDIT]: '编辑角色',
  [Permission.ROLE_DELETE]: '删除角色',
  [Permission.BANNER_VIEW]: '查看轮播图',
  [Permission.BANNER_CREATE]: '创建轮播图',
  [Permission.BANNER_EDIT]: '编辑轮播图',
  [Permission.BANNER_DELETE]: '删除轮播图',
  [Permission.NOTIFICATION_VIEW]: '查看通知',
  [Permission.NOTIFICATION_CREATE]: '创建通知',
  [Permission.NOTIFICATION_EDIT]: '编辑通知',
  [Permission.NOTIFICATION_DELETE]: '删除通知',
  [Permission.FINANCIAL_VIEW]: '查看财务',
  [Permission.FINANCIAL_EXPORT]: '导出财务',
  [Permission.REFUND_VIEW]: '查看退款',
  [Permission.REFUND_REVIEW]: '审核退款',
  [Permission.FEEDBACK_VIEW]: '查看反馈',
  [Permission.FEEDBACK_HANDLE]: '处理反馈',
  [Permission.REVIEW_VIEW]: '查看评价',
  [Permission.REVIEW_REPLY]: '回复评价',
  [Permission.REVIEW_EDIT]: '编辑评价',
  [Permission.REVIEW_DELETE]: '删除评价',
  [Permission.COUPON_VIEW]: '查看优惠券',
  [Permission.COUPON_CREATE]: '创建优惠券',
  [Permission.COUPON_EDIT]: '编辑优惠券',
  [Permission.COUPON_DELETE]: '删除优惠券',
  [Permission.ADMIN_VIEW]: '查看管理员',
  [Permission.ADMIN_CREATE]: '创建管理员',
  [Permission.ADMIN_EDIT]: '编辑管理员',
  [Permission.ADMIN_DELETE]: '删除管理员',
}
