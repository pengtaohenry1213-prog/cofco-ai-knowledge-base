import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

export interface ResponseData<T = unknown> {
  code: number;
  data: T;
  message: string;
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse<ResponseData>) => {
    const res = response.data;
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error('拒绝访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error(data?.message || '服务器错误');
          break;
        default:
          ElMessage.error(data?.message || '网络错误');
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络');
    }
    return Promise.reject(error);
  }
);

export default service;

export const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ResponseData<T>>> {
    return service.get(url, config);
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<ResponseData<T>>> {
    return service.post(url, data, config);
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<ResponseData<T>>> {
    return service.put(url, data, config);
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ResponseData<T>>> {
    return service.delete(url, config);
  },
  upload<T = unknown>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<ResponseData<T>>> {
    return service.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
