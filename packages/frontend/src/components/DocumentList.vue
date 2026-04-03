<template>
  <div class="document-list">
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-empty v-else-if="documents.length === 0" description="暂无文档" />

    <div v-else class="document-grid">
      <div v-for="doc in documents" :key="doc.id" class="document-item">
        <div class="doc-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="doc-info">
          <div class="doc-name" :title="doc.name">{{ doc.name }}</div>
          <div class="doc-meta">
            <span>{{ formatSize(doc.size) }}</span>
            <span class="separator">|</span>
            <span>{{ formatDate(doc.uploadedAt) }}</span>
          </div>
          <div class="doc-status">
            <el-tag :type="getStatusType(doc.embeddingStatus)" size="small" effect="light">
              {{ getStatusLabel(doc.embeddingStatus) }}
            </el-tag>
            <span v-if="doc.chunkCount" class="chunk-count">块数: {{ doc.chunkCount }}</span>
          </div>
        </div>
        <div class="doc-actions">
          <el-tooltip content="删除" placement="top">
            <el-button link type="danger" @click="handleDelete(doc)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading, Document, Delete } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import type { DocumentItem, EmbeddingStatus } from '@/types/document';

interface Props {
  documents: DocumentItem[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<{
  (e: 'delete', doc: DocumentItem): void;
}>();

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function getStatusLabel(status: EmbeddingStatus): string {
  const labels: Record<EmbeddingStatus, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return labels[status] || status;
}

function getStatusType(status: EmbeddingStatus): string {
  const types: Record<EmbeddingStatus, string> = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return types[status] || 'info';
}

async function handleDelete(doc: DocumentItem) {
  try {
    await ElMessageBox.confirm(`确定删除文档「${doc.name}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    emit('delete', doc);
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.document-list {
  width: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: #909399;
}

.document-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  transition: background 0.2s;
}

.document-item:hover {
  background: #f0f0f0;
}

.doc-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf5ff;
  border-radius: 8px;
}

.doc-icon .el-icon {
  font-size: 20px;
  color: #409eff;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.doc-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.separator {
  color: #dcdfe6;
}

.doc-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chunk-count {
  font-size: 12px;
  color: #909399;
}

.doc-actions {
  flex-shrink: 0;
}

.doc-actions .el-icon {
  font-size: 16px;
}
</style>
