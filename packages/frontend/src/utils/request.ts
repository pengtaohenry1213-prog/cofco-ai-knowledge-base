import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// 创建Axios实例
const service = axios.create({
  baseURL: '/api', // 接口基础路径
  timeout: 30000, // 请求超时时间 30秒
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 可添加token等请求头
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    // 请求错误处理
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一处理响应数据
    const { data } = response
    // 假设后端返回格式：{ code: number, msg: string, data: any }
    if (data.code !== 200 && data.code !== undefined) {
      // 业务错误提示
      console.error(data.msg || '请求失败')
      return Promise.reject(new Error(data.msg || 'Request failed'))
    }
    return data
  },
  (error: AxiosError) => {
    // 响应错误处理
    console.error('Response Error:', error)
    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service(config) as Promise<T>
}

// 导出常用请求方法
export const get = <T = any>(url: string, params?: any): Promise<T> => {
  return request({ method: 'get', url, params })
}

export const post = <T = any>(url: string, data?: any): Promise<T> => {
  return request({ method: 'post', url, data })
}

export const put = <T = any>(url: string, data?: any): Promise<T> => {
  return request({ method: 'put', url, data })
}

export const del = <T = any>(url: string, params?: any): Promise<T> => {
  return request({ method: 'delete', url, params })
}

export default service
