/**
 * 文档状态管理
 * 存储上传的文档文本，用于跨页面数据共享
 * 支持文档列表管理功能
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { request } from '@/utils/request';
import type {
  DocumentItem,
  UploadDocumentResponse,
  DocumentListResponse,
  EmbeddingStatus
} from '@/types/document';

export const useDocumentStore = defineStore('document', () => {
  // ==================== 原有功能 ====================
  /** 解析后的文档文本内容 */
  const documentText = ref<string>('');

  /** HTML 格式文档内容（用于预览） */
  const documentHtml = ref<string>('');

  /** PDF 文件路径（前端渲染用） */
  const pdfPath = ref<string>('');

  /** 是否为 PDF 文件 */
  const isPdf = ref<boolean>(false);

  /** 是否有已上传的文档 */
  const hasDocument = ref<boolean>(false);

  /** 当前文档文件名 */
  const filename = ref<string>('');

  /**
   * 设置文档内容
   * @param text 文档文本内容
   * @param name 文件名
   * @param html HTML 格式内容（可选，用于预览）
   * @param pdfPathVal PDF 文件路径（可选，PDF 渲染用）
   * @param isPdfVal 是否为 PDF 文件（可选）
   */
  function setDocumentText(text: string, name: string = '', html?: string, pdfPathVal?: string, isPdfVal?: boolean) {
    documentText.value = text;
    filename.value = name;
    hasDocument.value = text.length > 0;
    if (html !== undefined) {
      documentHtml.value = html;
    }
    if (pdfPathVal !== undefined) {
      pdfPath.value = pdfPathVal;
    }
    if (isPdfVal !== undefined) {
      isPdf.value = isPdfVal;
    }
  }

  /**
   * 清除文档内容
   */
  function clearDocument() {
    documentText.value = '';
    documentHtml.value = '';
    pdfPath.value = '';
    isPdf.value = false;
    filename.value = '';
    hasDocument.value = false;
  }

  // ==================== 新增：文档列表管理 ====================
  /** 文档列表 */
  const documents = ref<DocumentItem[]>([]);

  /** 文档列表加载状态 */
  const loading = ref<boolean>(false);

  /** 按知识库筛选的文档 */
  const documentsByKnowledgeBase = computed(() => {
    return (kbId: string) => documents.value.filter((doc) => doc.knowledgeBaseIds.includes(kbId));
  });

  /**
   * 获取文档列表
   * @param kbId 可选，按知识库 ID 筛选
   */
  async function fetchDocuments(kbId?: string): Promise<void> {
    loading.value = true;
    try {
      const url = kbId ? `/documents?kbId=${kbId}` : '/documents';
      const res = await request.get<DocumentListResponse>(url);
      if (res.data.success) {
        documents.value = res.data.data || [];
      } else {
        documents.value = [];
      }
    } catch (error) {
      console.error('[DocumentStore] 获取文档列表失败:', error);
      documents.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 上传文档
   * @param file 文件对象
   * @param knowledgeBaseIds 关联的知识库 ID 数组
   */
  async function uploadDocument(file: File, knowledgeBaseIds: string[]): Promise<DocumentItem | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('knowledgeBaseIds', JSON.stringify(knowledgeBaseIds));

      const res = await request.upload<UploadDocumentResponse>('/documents/upload', formData);

      if (res.data.success && res.data.data) {
        documents.value.unshift(res.data.data);
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error('[DocumentStore] 上传文档失败:', error);
      return null;
    }
  }

  /**
   * 删除文档
   * @param id 文档 ID
   */
  async function deleteDocument(id: string): Promise<boolean> {
    try {
      const res = await request.delete(`/documents/${id}`);
      if (res.data.success) {
        documents.value = documents.value.filter((doc) => doc.id !== id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DocumentStore] 删除文档失败:', error);
      return false;
    }
  }

  /**
   * 添加文档到知识库
   * @param documentId 文档 ID
   * @param knowledgeBaseIds 知识库 ID 数组
   */
  async function addToKnowledgeBases(
    documentId: string,
    knowledgeBaseIds: string[]
  ): Promise<boolean> {
    try {
      const res = await request.post(`/documents/${documentId}/knowledgebases`, {
        knowledgeBaseIds
      });
      if (res.data.success && res.data.data) {
        const index = documents.value.findIndex((doc) => doc.id === documentId);
        if (index !== -1) {
          documents.value[index] = res.data.data;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DocumentStore] 添加文档到知识库失败:', error);
      return false;
    }
  }

  /**
   * 从知识库移除文档
   * @param documentId 文档 ID
   * @param knowledgeBaseId 知识库 ID
   */
  async function removeFromKnowledgeBase(
    documentId: string,
    knowledgeBaseId: string
  ): Promise<boolean> {
    try {
      const res = await request.delete(`/documents/${documentId}/knowledgebases/${knowledgeBaseId}`);
      if (res.data.success && res.data.data) {
        const index = documents.value.findIndex((doc) => doc.id === documentId);
        if (index !== -1) {
          documents.value[index] = res.data.data;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DocumentStore] 从知识库移除文档失败:', error);
      return false;
    }
  }

  /**
   * 获取单个文档
   * @param id 文档 ID
   */
  function getDocumentById(id: string): DocumentItem | undefined {
    return documents.value.find((doc) => doc.id === id);
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取 Embedding 状态标签
   * @param status 状态
   */
  function getStatusLabel(status: EmbeddingStatus): string {
    const labels: Record<EmbeddingStatus, string> = {
      pending: '等待中',
      processing: '处理中',
      completed: '已完成',
      failed: '失败'
    };
    return labels[status] || status;
  }

  /**
   * 获取 Embedding 状态类型
   * @param status 状态
   */
  function getStatusType(status: EmbeddingStatus): string {
    const types: Record<EmbeddingStatus, string> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'danger'
    };
    return types[status] || 'info';
  }

  return {
    // 原有功能
    documentText,
    documentHtml,
    pdfPath,
    isPdf,
    hasDocument,
    filename,
    setDocumentText,
    clearDocument,

    // 新增功能
    documents,
    loading,
    documentsByKnowledgeBase,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    addToKnowledgeBases,
    removeFromKnowledgeBase,
    getDocumentById,
    formatFileSize,
    getStatusLabel,
    getStatusType
  };
});
