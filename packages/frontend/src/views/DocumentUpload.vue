<template>
  <div class="upload-container">
    <div class="upload-card">
      <h2>📄 文档上传</h2>
      <p class="description">上传您的文档到知识库，支持 PDF、Word、TXT 等格式</p>

      <el-upload
        v-model:file-list="fileList"
        class="upload-area"
        drag
        :action="uploadUrl"
        :auto-upload="false"
        :on-change="handleChange"
        :on-remove="handleRemove"
        :on-exceed="handleExceed"
        :limit="10"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md"
      >
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="upload-tip">
            支持 PDF、Word、TXT、Markdown 格式，单个文件不超过 50MB
          </div>
        </template>
      </el-upload>

      <div class="upload-actions">
        <el-button type="primary" :loading="uploading" @click="handleUpload">
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
        <el-button @click="handleClear">清空</el-button>
      </div>
    </div>

    <div class="history-card" v-if="uploadHistory.length > 0">
      <h3>上传历史</h3>
      <el-table :data="uploadHistory" style="width: 100%">
        <el-table-column prop="filename" label="文件名" />
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import type { UploadFile, UploadRawFile } from 'element-plus';
import { request } from '@/utils/request';

interface UploadHistory {
  filename: string;
  size: string;
  status: 'success' | 'error';
  time: string;
}

const uploadUrl = '/api/document/upload';
const fileList = ref<UploadFile[]>([]);
const uploading = ref(false);
const uploadHistory = ref<UploadHistory[]>([]);

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const handleChange = (file: UploadFile, _files: UploadFile[]) => {
  fileList.value = _files;
};

const handleRemove = (_file: UploadFile, _files: UploadFile[]) => {
  fileList.value = _files;
};

const handleExceed = () => {
  ElMessage.warning('最多只能上传 10 个文件');
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }

  uploading.value = true;

  for (const fileItem of fileList.value) {
    const rawFile = fileItem.raw as UploadRawFile;
    if (!rawFile) continue;

    const formData = new FormData();
    formData.append('file', rawFile);

    try {
      await request.upload('/document/upload', formData);
      uploadHistory.value.unshift({
        filename: rawFile.name,
        size: formatFileSize(rawFile.size),
        status: 'success',
        time: new Date().toLocaleString('zh-CN')
      });
      ElMessage.success(`${rawFile.name} 上传成功`);
    } catch {
      uploadHistory.value.unshift({
        filename: rawFile.name,
        size: formatFileSize(rawFile.size),
        status: 'error',
        time: new Date().toLocaleString('zh-CN')
      });
      ElMessage.error(`${rawFile.name} 上传失败`);
    }
  }

  uploading.value = false;
  fileList.value = [];
};

const handleClear = () => {
  fileList.value = [];
  ElMessage.info('已清空文件列表');
};
</script>

<style scoped>
.upload-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.upload-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.upload-card h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #303133;
}

.description {
  color: #909399;
  margin-bottom: 24px;
}

.upload-area {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-text {
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.upload-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

.history-card {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.history-card h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #303133;
}
</style>
