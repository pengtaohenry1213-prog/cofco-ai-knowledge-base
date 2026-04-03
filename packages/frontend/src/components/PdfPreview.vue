<template>
  <div class="pdf-preview">
    <!-- PDF 渲染区域 -->
    <div v-if="isLoading" class="pdf-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>正在加载 PDF...</span>
    </div>

    <div v-else-if="error" class="pdf-error">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <span>{{ error }}</span>
    </div>

    <div v-else class="pdf-container" ref="containerRef">
      <!-- 页面导航 -->
      <div class="pdf-toolbar">
        <el-button-group>
          <el-button :disabled="currentPage <= 1" @click="prevPage">
            <el-icon><ArrowLeft /></el-icon>
            上一页
          </el-button>
          <el-button :disabled="currentPage >= totalPages" @click="nextPage">
            下一页
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <el-slider
          v-model="currentPage"
          :min="1"
          :max="totalPages"
          :step="1"
          :show-tooltip="false"
          class="page-slider"
        />
      </div>

      <!-- Canvas 渲染区 -->
      <div class="pdf-canvas-wrapper" ref="canvasWrapperRef">
        <canvas ref="canvasRef" class="pdf-canvas"></canvas>
        <!-- 文本层（可选，用于选择复制文字） -->
        <div
          v-if="enableTextLayer"
          ref="textLayerRef"
          class="pdf-text-layer"
        ></div>
      </div>

      <!-- 缩放控制 -->
      <div class="pdf-zoom-controls">
        <el-button-group>
          <el-button @click="zoomOut" :disabled="scale <= 0.5">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button class="zoom-label">{{ Math.round(scale * 100) }}%</el-button>
          <el-button @click="zoomIn" :disabled="scale >= 3">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, WarningFilled, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from '@element-plus/icons-vue';
import * as pdfjsLib from 'pdfjs-dist';

// 设置 Worker（使用 CDN）
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface Props {
  /** PDF 文件 URL（相对路径或绝对路径） */
  url: string;
  /** 是否启用文本层（可选择复制文字） */
  enableTextLayer?: boolean;
  /** 初始缩放比例 */
  initialScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  enableTextLayer: true,
  initialScale: 1.2
});

// 状态
const isLoading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(props.initialScale);

// DOM refs
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const textLayerRef = ref<HTMLDivElement | null>(null);
const canvasWrapperRef = ref<HTMLDivElement | null>(null);

// PDF.js 实例
let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
let renderTask: pdfjsLib.RenderTask | null = null;

/**
 * 加载 PDF 文档
 */
async function loadPdf() {
  if (!props.url) {
    error.value = '未提供 PDF 文件地址';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // 处理 URL（如果是相对路径，需要添加 base URL）
    let pdfUrl = props.url;
    if (pdfUrl.startsWith('/')) {
      // 相对路径，添加 API base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      pdfUrl = baseUrl + pdfUrl;
    }

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true
    });

    pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;
    currentPage.value = 1;

    await renderPage(1);
  } catch (err) {
    console.error('[PdfPreview] PDF 加载失败:', err);
    error.value = 'PDF 加载失败，请检查文件是否有效';
  } finally {
    isLoading.value = false;
  }
}

/**
 * 渲染指定页面
 */
async function renderPage(pageNum: number) {
  if (!pdfDoc || !canvasRef.value) return;

  // 取消之前的渲染任务
  if (renderTask) {
    renderTask.cancel();
    renderTask = null;
  }

  try {
    const page = await pdfDoc.getPage(pageNum);
    const canvas = canvasRef.value;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('无法获取 Canvas 上下文');
    }

    // 计算缩放后的尺寸
    const viewport = page.getViewport({ scale: scale.value });
    const devicePixelRatio = window.devicePixelRatio || 1;

    // 设置 canvas 尺寸（考虑设备像素比以保证清晰度）
    canvas.width = Math.floor(viewport.width * devicePixelRatio);
    canvas.height = Math.floor(viewport.height * devicePixelRatio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    context.scale(devicePixelRatio, devicePixelRatio);

    // 渲染 PDF 页面（pdfjs-dist v5 API）
    renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
      // @ts-ignore - v5 compatibility
      canvas: canvas
    });

    await renderTask.promise;

    // 渲染文本层
    if (props.enableTextLayer && textLayerRef.value) {
      await renderTextLayer(page, viewport);
    }
  } catch (err: any) {
    if (err?.name === 'RenderingCancelledException') {
      return; // 被取消的渲染不显示错误
    }
    console.error('[PdfPreview] 页面渲染失败:', err);
  }
}

/**
 * 渲染文本层（用于选择和复制文字）
 */
async function renderTextLayer(page: pdfjsLib.PDFPageProxy, viewport: pdfjsLib.PageViewport) {
  if (!textLayerRef.value) return;

  // 清空之前的文本层
  textLayerRef.value.innerHTML = '';
  textLayerRef.value.style.width = `${viewport.width}px`;
  textLayerRef.value.style.height = `${viewport.height}px`;

  try {
    const textContent = await page.getTextContent();

    // 使用 pdfjs-dist v5 的 textLayer 功能
    // @ts-ignore - v5 compatibility
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayerRef.value,
      viewport: viewport
    });

    await textLayer.render();
  } catch (err) {
    console.warn('[PdfPreview] 文本层渲染失败:', err);
  }
}

/**
 * 上一页
 */
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

/**
 * 下一页
 */
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

/**
 * 放大
 */
function zoomIn() {
  if (scale.value < 3) {
    scale.value = Math.min(3, scale.value + 0.2);
  }
}

/**
 * 缩小
 */
function zoomOut() {
  if (scale.value > 0.5) {
    scale.value = Math.max(0.5, scale.value - 0.2);
  }
}

// 监听页面变化
watch(currentPage, (newPage) => {
  renderPage(newPage);
});

// 监听缩放变化
watch(scale, () => {
  renderPage(currentPage.value);
});

// 监听 URL 变化
watch(() => props.url, () => {
  loadPdf();
});

// 组件挂载时加载 PDF
onMounted(() => {
  loadPdf();
});

// 组件卸载时清理
onUnmounted(() => {
  if (renderTask) {
    renderTask.cancel();
    renderTask = null;
  }
  if (pdfDoc) {
    pdfDoc.destroy();
    pdfDoc = null;
  }
});
</script>

<style scoped>
.pdf-preview {
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

/* 加载状态 */
.pdf-loading,
.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 12px;
  color: #606266;
}

.loading-icon {
  font-size: 32px;
  animation: rotate 1s linear infinite;
}

.error-icon {
  font-size: 32px;
  color: #f56c6c;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 工具栏 */
.pdf-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.page-info {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
  text-align: center;
}

.page-slider {
  width: 150px;
}

/* Canvas 容器 */
.pdf-container {
  padding: 16px;
}

.pdf-canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  background: #525659;
  min-height: 400px;
  overflow: auto;
}

.pdf-canvas {
  display: block;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

/* 文本层 */
.pdf-text-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
  pointer-events: auto;
}

.pdf-text-layer :deep(span) {
  color: transparent;
  position: absolute;
  white-space: pre;
  transform-origin: 0% 0%;
}

.pdf-text-layer :deep(span::selection) {
  background: rgba(51, 136, 255, 0.4);
}

/* 缩放控制 */
.pdf-zoom-controls {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

.zoom-label {
  min-width: 60px;
  cursor: default;
}

/* 滚动条样式 */
.pdf-canvas-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pdf-canvas-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.pdf-canvas-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
</style>
