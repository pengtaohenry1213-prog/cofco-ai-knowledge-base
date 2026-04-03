/** Embedding 处理状态 */
export type EmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 文档列表项 */
export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  knowledgeBaseIds: string[];
  embeddingStatus: EmbeddingStatus;
  chunkCount?: number;
  uploadedAt: string;
  uploadedBy: string;
}

/** 上传文档请求参数 */
export interface UploadDocumentPayload {
  knowledgeBaseIds: string[];
}

/** 上传文档响应 */
export interface UploadDocumentResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    knowledgeBaseIds: string[];
    embeddingStatus: EmbeddingStatus;
    chunkCount: number;
    uploadedAt: string;
    uploadedBy: string;
  };
  error?: string;
}

/** 文档列表响应 */
export interface DocumentListResponse {
  success: boolean;
  data?: DocumentItem[];
  error?: string;
}

/** 添加文档到知识库请求参数 */
export interface AddToKnowledgeBasesPayload {
  knowledgeBaseIds: string[];
}
