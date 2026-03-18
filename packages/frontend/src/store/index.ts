import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义全局状态Store（Composition API风格）
export const useAppStore = defineStore('app', () => {
  // 对话相关状态
  const chatMessages = ref<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>>([])
  
  // 文档上传相关状态
  const uploadFiles = ref<Array<{
    id: string
    name: string
    size: number
    status: 'pending' | 'uploading' | 'success' | 'error'
  }>>([])

  // 添加对话消息
  const addChatMessage = (role: 'user' | 'assistant', content: string) => {
    chatMessages.value.push({
      role,
      content,
      timestamp: Date.now()
    })
  }

  // 清空对话消息
  const clearChatMessages = () => {
    chatMessages.value = []
  }

  // 添加待上传文件
  const addUploadFile = (file: File) => {
    uploadFiles.value.push({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      status: 'pending'
    })
  }

  // 更新文件上传状态
  const updateFileUploadStatus = (id: string, status: 'uploading' | 'success' | 'error') => {
    const file = uploadFiles.value.find(item => item.id === id)
    if (file) {
      file.status = status
    }
  }

  // 返回状态和方法（响应式）
  return {
    chatMessages,
    uploadFiles,
    addChatMessage,
    clearChatMessages,
    addUploadFile,
    updateFileUploadStatus
  }
})
