<template>
  <div class="upload-view">
    <div class="upload-section">
      <h2 class="section-title">📄 文档上传</h2>
      <p class="section-desc">上传您的文档到知识库，支持 PDF、Word、TXT 等格式</p>

      <FileUpload
        ref="uploadRef"
        @success="handleUploadSuccess"
        @error="handleUploadError"
      />

      <div class="upload-actions">
        <el-button
          type="primary"
          size="large"
          :loading="isRedirecting"
          :disabled="!documentStore.hasDocument"
          @click="goToChat"
        >
          <el-icon v-if="!isRedirecting"><ChatDotRound /></el-icon>
          开始对话
        </el-button>
      </div>
    </div>

    <div class="preview-section">
      <h2 class="section-title">📋 文档预览</h2>
      <TextPreview :text="documentStore.documentText" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ChatDotRound } from '@element-plus/icons-vue';
import FileUpload from '@/components/FileUpload.vue';
import TextPreview from '@/components/TextPreview.vue';
import { useDocumentStore } from '@/store/modules/document';
import type { UploadErrorType } from '@/api/file';

const router = useRouter();
const documentStore = useDocumentStore();
const uploadRef = ref<InstanceType<typeof FileUpload> | null>(null);
const isRedirecting = ref(false);

/**
 * 上传成功处理
 */
function handleUploadSuccess(data: { filename: string; content: string }) {
  documentStore.setDocumentText(data.content, data.filename);
  ElMessage.success(`${data.filename} 上传成功`);
}

/**
 * 上传失败处理
 */
function handleUploadError(error: { type: UploadErrorType; message: string }) {
  ElMessage.error(error.message);
}

/**
 * 跳转到对话页面
 */
function goToChat() {
  if (!documentStore.hasDocument) {
    ElMessage.warning('请先上传文档');
    return;
  }

  isRedirecting.value = true;
  router.push('/chat');
}
</script>

<style scoped>
.upload-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
}

@media (max-width: 1024px) {
  .upload-view {
    grid-template-columns: 1fr;
  }
}

.upload-section,
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.section-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.upload-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.upload-actions .el-button {
  min-width: 200px;
  padding: 12px 32px;
}
</style>
