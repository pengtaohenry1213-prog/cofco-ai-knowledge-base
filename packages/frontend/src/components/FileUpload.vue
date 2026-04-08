<template>
  <div class="file-upload">
    <div
      class="upload-zone"
      :class="{ 'is-dragover': isDragover, 'is-uploading': state.status === 'uploading' }"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        class="file-input"
        accept=".pdf,.docx,.txt"
        @change="handleFileChange"
      />

      <div v-if="state.status === 'idle'" class="upload-placeholder">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <p class="upload-text">
          <em>点击上传</em> 或拖拽文件到这里
        </p>
        <p class="upload-hint">支持 PDF、DOCX、TXT 格式，文件大小不超过 10MB</p>
      </div>

      <div v-else-if="state.status === 'uploading'" class="upload-progress">
        <el-icon class="uploading-icon"><Loading /></el-icon>
        <p class="filename">{{ currentFile?.name }}</p>
        <el-progress :percentage="state.progress" :stroke-width="6" />
      </div>

      <div v-else-if="state.status === 'success'" class="upload-result">
        <el-icon class="result-icon success"><CircleCheck /></el-icon>
        <p class="filename">{{ currentFile?.name }}</p>
        <p class="result-text">上传成功</p>
        <el-button text type="primary" @click.stop="resetUpload">继续上传</el-button>
      </div>

      <div v-else-if="state.status === 'error'" class="upload-result">
        <el-icon class="result-icon error"><CircleClose /></el-icon>
        <p class="filename">{{ currentFile?.name }}</p>
        <p class="result-text error">{{ state.error }}</p>
        <el-button text type="primary" @click.stop="resetUpload">重试</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElIcon } from 'element-plus';
import { Upload, Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue';
import type { UploadErrorType } from '@/api/file';
import { uploadFile } from '@/api/file';
import { useDocumentStore } from '@/store/modules/document';

const props = withDefaults(
  defineProps<{
    /** 非空时走 /documents/upload，写入文档列表并关联知识库、建向量 */
    knowledgeBaseIds?: string[];
  }>(),
  { knowledgeBaseIds: () => [] }
);

const documentStore = useDocumentStore();

/** 允许的文件类型 */
const ALLOWED_TYPES = ['.pdf', '.docx', '.txt'];
/** 最大文件大小 (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 上传状态 */
interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

/** 当前上传的文件 */
const currentFile = ref<File | null>(null);

/** 文件输入框引用 */
const fileInputRef = ref<HTMLInputElement | null>(null);

/** 拖拽状态 */
const isDragover = ref(false);

/** 上传状态 */
const state = reactive<UploadState>({
  status: 'idle',
  progress: 0,
  error: undefined
});

/** emits */
const emit = defineEmits<{
  success: (data: { filename: string; content: string; html?: string; pdfPath?: string; isPdf?: boolean }) => void;
  error: (error: { type: UploadErrorType; message: string }) => void;
}>();

/**
 * 触发文件选择
 */
function triggerFileInput() {
  if (state.status === 'uploading') return;
  fileInputRef.value?.click();
}

/**
 * 处理拖拽悬停
 */
function handleDragOver() {
  if (state.status === 'uploading') return;
  isDragover.value = true;
}

/**
 * 处理拖拽离开
 */
function handleDragLeave() {
  isDragover.value = false;
}

/**
 * 处理文件放下
 * @param event 拖拽事件
 */
function handleDrop(event: DragEvent) {
  isDragover.value = false;
  if (state.status === 'uploading') return;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    // 多文件拖拽仅取第一个
    handleFile(files[0]);
  }
}

/**
 * 处理文件选择
 * @param event 文件输入事件
 */
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    handleFile(input.files[0]);
    // 重置 input 以允许重复选择同一文件
    input.value = '';
  }
}

/**
 * 处理文件
 * @param file 文件对象
 */
async function handleFile(file: File) {
  // 文件类型校验
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_TYPES.includes(ext)) {
    state.status = 'error';
    state.error = `不支持的文件类型，仅支持 ${ALLOWED_TYPES.join('、')} 格式`;
    emit('error', { type: 'type', message: state.error });
    return;
  }

  // 文件大小校验
  if (file.size > MAX_FILE_SIZE) {
    state.status = 'error';
    state.error = `文件大小超过限制，最大支持 ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    emit('error', { type: 'size', message: state.error });
    return;
  }

  // 开始上传
  currentFile.value = file;
  state.status = 'uploading';
  state.progress = 0;
  state.error = undefined;

  try {
    if (props.knowledgeBaseIds.length > 0) {
      state.progress = 30;
      const item = await documentStore.uploadDocument(file, props.knowledgeBaseIds);
      if (!item) {
        throw { type: 'server' as UploadErrorType, message: '上传失败，请重试' };
      }
      state.status = 'success';
      state.progress = 100;
      emit('success', {
        filename: item.name,
        content: '',
        html: undefined,
        pdfPath: undefined,
        isPdf: item.mimeType === 'application/pdf'
      });
    } else {
      const result = await uploadFile(file, {
        onProgress: (percent) => {
          state.progress = percent;
        }
      });

      state.status = 'success';
      state.progress = 100;

      console.log('\n========== [前端测试] 文件上传成功 ==========');
      console.log(`文件名: ${result.filename}`);
      console.log(`是否为 PDF: ${result.isPdf}`);
      console.log(`PDF 路径: ${result.pdfPath || 'N/A'}`);
      console.log('\n----- 解析文本内容 -----');
      console.log(result.content);
      console.log('\n----- 解析文本长度 -----');
      console.log(`总字符数: ${result.content.length}`);
      if (result.html) {
        console.log('\n----- HTML 预览内容 (前500字符) -----');
        console.log(result.html.substring(0, 500) + (result.html.length > 500 ? '...' : ''));
      }
      console.log('========== [前端测试] 结束 ==========\n');

      emit('success', result);
    }
  } catch (error: unknown) {
    state.status = 'error';
    const err = error as { type: UploadErrorType; message: string };
    state.error = err.message || '上传失败，请重试';
    emit('error', err);
  }
}

/**
 * 重置上传状态
 */
function resetUpload() {
  state.status = 'idle';
  state.progress = 0;
  state.error = undefined;
  currentFile.value = null;
}

/**
 * 暴露方法给父组件
 */
defineExpose({
  resetUpload
});
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-zone:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.upload-zone.is-dragover {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: scale(1.02);
}

.upload-zone.is-uploading {
  cursor: default;
  border-color: #409eff;
}

.file-input {
  display: none;
}

.upload-placeholder {
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-text {
  color: #606266;
  font-size: 14px;
  margin: 8px 0;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.upload-progress {
  width: 100%;
  max-width: 300px;
  text-align: center;
}

.uploading-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.filename {
  color: #303133;
  font-size: 14px;
  margin-bottom: 12px;
  word-break: break-all;
}

.upload-result {
  text-align: center;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.result-icon.success {
  color: #67c23a;
}

.result-icon.error {
  color: #f56c6c;
}

.result-text {
  color: #67c23a;
  font-size: 14px;
  margin: 8px 0;
}

.result-text.error {
  color: #f56c6c;
}
</style>
