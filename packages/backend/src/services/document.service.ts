import {
  Document,
  DocumentUploadResponse,
  DocumentListResponse,
  EmbeddingStatus
} from '../types/document.types';

/**
 * 文档服务
 * 负责文档的创建、查询、关联管理
 */
export class DocumentService {
  private documents: Document[] = [];

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * 创建文档记录
   * @param name 文件名
   * @param size 文件大小
   * @param mimeType MIME 类型
   * @param knowledgeBaseIds 关联的知识库 ID
   * @param uploadedBy 上传用户
   * @returns 创建的文档
   */
  createDocument(
    name: string,
    size: number,
    mimeType: string,
    knowledgeBaseIds: string[],
    uploadedBy: string = 'anonymous'
  ): Document {
    const doc: Document = {
      id: this.generateId(),
      name,
      size,
      mimeType,
      knowledgeBaseIds: [...knowledgeBaseIds],
      chunkIds: [],
      embeddingStatus: 'pending',
      uploadedAt: new Date().toISOString(),
      uploadedBy
    };
    this.documents.push(doc);
    console.log(`[DocumentService] 创建文档: ${doc.id} - ${name}`);
    return doc;
  }

  /**
   * 获取文档
   * @param id 文档 ID
   * @returns 文档或 undefined
   */
  getDocumentById(id: string): Document | undefined {
    return this.documents.find((d) => d.id === id);
  }

  /**
   * 获取文档（包含 chunkIds）
   * @param id 文档 ID
   * @returns 文档
   */
  getDocumentWithChunks(id: string): Document | undefined {
    return this.documents.find((d) => d.id === id);
  }

  /**
   * 按知识库 ID 获取所有关联文档
   * @param knowledgeBaseId 知识库 ID
   * @returns 文档列表
   */
  getDocumentsByKnowledgeBase(knowledgeBaseId: string): Document[] {
    return this.documents.filter((d) => d.knowledgeBaseIds.includes(knowledgeBaseId));
  }

  /**
   * 获取所有文档
   * @returns 所有文档
   */
  getAllDocuments(): Document[] {
    return [...this.documents];
  }

  /**
   * 更新文档的分块信息
   * @param id 文档 ID
   * @param chunkIds 分块 ID 数组
   */
  updateChunkIds(id: string, chunkIds: string[]): void {
    const doc = this.getDocumentById(id);
    if (doc) {
      doc.chunkIds = chunkIds;
      console.log(`[DocumentService] 更新文档 ${id} 的 chunkIds: ${chunkIds.length} 个`);
    }
  }

  /**
   * 更新文档的 Embedding 状态
   * @param id 文档 ID
   * @param status 状态
   */
  updateEmbeddingStatus(id: string, status: EmbeddingStatus): void {
    const doc = this.getDocumentById(id);
    if (doc) {
      doc.embeddingStatus = status;
      console.log(`[DocumentService] 更新文档 ${id} 状态: ${status}`);
    }
  }

  /**
   * 添加文档到知识库
   * @param documentId 文档 ID
   * @param knowledgeBaseIds 知识库 ID 数组
   */
  addToKnowledgeBases(documentId: string, knowledgeBaseIds: string[]): boolean {
    const doc = this.getDocumentById(documentId);
    if (!doc) {
      return false;
    }
    for (const kbId of knowledgeBaseIds) {
      if (!doc.knowledgeBaseIds.includes(kbId)) {
        doc.knowledgeBaseIds.push(kbId);
      }
    }
    console.log(`[DocumentService] 文档 ${documentId} 添加到知识库: ${knowledgeBaseIds.join(', ')}`);
    return true;
  }

  /**
   * 从知识库移除文档
   * @param documentId 文档 ID
   * @param knowledgeBaseId 知识库 ID
   * @returns 是否成功
   */
  removeFromKnowledgeBase(documentId: string, knowledgeBaseId: string): boolean {
    const doc = this.getDocumentById(documentId);
    if (!doc) {
      return false;
    }
    const index = doc.knowledgeBaseIds.indexOf(knowledgeBaseId);
    if (index !== -1) {
      doc.knowledgeBaseIds.splice(index, 1);
      console.log(`[DocumentService] 文档 ${documentId} 从知识库 ${knowledgeBaseId} 移除`);
    }
    return true;
  }

  /**
   * 删除文档
   * @param id 文档 ID
   * @returns 被删除的文档（用于清理关联的向量）
   */
  deleteDocument(id: string): Document | undefined {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) {
      return undefined;
    }
    const [deleted] = this.documents.splice(index, 1);
    console.log(`[DocumentService] 删除文档: ${id} - ${deleted.name}`);
    return deleted;
  }

  /**
   * 获取文档关联的知识库 ID
   * @param documentId 文档 ID
   * @returns 知识库 ID 数组
   */
  getKnowledgeBaseIds(documentId: string): string[] {
    const doc = this.getDocumentById(documentId);
    return doc ? [...doc.knowledgeBaseIds] : [];
  }
}

export const documentService = new DocumentService();
