module.exports = {
  apps: [
    {
      name: 'fortune-backend',
      script: 'dist/index.js',
      cwd: '/home/eric/good-luck-2025/backend',

      // Cluster模式：零停机重载
      instances: 'max', // 使用所有CPU核心，或设置为具体数字如2
      exec_mode: 'cluster',

      // 环境变量
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 60301
      },

      // 性能和稳定性
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,

      // 日志管理
      error_file: '/home/eric/.pm2/logs/backend-error.log',
      out_file: '/home/eric/.pm2/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      log_type: 'json', // 便于日志分析

      // 开发环境可以启用watch
      watch: false, // 生产环境不建议开启
      ignore_watch: ['node_modules', 'logs', '*.log'],

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    }
  ],

  deploy: {
    production: {
      user: 'eric',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:yourrepo.git',
      path: '/home/eric/good-luck-2025',
      'post-deploy': 'cd backend && npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
