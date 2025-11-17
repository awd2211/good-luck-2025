import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // 启用React Fast Refresh优化
      fastRefresh: true
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 50303,  // 开发环境端口
    allowedHosts: ['console.luck.day', 'localhost'],
  },
  preview: {
    host: '0.0.0.0',
    port: 60303,  // 生产环境预览端口
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'axios',
      'dayjs',
      'echarts',
      'echarts-for-react'
    ],
    // 排除不需要预构建的依赖
    exclude: []
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 使用esbuild替代terser,速度更快
    minify: 'esbuild',
    // 目标浏览器
    target: 'es2015',
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 减小chunk大小
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 优化的代码分割策略
        manualChunks: (id) => {
          // React相关
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          // Ant Design相关
          if (id.includes('node_modules/antd') ||
              id.includes('node_modules/@ant-design')) {
            return 'antd-vendor';
          }
          // ECharts相关
          if (id.includes('node_modules/echarts') ||
              id.includes('node_modules/echarts-for-react')) {
            return 'chart-vendor';
          }
          // 工具库
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/dayjs')) {
            return 'utils-vendor';
          }
          // 其他node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // 优化chunk文件名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    }
  },
  // 解析配置优化
  resolve: {
    // 配置别名减少路径解析时间
    alias: {
      '@': '/src'
    }
  },
  // esbuild配置优化
  esbuild: {
    // 生产环境移除console和debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 启用纯注释优化
    pure: ['console.log']
  }
})
