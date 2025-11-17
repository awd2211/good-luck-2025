# 使用说明

## 快速启动

### 方法一: 使用一键启动脚本 (推荐)

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

### 方法二: 分别启动前后端

**终端1 - 启动后端:**
```bash
cd backend
npm run dev
```

**终端2 - 启动前端:**
```bash
cd frontend
npm run dev
```

## 访问地址

- 前端页面: http://localhost:5173
- 后端API: http://localhost:3000
- 健康检查: http://localhost:3000/health

## 主要功能使用

### 1. 生肖运势

在首页点击"生肖运势"图标,输入出生年月日,即可查看:
- 生肖属相
- 天干地支
- 五行属性
- 运势分析(事业、财富、健康)
- 幸运色、幸运数字

### 2. 八字精批

点击"八字精批"图标,输入完整的生辰信息(年月日时)和性别,可获得:
- 完整八字(年柱、月柱、日柱、时柱)
- 五行分布比例
- 性格特点分析
- 事业建议
- 财运预测
- 健康建议

### 3. 流年运势

查看指定年份的整体运势,包括:
- 年度生肖和干支
- 年龄信息
- 各方面运势(事业、财运、爱情、健康)
- 12个月详细运势评分
- 每月建议

### 4. 姓名详批

输入姓名和生日信息,可获得:
- 姓名总评分
- 五格分析(天格、地格、人格、外格、总格)
- 姓名五行属性
- 性格分析
- 事业建议
- 改名建议(如需要)

### 5. 婚姻分析

输入双方姓名和生日,可获得:
- 双方生肖和五行
- 总体相配度评分
- 爱情指数
- 性格匹配度
- 优势与弱点分析
- 婚姻建议

## 性能特点

### 缓存机制
- 相同参数的请求会被缓存5分钟
- 大幅提升响应速度
- 减轻服务器压力

### 响应式设计
- 自动适配PC、平板、手机
- 触摸优化
- 大屏幕优化显示

## 开发模式

### 热重载
前后端都支持热重载,修改代码后自动刷新:
- 前端: 修改保存后浏览器自动刷新
- 后端: 修改保存后服务自动重启

### 调试
- 前端: 使用浏览器开发者工具
- 后端: 查看终端输出日志

## 生产部署

### 1. 构建项目
```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

### 2. 部署前端
将 `frontend/dist` 目录部署到静态服务器或CDN

### 3. 部署后端
```bash
cd backend
npm start
```

### 4. 使用 Nginx 反向代理 (可选)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 环境变量配置

### 前端环境变量 (frontend/.env)
```env
# API地址
VITE_API_URL=http://localhost:3000/api

# 生产环境
# VITE_API_URL=https://api.yourdomain.com/api
```

### 后端环境变量 (backend/.env)
```env
# 服务端口
PORT=3000

# 运行环境
NODE_ENV=development

# CORS 允许的源
CORS_ORIGIN=*

# 生产环境
# NODE_ENV=production
# CORS_ORIGIN=https://yourdomain.com
```

## 常见问题

### Q: 端口被占用怎么办?
A: 修改 `backend/.env` 中的 PORT,同时修改 `frontend/.env` 中的 API 地址

### Q: 前端无法连接后端?
A: 检查:
1. 后端服务是否启动
2. 端口号是否正确
3. CORS 配置是否允许前端域名

### Q: 构建失败?
A: 检查:
1. Node.js 版本是否 >= 16
2. 依赖是否完整安装
3. TypeScript 编译错误

### Q: 性能不佳?
A: 可以:
1. 使用生产构建版本
2. 启用 Gzip 压缩
3. 部署到 CDN
4. 使用 Redis 替代内存缓存

## 技术支持

如有问题,请提交 Issue 或查看项目文档。

## 免责声明

本项目提供的算命功能仅供娱乐参考,不应作为人生决策的依据。平台拒绝向未成年人提供服务。
