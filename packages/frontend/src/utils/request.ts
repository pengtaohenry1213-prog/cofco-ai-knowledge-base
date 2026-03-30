import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

export interface ResponseData<T = unknown> {
  code: number;
  data: T;
  message: string;
}

// ==================== Stream Request Types ====================

export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}

export interface StreamCallbacks {
  onChunk: (text: string, done: boolean) => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

export interface StreamRequestConfig {
  url: string;
  params: Record<string, unknown>;
  callbacks: StreamCallbacks;
  signal?: AbortSignal;
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

export function streamPost(
  params: Record<string, unknown>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): void {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  const url = `${baseURL}/chat/stream`;
  
  fetchStream({
    url,
    params,
    callbacks,
    signal
  });
}

export async function fetchStream(config: StreamRequestConfig): Promise<void> {
  const { url, params, callbacks, signal } = config;
  const { onChunk, onFinish, onError } = callbacks;
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: JSON.stringify(params),
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer.trim()) {
          try {
            const data: StreamResponse = JSON.parse(buffer);
            onChunk(data.content || '', true);
          } catch {
            // ignore parse error for last chunk
          }
        }
        onFinish();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data: StreamResponse = JSON.parse(jsonStr);
            if (data.content !== undefined) {
              onChunk(data.content, !!data.done);
            }
            if (data.done) {
              onFinish();
              reader.cancel();
              return;
            }
          } catch {
            // skip invalid JSON lines
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      onFinish();
    } else {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
