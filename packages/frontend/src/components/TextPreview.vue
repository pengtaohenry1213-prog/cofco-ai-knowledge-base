<template>
  <div class="text-preview">
    <!-- 空状态 -->
    <div v-if="!text" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p class="empty-text">请先上传并解析文档</p>
    </div>

    <!-- 文本内容 -->
    <template v-else>
      <div class="preview-header">
        <span class="text-length">当前文本长度：{{ textLength }}字</span>
        <el-button type="primary" :icon="DocumentCopy" @click="handleCopy">
          复制全文
        </el-button>
      </div>

      <div class="preview-content">
        <pre class="text-content">{{ text }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, DocumentCopy } from '@element-plus/icons-vue';

interface Props {
  /** 解析后的文档文本 */
  text: string;
}

const props = defineProps<Props>();

/** 文本字数统计 */
const textLength = computed(() => {
  return props.text ? props.text.length : 0;
});

/**
 * 复制全文到剪贴板
 */
async function handleCopy() {
  if (!props.text) return;

  try {
    await navigator.clipboard.writeText(props.text);
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败，请检查浏览器权限设置');
  }
}
</script>

<style scoped>
.text-preview {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

/* 头部 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.text-length {
  color: #606266;
  font-size: 14px;
}

/* 内容区 */
.preview-content {
  max-height: 400px;
  overflow-y: auto;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.text-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

/* 滚动条样式 */
.preview-content::-webkit-scrollbar {
  width: 6px;
}

.preview-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.preview-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}
</style>
