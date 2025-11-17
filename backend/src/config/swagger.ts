import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '算命测算平台 API 文档',
    version: '1.0.0',
    description: `
      算命测算平台三端分离架构的 API 接口文档

      ## 架构说明
      - **公开API**: 无需认证的接口（横幅、通知等）
      - **用户端API**: C端用户使用的接口（需用户JWT认证）
      - **管理端API**: B端管理员使用的接口（需管理员JWT认证）

      ## 认证方式
      - 用户端: 使用 Bearer Token (通过 /api/auth/login 获取)
      - 管理端: 使用 Bearer Token (通过 /api/manage/auth/login 获取)

      ## 限流
      - 全局限流: 60次/分钟
      - 部分接口有额外限流配置
    `,
    contact: {
      name: 'API Support',
      email: 'support@fortune-platform.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:50301',
      description: '开发环境 (默认端口)'
    },
    {
      url: `http://localhost:${config.app.port}`,
      description: '开发环境 (自定义端口)'
    },
    {
      url: 'https://api.fortune-platform.com',
      description: '生产环境'
    }
  ],
  tags: [
    // 公开API标签
    {
      name: 'Public - Banners',
      description: '公开横幅展示接口'
    },
    {
      name: 'Public - Notifications',
      description: '公开通知展示接口'
    },
    {
      name: 'Public - Share',
      description: '分享点击追踪接口'
    },

    // 用户端API标签
    {
      name: 'User - Auth',
      description: '用户认证接口（注册、登录、验证码）'
    },
    {
      name: 'User - Cart',
      description: '购物车管理接口'
    },
    {
      name: 'User - Favorites',
      description: '收藏管理接口'
    },
    {
      name: 'User - History',
      description: '浏览历史接口'
    },
    {
      name: 'User - Fortune List',
      description: '算命服务列表接口'
    },
    {
      name: 'User - Orders',
      description: '用户订单接口'
    },
    {
      name: 'User - Coupons',
      description: '用户优惠券接口'
    },
    {
      name: 'User - Reviews',
      description: '用户评价接口'
    },
    {
      name: 'User - Daily Horoscopes',
      description: '每日运势接口'
    },
    {
      name: 'User - Articles',
      description: '文章接口'
    },
    {
      name: 'User - Notifications',
      description: '用户通知接口'
    },
    {
      name: 'User - Chat',
      description: 'WebChat 聊天接口'
    },
    {
      name: 'User - Fortune Results',
      description: '算命结果查询接口'
    },
    {
      name: 'User - Payments',
      description: '用户支付接口'
    },
    {
      name: 'User - Policies',
      description: '用户协议和政策接口'
    },
    {
      name: 'User - Share',
      description: '用户分享接口'
    },

    // 算命计算接口
    {
      name: 'Fortune - Calculation',
      description: '算命计算接口（生肖运势、八字精批等）'
    },

    // 管理端API标签
    {
      name: 'Admin - Auth',
      description: '管理员认证接口'
    },
    {
      name: 'Admin - Users',
      description: '用户管理接口'
    },
    {
      name: 'Admin - Orders',
      description: '订单管理接口'
    },
    {
      name: 'Admin - Stats',
      description: '统计数据接口'
    },
    {
      name: 'Admin - Audit',
      description: '审计日志接口'
    },
    {
      name: 'Admin - Banners',
      description: '横幅管理接口'
    },
    {
      name: 'Admin - Notifications',
      description: '通知管理接口'
    },
    {
      name: 'Admin - Refunds',
      description: '退款管理接口'
    },
    {
      name: 'Admin - Feedbacks',
      description: '反馈管理接口'
    },
    {
      name: 'Admin - Reviews',
      description: '评价管理接口'
    },
    {
      name: 'Admin - Coupons',
      description: '优惠券管理接口'
    },
    {
      name: 'Admin - Financial',
      description: '财务管理接口'
    },
    {
      name: 'Admin - Admins',
      description: '管理员管理接口'
    },
    {
      name: 'Admin - Fortune Management',
      description: '算命业务管理接口'
    },
    {
      name: 'Admin - AI Models',
      description: 'AI模型管理接口'
    },
    {
      name: 'Admin - Attribution',
      description: '归因分析接口'
    },
    {
      name: 'Admin - Customer Service',
      description: '客服管理接口'
    },
    {
      name: 'Admin - Articles',
      description: '文章管理接口'
    },
    {
      name: 'Admin - Daily Horoscopes',
      description: '每日运势管理接口'
    },
    {
      name: 'Admin - Fortune Categories',
      description: '算命分类管理接口'
    },
    {
      name: 'Admin - Email Templates',
      description: '邮件模板管理接口'
    },
    {
      name: 'Admin - Notification Templates',
      description: '通知模板管理接口'
    },
    {
      name: 'Admin - Password Reset',
      description: '密码重置管理接口'
    },
    {
      name: 'Admin - Payment Configs',
      description: '支付配置管理接口'
    },
    {
      name: 'Admin - Payment Methods',
      description: '支付方式管理接口'
    },
    {
      name: 'Admin - Payment Transactions',
      description: '支付交易管理接口'
    },
    {
      name: 'Admin - Share Analytics',
      description: '分享数据分析接口'
    },
    {
      name: 'Admin - System',
      description: '系统配置管理接口'
    },
    {
      name: 'Admin - Two Factor Auth',
      description: '双因素认证管理接口'
    },
    {
      name: 'Admin - Users (General)',
      description: '用户管理通用接口'
    },
    {
      name: 'Admin - Chat Sessions',
      description: '聊天会话管理接口'
    },
    {
      name: 'Admin - CS Schedule',
      description: '客服排班管理接口'
    },
    {
      name: 'Admin - Customer Notes',
      description: '客户备注管理接口'
    },
    {
      name: 'Admin - Customer Profile',
      description: '客户画像管理接口'
    },
    {
      name: 'Admin - Customer Tags',
      description: '客户标签管理接口'
    },
    {
      name: 'Admin - Knowledge Base',
      description: '知识库管理接口'
    },
    {
      name: 'Admin - Session Transfers',
      description: '会话转接管理接口'
    },
    {
      name: 'Admin - Training',
      description: '培训管理接口'
    },
    {
      name: 'WebChat - AI Bot',
      description: 'WebChat AI机器人接口'
    },
    {
      name: 'WebChat - Satisfaction',
      description: 'WebChat 满意度接口'
    },
    {
      name: 'General',
      description: '通用接口'
    }
  ],
  components: {
    securitySchemes: {
      UserBearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '用户端JWT Token (通过 /api/auth/login 获取)'
      },
      AdminBearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '管理端JWT Token (通过 /api/manage/auth/login 获取)'
      }
    },
    schemas: {
      // 通用响应模型
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: '操作成功'
          },
          data: {
            type: 'object',
            description: '响应数据（具体结构视接口而定）'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: '操作失败'
          },
          error: {
            type: 'string',
            description: '错误详情'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1
              },
              limit: {
                type: 'integer',
                example: 20
              },
              total: {
                type: 'integer',
                example: 100
              },
              totalPages: {
                type: 'integer',
                example: 5
              }
            }
          }
        }
      },

      // 用户相关模型
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'user-001'
          },
          phone: {
            type: 'string',
            example: '13900000001'
          },
          username: {
            type: 'string',
            example: 'user123'
          },
          email: {
            type: 'string',
            example: 'user@example.com'
          },
          avatar: {
            type: 'string',
            example: 'https://example.com/avatar.jpg'
          },
          balance: {
            type: 'number',
            example: 100.00
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'banned'],
            example: 'active'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // 订单相关模型
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'order-001'
          },
          user_id: {
            type: 'string',
            example: 'user-001'
          },
          fortune_id: {
            type: 'string',
            example: 'fortune-001'
          },
          total_amount: {
            type: 'number',
            example: 99.00
          },
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded'],
            example: 'pending'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // 算命服务模型
      Fortune: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'fortune-001'
          },
          name: {
            type: 'string',
            example: '八字精批'
          },
          category: {
            type: 'string',
            enum: ['zodiac', 'bazi', 'fleeting', 'name', 'marriage', 'career', 'wealth', 'health'],
            example: 'bazi'
          },
          price: {
            type: 'number',
            example: 99.00
          },
          description: {
            type: 'string',
            example: '根据您的生辰八字，详细分析命运走势'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            example: 'active'
          }
        }
      },

      // 管理员模型
      Admin: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'admin-001'
          },
          username: {
            type: 'string',
            example: 'admin'
          },
          email: {
            type: 'string',
            example: 'admin@fortune.com'
          },
          role: {
            type: 'string',
            enum: ['super_admin', 'admin', 'manager', 'operator', 'viewer'],
            example: 'admin'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            example: 'active'
          }
        }
      },

      // 横幅模型
      Banner: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'banner-001'
          },
          title: {
            type: 'string',
            example: '新春特惠'
          },
          image_url: {
            type: 'string',
            example: 'https://example.com/banner.jpg'
          },
          link_url: {
            type: 'string',
            example: '/fortunes/special'
          },
          sort_order: {
            type: 'integer',
            example: 1
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            example: 'active'
          }
        }
      }
    }
  }
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  // API文件路径（包含Swagger注解的文件）
  apis: [
    './src/routes/**/*.ts',
    './src/controllers/**/*.ts',
    './src/index.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
