<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/store'
import { uploadDoc } from '@/api/doc'

const store = useAppStore()
const isUploading = ref(false)

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    Array.from(input.files).forEach((file) => {
      store.addUploadFile(file)
    })
  }
}

// 上传文件
const handleUpload = async () => {
  const pendingFiles = store.uploadFiles.filter((f) => f.status === 'pending')
  if (pendingFiles.length === 0) {
    alert('请先选择文件')
    return
  }

  isUploading.value = true
  for (const file of pendingFiles) {
    try {
      store.updateFileUploadStatus(file.id, 'uploading')
      await uploadDoc(file as unknown as File)
      store.updateFileUploadStatus(file.id, 'success')
    } catch (error) {
      store.updateFileUploadStatus(file.id, 'error')
      console.error('上传失败:', error)
    }
  }
  isUploading.value = false
}

// 删除文件
const handleRemove = (id: string) => {
  const index = store.uploadFiles.findIndex((f) => f.id === id)
  if (index > -1) {
    store.uploadFiles.splice(index, 1)
  }
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div class="upload-container">
    <h2>文档上传</h2>

    <!-- 上传区域 -->
    <div class="upload-area">
      <input
        type="file"
        id="file-input"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        @change="handleFileChange"
        style="display: none"
      />
      <label for="file-input" class="upload-label">
        <div class="upload-icon">+</div>
        <p>点击选择文件或将文件拖拽到此处</p>
        <p class="upload-hint">支持 PDF、Word、TXT 格式</p>
      </label>
    </div>

    <!-- 文件列表 -->
    <div v-if="store.uploadFiles.length > 0" class="file-list">
      <h3>已选择文件</h3>
      <ul>
        <li v-for="file in store.uploadFiles" :key="file.id" class="file-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
          <div class="file-status">
            <span v-if="file.status === 'pending'" class="status-pending">待上传</span>
            <span v-else-if="file.status === 'uploading'" class="status-uploading">上传中...</span>
            <span v-else-if="file.status === 'success'" class="status-success">✓ 上传成功</span>
            <span v-else-if="file.status === 'error'" class="status-error">✗ 上传失败</span>
            <button
              v-if="file.status === 'pending'"
              class="remove-btn"
              @click="handleRemove(file.id)"
            >
              ×
            </button>
          </div>
        </li>
      </ul>

      <button class="upload-btn" @click="handleUpload" :disabled="isUploading">
        {{ isUploading ? '上传中...' : '开始上传' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.upload-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-label {
  cursor: pointer;
  display: block;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 10px;
}

.upload-hint {
  color: #999;
  font-size: 14px;
}

.file-list {
  margin-top: 30px;
}

.file-list h3 {
  margin-bottom: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-pending {
  color: #909399;
}

.status-uploading {
  color: #409eff;
}

.status-success {
  color: #67c23a;
}

.status-error {
  color: #f56c6c;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.remove-btn:hover {
  color: #f56c6c;
}

.upload-btn {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

.upload-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.upload-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}
</style>
