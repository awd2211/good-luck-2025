# Swagger 注解添加指南

## 快速参考

### 基本结构

```typescript
/**
 * @openapi
 * /api/endpoint-path:
 *   http-method:
 *     summary: 一句话描述
 *     description: 详细说明
 *     tags:
 *       - 标签名称
 *     responses:
 *       200:
 *         description: 成功
 */
router.method('/endpoint-path', handler);
```

## 常用模板

### 1. GET 请求 (无参数)

```typescript
/**
 * @openapi
 * /api/items:
 *   get:
 *     summary: 获取列表
 *     description: 获取所有项目列表
 *     tags:
 *       - Items
 *     responses:
 *       200:
 *         description: 成功返回列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/items', getItems);
```

### 2. GET 请求 (带查询参数)

```typescript
/**
 * @openapi
 * /api/items:
 *   get:
 *     summary: 搜索项目
 *     description: 根据条件搜索项目
 *     tags:
 *       - Items
 *     parameters:
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
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/items', searchItems);
```

### 3. GET 请求 (带路径参数)

```typescript
/**
 * @openapi
 * /api/items/{id}:
 *   get:
 *     summary: 获取单个项目
 *     description: 根据ID获取项目详情
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: 项目不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/items/:id', getItemById);
```

### 4. POST 请求 (创建资源)

```typescript
/**
 * @openapi
 * /api/items:
 *   post:
 *     summary: 创建项目
 *     description: 创建新的项目
 *     tags:
 *       - Items
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "项目名称"
 *               description:
 *                 type: string
 *                 example: "项目描述"
 *               price:
 *                 type: number
 *                 example: 99.99
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/items', authenticateUser, createItem);
```

### 5. PUT 请求 (更新资源)

```typescript
/**
 * @openapi
 * /api/items/{id}:
 *   put:
 *     summary: 更新项目
 *     description: 更新指定ID的项目
 *     tags:
 *       - Items
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "新名称"
 *               description:
 *                 type: string
 *                 example: "新描述"
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 项目不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/items/:id', authenticateUser, updateItem);
```

### 6. DELETE 请求

```typescript
/**
 * @openapi
 * /api/items/{id}:
 *   delete:
 *     summary: 删除项目
 *     description: 删除指定ID的项目
 *     tags:
 *       - Items
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: 无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 项目不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/items/:id', authenticateAdmin, deleteItem);
```

## 特殊场景

### 文件上传

```typescript
/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: 上传文件
 *     description: 上传图片或文档
 *     tags:
 *       - Upload
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "https://example.com/uploads/file.jpg"
 */
router.post('/upload', authenticateUser, uploadFile);
```

### 数组响应

```typescript
/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: 获取标签列表
 *     description: 获取所有可用标签
 *     tags:
 *       - Tags
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["标签1", "标签2", "标签3"]
 */
router.get('/tags', getTags);
```

### 枚举类型

```typescript
/**
 * @openapi
 * /api/items:
 *   post:
 *     summary: 创建项目
 *     tags:
 *       - Items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                   - pending
 *                 example: active
 *               priority:
 *                 type: integer
 *                 enum:
 *                   - 1
 *                   - 2
 *                   - 3
 *                 example: 1
 */
router.post('/items', createItem);
```

## 认证配置

### 用户认证 (UserBearerAuth)

```typescript
/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     summary: 获取用户资料
 *     tags:
 *       - User
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *       401:
 *         description: 未认证
 */
router.get('/user/profile', authenticateUser, getUserProfile);
```

### 管理员认证 (AdminBearerAuth)

```typescript
/**
 * @openapi
 * /api/manage/users:
 *   get:
 *     summary: 获取用户列表
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/manage/users', authenticateAdmin, getUsers);
```

## 使用已定义的模型

在 `backend/src/config/swagger.ts` 中已定义的模型:

```typescript
// 引用成功响应
schema:
  $ref: '#/components/schemas/SuccessResponse'

// 引用错误响应
schema:
  $ref: '#/components/schemas/ErrorResponse'

// 引用分页响应
schema:
  $ref: '#/components/schemas/PaginatedResponse'

// 引用用户模型
schema:
  $ref: '#/components/schemas/User'

// 引用订单模型
schema:
  $ref: '#/components/schemas/Order'

// 引用算命服务模型
schema:
  $ref: '#/components/schemas/Fortune'

// 引用管理员模型
schema:
  $ref: '#/components/schemas/Admin'

// 引用横幅模型
schema:
  $ref: '#/components/schemas/Banner'
```

## 标签分类

使用已定义的标签 (参考 `backend/src/config/swagger.ts`):

**公开API:**
- `Public - Banners`
- `Public - Notifications`
- `Public - Share`

**用户端API:**
- `User - Auth`
- `User - Fortune`
- `User - Cart`
- `User - Favorites`
- `User - Orders`
- `User - Coupons`
- `User - Reviews`
- 等等...

**管理端API:**
- `Admin - Auth`
- `Admin - Users`
- `Admin - Orders`
- `Admin - Stats`
- 等等...

## 最佳实践

### 1. 描述要清晰
- summary: 一句话说明接口作用
- description: 详细说明业务逻辑和注意事项

### 2. 示例要真实
- 使用实际可能出现的值
- 手机号: 13900000001
- 邮箱: user@example.com
- 价格: 99.99

### 3. 响应码要完整
- 200/201: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误

### 4. 必填字段要标注
```typescript
schema:
  type: object
  required:
    - field1
    - field2
  properties:
    field1:
      type: string
    field2:
      type: number
```

### 5. 引用已定义的模型
避免重复定义相同的结构,使用 `$ref` 引用已定义的模型

## 调试技巧

### 查看生成的文档
```
http://localhost:50301/api-docs
```

### 下载 JSON 验证格式
```bash
curl http://localhost:50301/api-docs.json | jq . > spec.json
```

### 使用在线验证器
1. 访问 https://editor.swagger.io/
2. 粘贴 OpenAPI JSON
3. 查看验证结果

## 常见问题

### Q: 修改注解后文档没更新?
A: 需要重启后端服务,Swagger 在启动时生成

### Q: YAML 缩进错误?
A: 注释中的 YAML 必须严格按照缩进规则 (2个空格)

### Q: 如何添加新的数据模型?
A: 在 `backend/src/config/swagger.ts` 的 `components.schemas` 中添加

### Q: 某些接口不显示?
A: 检查路由文件是否在 `swagger.ts` 的 `apis` 配置中

## 下一步

1. 为购物车接口添加注解 (`routes/user/cart.ts`)
2. 为订单接口添加注解 (`routes/user/orders.ts`)
3. 为管理端用户管理添加注解 (`routes/manage/users.ts`)
4. 为统计接口添加注解 (`routes/stats.ts`)

参考已完成的 `routes/user/auth.ts` 和 `routes/public/banners.ts`
