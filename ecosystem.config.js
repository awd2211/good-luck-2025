module.exports = {
  apps: [
    // 后端 API 服务
    {
      name: 'backend-api',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 2, // 集群模式，使用2个实例
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 50301,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 50301,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },

    // 用户前端（使用静态文件服务）
    {
      name: 'frontend-user',
      cwd: './frontend',
      script: 'npx',
      args: 'serve dist -l 0.0.0.0:50302 -s',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },

    // 管理后台前端（使用静态文件服务）
    {
      name: 'frontend-admin',
      cwd: './admin-frontend',
      script: 'npx',
      args: 'serve dist -l 50303 -s',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },
  ],
};
