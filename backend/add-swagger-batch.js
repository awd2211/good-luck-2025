#!/usr/bin/env node

/**
 * 批量为路由文件添加 Swagger 注解
 */

const fs = require('fs');
const path = require('path');

// 归因分析 API 端点配置
const attributionEndpoints = {
  // 渠道管理
  'POST /channels': {
    summary: '创建营销渠道',
    description: '创建新的营销渠道配置',
    requestBody: {
      name: '渠道名称',
      code: '渠道代码',
      type: '渠道类型'
    }
  },
  'PUT /channels/:id': {
    summary: '更新营销渠道',
    description: '更新指定营销渠道的配置信息',
    params: ['id: 渠道ID']
  },
  'DELETE /channels/:id': {
    summary: '删除营销渠道',
    description: '删除指定的营销渠道',
    params: ['id: 渠道ID']
  },

  // UTM模板管理
  'GET /utm-templates': {
    summary: '获取UTM模板列表',
    description: '获取所有UTM参数模板配置'
  },
  'POST /utm-templates': {
    summary: '创建UTM模板',
    description: '创建新的UTM参数模板'
  },
  'PUT /utm-templates/:id': {
    summary: '更新UTM模板',
    description: '更新指定UTM模板配置',
    params: ['id: 模板ID']
  },
  'DELETE /utm-templates/:id': {
    summary: '删除UTM模板',
    description: '删除指定的UTM模板',
    params: ['id: 模板ID']
  },

  // 推广码管理
  'GET /promotion-codes': {
    summary: '获取推广码列表',
    description: '获取所有推广码配置'
  },
  'POST /promotion-codes': {
    summary: '创建推广码',
    description: '创建新的推广码'
  },
  'PUT /promotion-codes/:id': {
    summary: '更新推广码',
    description: '更新指定推广码',
    params: ['id: 推广码ID']
  },
  'DELETE /promotion-codes/:id': {
    summary: '删除推广码',
    description: '删除指定的推广码',
    params: ['id: 推广码ID']
  },

  // 转化事件
  'GET /conversion-events': {
    summary: '获取转化事件列表',
    description: '获取所有转化事件定义'
  },
  'POST /conversion-events': {
    summary: '创建转化事件',
    description: '创建新的转化事件定义'
  },
  'PUT /conversion-events/:id': {
    summary: '更新转化事件',
    description: '更新指定转化事件',
    params: ['id: 事件ID']
  },
  'DELETE /conversion-events/:id': {
    summary: '删除转化事件',
    description: '删除指定的转化事件',
    params: ['id: 事件ID']
  },

  // 数据追踪
  'POST /track-visit': {
    summary: '追踪用户访问',
    description: '记录用户访问事件,用于归因分析'
  },

  // 分析API
  'GET /dashboard': {
    summary: '获取归因分析看板',
    description: '获取归因分析实时数据看板'
  },
  'GET /funnel': {
    summary: '获取转化漏斗数据',
    description: '获取用户转化漏斗分析数据'
  },
  'GET /touchpoints': {
    summary: '获取多触点归因数据',
    description: '获取用户多触点归因分析'
  },
  'GET /model-comparison': {
    summary: '获取归因模型对比',
    description: '对比不同归因模型的效果'
  },
  'GET /roi': {
    summary: '获取ROI分析',
    description: '获取各渠道ROI计算结果'
  },
  'GET /channel-comparison': {
    summary: '获取渠道对比数据',
    description: '对比各营销渠道的转化效果'
  },
  'GET /trends': {
    summary: '获取趋势分析',
    description: '获取归因数据的时间趋势'
  },
  'GET /user-quality': {
    summary: '获取用户质量分析',
    description: '分析不同渠道带来的用户质量'
  },

  // 自定义报表
  'GET /custom-reports': {
    summary: '获取自定义报表列表',
    description: '获取所有自定义报表配置'
  },
  'POST /custom-reports': {
    summary: '创建自定义报表',
    description: '创建新的自定义报表'
  },
  'PUT /custom-reports/:id': {
    summary: '更新自定义报表',
    description: '更新指定自定义报表配置',
    params: ['id: 报表ID']
  },
  'DELETE /custom-reports/:id': {
    summary: '删除自定义报表',
    description: '删除指定的自定义报表',
    params: ['id: 报表ID']
  },
  'GET /custom-reports/:id/data': {
    summary: '获取报表数据',
    description: '获取指定自定义报表的数据',
    params: ['id: 报表ID']
  }
};

// 生成 Swagger 注解
function generateSwaggerAnnotation(method, path, config, basePrefix = '/api/manage/attribution') {
  const fullPath = `${basePrefix}${path}`;
  const hasParams = path.includes(':');
  const hasBody = ['POST', 'PUT'].includes(method);

  let annotation = `/**
 * @openapi
 * ${fullPath}:
 *   ${method.toLowerCase()}:
 *     summary: ${config.summary}
 *     description: ${config.description}
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []`;

  // 添加参数
  if (hasParams || method === 'GET') {
    annotation += `\n *     parameters:`;

    if (hasParams && config.params) {
      config.params.forEach(param => {
        const [name, desc] = param.split(':').map(s => s.trim());
        annotation += `
 *       - in: path
 *         name: ${name}
 *         required: true
 *         schema:
 *           type: string
 *         description: ${desc}`;
      });
    }

    if (method === 'GET' && !path.includes(':id/')) {
      annotation += `
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量`;
    }
  }

  // 添加请求体
  if (hasBody && config.requestBody) {
    annotation += `\n *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:`;

    Object.entries(config.requestBody).forEach(([key, desc]) => {
      annotation += `
 *               ${key}:
 *                 type: string
 *                 description: ${desc}`;
    });
  }

  // 添加响应
  const successCode = method === 'POST' ? '201' : '200';
  annotation += `\n *     responses:
 *       ${successCode}:
 *         description: ${method === 'POST' ? '创建成功' : method === 'DELETE' ? '删除成功' : '操作成功'}
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'`;

  if (hasParams) {
    annotation += `
 *       404:
 *         $ref: '#/components/responses/NotFoundError'`;
  }

  annotation += `\n */`;

  return annotation;
}

console.log('开始生成 Swagger 注解...\n');

let totalGenerated = 0;

// 为每个端点生成注解
Object.entries(attributionEndpoints).forEach(([key, config]) => {
  const [method, path] = key.split(' ');
  const annotation = generateSwaggerAnnotation(method, path, config);
  console.log(annotation);
  console.log('\n' + '='.repeat(80) + '\n');
  totalGenerated++;
});

console.log(`✅ 共生成 ${totalGenerated} 个端点的 Swagger 注解`);
console.log('\n请将生成的注解复制到对应的路由定义之前');
