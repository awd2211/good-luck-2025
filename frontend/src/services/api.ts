import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

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
    console.log(`⚠️  请求失败，正在重试 (${retryCount}/3)...`, error.message);
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token（如果有认证功能）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error);
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
          console.error('❌ 请求参数错误:', data.message || data.errors);
          break;
        case 401:
          console.error('❌ 未授权，请重新登录');
          // 清除token并跳转登录页
          localStorage.removeItem('token');
          // window.location.href = '/login';
          break;
        case 403:
          console.error('❌ 权限不足');
          break;
        case 404:
          console.error('❌ 请求的资源不存在');
          break;
        case 429:
          console.error('❌ 请求过于频繁，请稍后再试');
          alert('请求过于频繁，请稍后再试');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          console.error('❌ 服务器错误，请稍后重试');
          break;
        default:
          console.error('❌ 未知错误:', status, data);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('❌ 网络错误，请检查网络连接');
    } else {
      // 其他错误
      console.error('❌ 请求配置错误:', error.message);
    }

    return Promise.reject(error);
  }
);

// 生肖运势
export const getBirthFortune = async (data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
}) => {
  const response = await api.post('/fortune/birth-animal', data);
  return response.data;
};

// 八字精批
export const getBaziAnalysis = async (data: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: string;
}) => {
  const response = await api.post('/fortune/bazi', data);
  return response.data;
};

// 流年运势
export const getFlowYearFortune = async (data: {
  birthYear: number;
  targetYear: number;
}) => {
  const response = await api.post('/fortune/flow-year', data);
  return response.data;
};

// 姓名详批
export const getNameAnalysis = async (data: {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}) => {
  const response = await api.post('/fortune/name', data);
  return response.data;
};

// 婚姻分析
export const getMarriageAnalysis = async (data: {
  person1: { name: string; birthYear: number; birthMonth: number; birthDay: number };
  person2: { name: string; birthYear: number; birthMonth: number; birthDay: number };
}) => {
  const response = await api.post('/fortune/marriage', data);
  return response.data;
};

export default api;
