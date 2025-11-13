# 算命平台管理后台

独立的管理后台系统，用于管理算命平台的用户、订单、功能等。

## 🚀 快速开始

### 启动开发服务器

```bash
cd admin-frontend
npm run dev
```

访问地址：http://localhost:8888

### 登录信息

- 用户名：`admin`
- 密码：`admin123`

## 📦 技术栈

- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **Axios** - HTTP客户端
- **Day.js** - 日期处理

## 📁 目录结构

```
admin-frontend/
├── src/
│   ├── layouts/          # 布局组件
│   │   └── MainLayout.tsx
│   ├── pages/            # 页面组件
│   │   ├── Login.tsx     # 登录页
│   │   ├── Dashboard.tsx # 数据概览
│   │   ├── UserManagement.tsx      # 用户管理
│   │   ├── OrderManagement.tsx     # 订单管理
│   │   ├── FortuneManagement.tsx   # 算命管理
│   │   ├── Statistics.tsx          # 统计分析
│   │   └── Settings.tsx            # 系统设置
│   ├── components/       # 公共组件
│   ├── services/         # API服务
│   ├── utils/            # 工具函数
│   ├── App.tsx          # 应用入口
│   ├── main.tsx         # 主文件
│   └── index.css        # 全局样式
├── index.html
├── vite.config.ts       # Vite配置
├── tsconfig.json        # TypeScript配置
└── package.json
```

## 🎨 功能模块

### 1. 数据概览 (Dashboard)
- 关键数据统计（用户数、订单数、收入、增长率）
- 热门功能排行
- 最近活动记录

### 2. 用户管理 (User Management)
- 用户列表展示
- 搜索和筛选
- 用户状态管理（启用/禁用）
- 用户详情查看

### 3. 订单管理 (Order Management)
- 订单列表
- 按状态筛选（处理中/已完成/已取消）
- 订单搜索
- 订单详情查看
- 订单状态更新

### 4. 算命管理 (Fortune Management)
- 功能列表管理
- 价格设置
- 使用统计
- 功能启用/禁用

### 5. 统计分析 (Statistics)
- 收入趋势图
- 用户增长图
- 功能使用占比
- 订单状态分布
- （预留图表集成位置）

### 6. 系统设置 (Settings)
- 基本设置（网站名称、联系方式）
- 功能开关（注册、支付）
- 货币和语言设置

## 🔐 认证机制

当前使用简单的 localStorage 认证：
- 登录后将 token 存储在 localStorage
- 未登录自动跳转到登录页
- 退出登录清除 token

**注意**：生产环境需要实现完整的认证系统（JWT、Session等）

## 🛠️ 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由
3. 在 `src/layouts/MainLayout.tsx` 添加菜单项

### 调用后端API

在 `src/services/` 创建API服务：

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 添加请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getUserList = () => api.get('/users')
export const getOrderList = () => api.get('/orders')
```

## 📊 与用户前台的区别

| 特性 | 用户前台 (9999端口) | 管理后台 (8888端口) |
|------|---------------------|---------------------|
| 用途 | 面向用户的算命服务 | 管理员后台管理 |
| UI风格 | 彩色、动画、趣味性 | 简洁、专业、表格为主 |
| 认证 | 可选登录 | 必须登录 |
| 功能 | 算命服务 | 数据管理、统计分析 |
| 组件库 | 自定义组件 | Ant Design |

## 🚀 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

构建后的文件在 `dist/` 目录。

## 🔗 相关链接

- 用户前台：http://localhost:9999
- 管理后台：http://localhost:8888
- 后端API：http://localhost:3000

## 📝 待完善功能

- [ ] 完整的用户认证系统（JWT）
- [ ] 真实的后端API集成
- [ ] 图表集成（ECharts/Recharts）
- [ ] 权限管理（RBAC）
- [ ] 数据导出功能
- [ ] 操作日志
- [ ] 实时通知
- [ ] 数据可视化增强

## 💡 扩展建议

1. **集成图表库**
   ```bash
   npm install echarts echarts-for-react
   # 或
   npm install recharts
   ```

2. **添加权限管理**
   - 角色管理
   - 权限分配
   - 路由守卫

3. **优化数据管理**
   - Redux/Zustand 状态管理
   - React Query 数据缓存
   - 虚拟滚动（大数据列表）

4. **增强用户体验**
   - 骨架屏
   - 表格导出Excel
   - 批量操作
   - 拖拽排序

---

**创建时间**：2025-11-12
**端口**：8888
**默认账号**：admin / admin123
