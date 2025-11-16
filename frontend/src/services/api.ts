import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import storage from '../utils/storage';
import { devLog } from '../utils/devLog';
import { logError } from '../utils/logger';
import { showToast } from '../components/ToastContainer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 配置重试机制
axiosRetry(api, {
  retries: 3, // 最多重试3次
  retryDelay: (retryCount) => {
    // 指数退避：第1次1秒，第2次2秒，第3次4秒
    return retryCount * 1000;
  },
  retryCondition: (error: AxiosError) => {
    // 只在网络错误或5xx错误时重试
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ? error.response.status >= 500 : false);
  },
  onRetry: (retryCount, error) => {
    devLog(`⚠️  请求失败，正在重试 (${retryCount}/3)...`, error.message);
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从storage获取token（如果有认证功能）
    const token = storage.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logError('请求拦截器错误', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 成功响应直接返回
    return response;
  },
  (error: AxiosError) => {
    // 统一错误处理
    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          logError('请求参数错误', error, { message: data.message || data.errors });
          break;
        case 401:
          logError('未授权，请重新登录', error);
          // 清除token并跳转登录页
          storage.remove('token');
          // window.location.href = '/login';
          break;
        case 403:
          logError('权限不足', error);
          break;
        case 404:
          logError('请求的资源不存在', error);
          break;
        case 429:
          logError('请求过于频繁', error);
          showToast({ title: '错误', content: '请求过于频繁，请稍后再试', type: 'warning' });
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          logError('服务器错误', error, { status });
          break;
        default:
          logError('未知错误', error, { status, data });
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      logError('网络错误，请检查网络连接', error);
    } else {
      // 其他错误
      logError('请求配置错误', error);
    }

    return Promise.reject(error);
  }
);

export default api;
