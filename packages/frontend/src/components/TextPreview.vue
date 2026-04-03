<template>
  <div class="text-preview">
    <!-- 空状态 -->
    <div v-if="!text && !html" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p class="empty-text">请先上传并解析文档</p>
    </div>

    <!-- 内容预览 -->
    <template v-else>
      <div class="preview-header">
        <span class="text-length">当前文本长度：{{ textLength }}字</span>
        <el-button type="primary" :icon="DocumentCopy" @click="handleCopy">
          复制全文
        </el-button>
      </div>

      <div class="preview-content">
        <!-- PDF 预览（使用 pdfjs-dist 前端渲染） -->
        <PdfPreview
          v-if="pdfUrl"
          :url="pdfUrl"
          :enable-text-layer="true"
          :initial-scale="1.2"
        />
        <!-- HTML 预览（DOCX 格式优先显示结构化内容） -->
        <div v-else-if="html" class="html-content" v-html="sanitizedHtml"></div>
        <!-- 纯文本预览 -->
        <pre v-else class="text-content">{{ text }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, DocumentCopy } from '@element-plus/icons-vue';
import PdfPreview from './PdfPreview.vue';

interface Props {
  /** 解析后的文档文本（用于向量检索） */
  text?: string;
  /** HTML 格式内容（用于预览，DOCX 专有） */
  html?: string;
  /** PDF 文件 URL（前端渲染用） */
  pdfUrl?: string;
}

const props = defineProps<Props>();

/** 文本字数统计 */
const textLength = computed(() => {
  return props.text ? props.text.length : 0;
});

/** 安全过滤后的 HTML（防止 XSS） */
const sanitizedHtml = computed(() => {
  if (!props.html) return '';
  // 基础过滤，移除危险标签和属性
  return props.html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
});

/**
 * 复制全文到剪贴板
 */
async function handleCopy() {
  const content = props.text || props.html?.replace(/<[^>]+>/g, '') || '';
  if (!content) return;

  try {
    await navigator.clipboard.writeText(content);
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

/* 内容区（PDF 多页截图较高，略增大可视区域） */
.preview-content {
  max-height: min(65vh, 720px);
  overflow-y: auto;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

/* 纯文本内容 */
.text-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

/* HTML 内容（保留 DOCX 格式） */
.html-content {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

.html-content :deep(h1),
.html-content :deep(h2),
.html-content :deep(h3),
.html-content :deep(h4),
.html-content :deep(h5),
.html-content :deep(h6) {
  margin: 1em 0 0.5em;
  font-weight: 600;
  color: #303133;
}

.html-content :deep(h1) { font-size: 1.5em; }
.html-content :deep(h2) { font-size: 1.3em; }
.html-content :deep(h3) { font-size: 1.1em; }

.html-content :deep(p) {
  margin: 0.5em 0;
}

.html-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 13px;
}

.html-content :deep(table),
.html-content :deep(th),
.html-content :deep(td) {
  border: 1px solid #dcdfe6;
}

.html-content :deep(th),
.html-content :deep(td) {
  padding: 8px 12px;
  text-align: left;
}

.html-content :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.html-content :deep(ul),
.html-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.html-content :deep(li) {
  margin: 0.25em 0;
}

.html-content :deep(strong) {
  font-weight: 600;
}

.html-content :deep(em) {
  font-style: italic;
}

/* PDF 按页渲染预览（后端 getScreenshot） */
.html-content :deep(.pdf-preview-hint) {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.html-content :deep(.pdf-page-preview) {
  margin: 0 0 20px;
  text-align: center;
}

.html-content :deep(.pdf-page-img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: #fff;
}

.html-content :deep(.pdf-page-cap) {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
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
