module.exports = {
  apps: [
    // 后端开发服务
    {
      name: 'backend-dev',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 50301,
      },
      error_file: './logs/backend-dev-error.log',
      out_file: './logs/backend-dev-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false, // 使用 ts-node-dev 的内置 watch
      max_memory_restart: '500M',
    },

    // 用户前端开发服务
    {
      name: 'frontend-dev',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/frontend-dev-error.log',
      out_file: './logs/frontend-dev-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false, // Vite 自带 HMR
      max_memory_restart: '500M',
    },

    // 管理后台开发服务
    {
      name: 'admin-dev',
      cwd: './admin-frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/admin-dev-error.log',
      out_file: './logs/admin-dev-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false, // Vite 自带 HMR
      max_memory_restart: '500M',
    },
  ],
};
