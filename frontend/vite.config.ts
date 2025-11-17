import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'LUCK.DAY - 运势测算平台',
        short_name: 'LUCK.DAY',
        description: '专业的运势、八字、命理测算平台',
        theme_color: '#ff6b6b',
        background_color: '#ffecd2',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 缓存策略
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
              }
            }
          },
          // 运势服务列表 - CacheFirst策略
          {
            urlPattern: /\/api\/fortunes(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fortune-list-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24小时
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 分类数据 - CacheFirst策略
          {
            urlPattern: /\/api\/categories/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'categories-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7天
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 横幅和通知 - NetworkFirst策略
          {
            urlPattern: /\/api\/public\/(banners|notifications)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'public-content-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 30 // 30分钟
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 3
            }
          },
          // 用户数据 - NetworkFirst策略
          {
            urlPattern: /\/api\/(auth|orders|favorites|cart|history)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-data-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5分钟
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          // 其他API - NetworkFirst策略(默认)
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5分钟
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React核心库
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }
          // Axios网络库
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor'
          }
          // 其他第三方库
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          // 按功能模块分割
          if (id.includes('/src/pages/')) {
            // 运势测算相关页面
            if (id.includes('Fortune') || id.includes('fortune')) {
              return 'pages-fortune'
            }
            // 订单相关页面
            if (id.includes('Order') || id.includes('Cart') || id.includes('Checkout')) {
              return 'pages-order'
            }
            // 用户相关页面
            if (id.includes('Profile') || id.includes('Login') || id.includes('Register')) {
              return 'pages-user'
            }
            // 其他页面
            return 'pages-other'
          }
          // 组件分割
          if (id.includes('/src/components/')) {
            return 'components'
          }
          // Services分割
          if (id.includes('/src/services/')) {
            return 'services'
          }
        }
      }
    },
    // 生产环境移除 console
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 优化 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: '0.0.0.0',
    port: 50302,  // 开发环境端口
    allowedHosts: ['www.luck.day', 'luck.day', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:50301',  // 开发环境后端
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 60302,  // 生产环境预览端口
  }
})
