# 🎋 Good Luck 2025 - 运势测算平台

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Express](https://img.shields.io/badge/Express-5.1-000000.svg)

一个功能完整、性能优化的全栈运势测算平台，提供生肖运势、八字精批、流年运势、姓名测算、婚姻分析等多种功能。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [文档](#-文档) • [贡献](#-贡献) • [许可证](#-许可证)

</div>

---

## 📖 项目简介

Good Luck 2025 是一个基于现代 Web 技术栈构建的全栈运势测算平台，采用前后端分离架构，提供完整的用户端、管理后台和 API 服务。项目注重代码质量、性能优化和用户体验，适合作为学习全栈开发的参考项目。

### ✨ 核心亮点

- 🎯 **功能完整** - 用户端、管理后台、API 服务一应俱全
- ⚡ **性能优化** - 包体积减少 58%，首屏加载提升 80%
- 🔒 **安全可靠** - JWT 认证、RBAC 权限、SQL 注入防护
- 📱 **响应式设计** - 完美支持 PC、平板、手机
- 🛠️ **开发友好** - TypeScript、ESLint、单元测试
- 📚 **文档完善** - 详细的开发文档和 API 文档

## 🎯 功能特性

### 用户端功能
- 🎋 **生肖运势** - 根据出生年份测算生肖运势
- 📅 **八字精批** - 专业八字分析，了解命理特点
- 🎊 **流年运势** - 查看指定年份的运势走向
- ✍️ **姓名详批** - 姓名五行分析和评分
- 💑 **婚姻分析** - 双方八字合婚配对
- 🛒 **购物车系统** - 完整的购物流程
- 💳 **支付集成** - 支持 Stripe、PayPal、余额支付
- 📱 **PWA 支持** - 离线访问，可安装到桌面

### 管理后台功能
- 👥 **用户管理** - 用户信息、订单、统计
- 📊 **数据统计** - 实时数据分析和报表
- 🎨 **内容管理** - 轮播图、通知、文章管理
- 💰 **财务管理** - 订单、退款、优惠券管理
- 🔐 **权限管理** - RBAC 角色权限系统
- 💬 **客服系统** - WebChat 在线客服
- 📧 **邮件系统** - 邮件模板和发送历史

### 技术特性
- ⚡ **性能优化** - 代码分割、懒加载、缓存策略
- 🔒 **安全防护** - Helmet、CORS、限流、SQL 注入防护
- 📱 **响应式设计** - 完美适配各种设备
- 🌐 **国际化** - i18n 多语言支持
- 🧪 **单元测试** - 60+ 测试用例
- 📝 **API 文档** - Swagger 完整文档

## 🛠️ 技术栈

### 前端技术
- **框架**: React 18 + TypeScript
- **路由**: React Router DOM 7
- **构建工具**: Vite 7
- **UI 库**: Ant Design 5 (管理后台)
- **状态管理**: React Context API
- **HTTP 客户端**: Axios + Retry
- **国际化**: i18next
- **PWA**: Workbox

### 后端技术
- **运行时**: Node.js 16+
- **框架**: Express 5 + TypeScript
- **数据库**: PostgreSQL 16
- **ORM**: pg (原生 SQL)
- **认证**: JWT + bcrypt
- **缓存**: Redis (可选) + 内存缓存
- **支付**: Stripe + PayPal
- **邮件**: AWS SES + SendGrid + Mailgun
- **实时通信**: Socket.IO
- **API 文档**: Swagger

### 开发工具
- **代码规范**: ESLint + Prettier
- **测试框架**: Jest + Supertest
- **进程管理**: PM2
- **容器化**: Docker + Docker Compose
- **版本控制**: Git

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0
- PostgreSQL >= 14.0 (或使用 Docker)
- Redis (可选，用于生产环境)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/good-luck-2025.git
cd good-luck-2025
```

2. **安装依赖**
```bash
# 安装所有依赖（后端 + 前端 + 管理后台）
npm run install:all

# 或分别安装
npm run install:backend
npm run install:frontend
cd admin-frontend && npm install
```

3. **配置环境变量**

创建后端环境变量文件：
```bash
cd backend
cp .env.example .env.development
# 编辑 .env.development 文件，配置数据库等信息
```

创建前端环境变量文件：
```bash
cd frontend
cp .env.example .env
# 编辑 .env 文件，配置 API 地址
```

4. **启动数据库**

使用 Docker Compose（推荐）：
```bash
docker-compose up -d postgres
```

或手动启动 PostgreSQL，并执行初始化脚本：
```bash
psql -U postgres -f db/init.sql
```

5. **启动项目**

**开发环境（推荐）：**
```bash
# 使用启动脚本
chmod +x start.sh
./start.sh

# 或手动启动
npm run start:backend  # 后端: http://localhost:3000
npm run start:frontend # 前端: http://localhost:5173
```

**生产环境：**
```bash
# 构建项目
npm run build

# 使用 PM2 启动
./pm2.sh start
```

6. **访问应用**

- 用户前端: http://localhost:5173
- 管理后台: http://localhost:50303
- API 文档: http://localhost:3000/api-docs
- 健康检查: http://localhost:3000/health

### 默认账号

**管理后台：**
- 用户名: `admin`
- 密码: `admin123` (请在生产环境修改)

## 📁 项目结构

```
good-luck-2025/
├── frontend/              # 用户前端 (React + Vite)
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── services/     # API 服务
│   │   ├── contexts/     # Context 状态管理
│   │   └── utils/        # 工具函数
│   └── package.json
│
├── admin-frontend/        # 管理后台 (React + Ant Design)
│   ├── src/
│   │   ├── pages/        # 管理页面
│   │   ├── components/   # 管理组件
│   │   └── services/     # API 服务
│   └── package.json
│
├── backend/               # 后端服务 (Express + TypeScript)
│   ├── src/
│   │   ├── routes/       # 路由定义
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 业务逻辑
│   │   ├── middleware/   # 中间件
│   │   ├── config/       # 配置文件
│   │   └── types/        # 类型定义
│   ├── migrations/       # 数据库迁移
│   └── package.json
│
├── docs/                  # 项目文档
│   ├── core/             # 核心文档
│   ├── api/              # API 文档
│   ├── development/      # 开发文档
│   ├── deployment/       # 部署文档
│   └── archive/          # 归档文档
│
├── db/                    # 数据库脚本
│   ├── init.sql          # 初始化脚本
│   └── migrations/       # 迁移脚本
│
├── docker-compose.yml     # Docker 配置
├── ecosystem.config.js    # PM2 配置
└── README.md
```

## 📚 文档

完整的项目文档位于 [`docs/`](docs/) 目录：

- 📘 [核心文档](docs/core/) - 开发指南、数据库文档
- 📡 [API 文档](docs/api/) - API 使用文档和测试结果
- 🛠️ [开发文档](docs/development/) - 开发指南、优化文档
- 🚀 [部署文档](docs/deployment/) - 部署和运维指南

**快速链接：**
- [开发指南](docs/core/CLAUDE.md)
- [数据库文档](docs/core/DATABASE.md)
- [API 快速开始](docs/api/QUICKSTART_USER_API.md)
- [PM2 部署指南](docs/deployment/PM2_GUIDE.md)

## 🧪 测试

```bash
# 运行所有测试
cd backend
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage

# 运行 API 测试脚本
./test-all.sh
```

## 🚀 部署

### Docker 部署

```bash
# 启动所有服务（数据库 + 后端 + 前端）
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### PM2 部署（推荐）

```bash
# 构建项目
npm run build

# 启动服务
./pm2.sh start

# 查看状态
./pm2.sh status

# 查看日志
./pm2.sh logs
```

详细部署文档请查看 [部署文档](docs/deployment/PM2_GUIDE.md)

## 🤝 贡献

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 贡献方式

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ⭐ 给项目点个 Star

### 开发流程

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📊 性能指标

经过全面优化，项目性能指标如下：

- 📦 **包体积**: 减少 58%
- ⚡ **首屏加载**: 提升 80% (2.5s → 0.5s)
- 🚀 **API 响应**: 缓存命中率 94% (50ms → 3ms)
- 📊 **Lighthouse**: 评分 > 90

详细优化文档请查看 [性能优化文档](docs/development/OPTIMIZATION.md)

## 🔒 安全

项目实施了多层安全防护：

- ✅ JWT 认证和授权
- ✅ RBAC 角色权限控制
- ✅ SQL 注入防护（参数化查询）
- ✅ XSS 防护（Helmet）
- ✅ CSRF 防护
- ✅ 请求限流
- ✅ 密码加密（bcrypt）

## 🌐 浏览器支持

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ 移动端浏览器

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## ⚠️ 免责声明

1. 本项目中的运势测算功能仅供娱乐，不应作为决策依据
2. 本平台拒绝向未成年人提供服务
3. 使用本项目造成的任何后果，由使用者自行承担

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

## 📮 联系方式

- 📧 邮箱: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/good-luck-2025/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/good-luck-2025/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by [Your Name]

</div>
