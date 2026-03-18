import { post } from '@/utils/request'

// 文档上传响应类型
export interface UploadResponse {
  code: number
  msg: string
  data: {
    fileId: string
    filename: string
    status: string
  }
}

// 文档上传
export const uploadDoc = (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  return post('/api/upload', formData) as Promise<UploadResponse>
}

// 获取文档列表
export const getDocList = () => {
  return get('/api/docs')
}

// 删除文档
export const deleteDoc = (fileId: string) => {
  return del(`/api/docs/${fileId}`)
}
