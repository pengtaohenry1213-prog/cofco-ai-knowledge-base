/** Embedding 处理状态 */
export type EmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 文档实体 */
export interface Document {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  knowledgeBaseIds: string[];
  chunkIds: string[];
  embeddingStatus: EmbeddingStatus;
  uploadedAt: string;
  uploadedBy: string;
}

/** 带有分块详情的文档 */
export interface DocumentWithChunks extends Document {
  chunks: VectorItem[];
}

/** 文档上传请求 */
export interface DocumentUploadRequest {
  knowledgeBaseIds: string[];
  /** 上传用户（可选，默认 'anonymous'） */
  uploadedBy?: string;
}

/** 文档上传响应 */
export interface DocumentUploadResponse {
  success: boolean;
  data?: Document;
  error?: string;
}

/** 文档列表响应 */
export interface DocumentListResponse {
  success: boolean;
  data?: Document[];
  error?: string;
}

/** 添加到知识库请求 */
export interface AddToKnowledgeBasesRequest {
  knowledgeBaseIds: string[];
}

/** 带有分块详情的向量存储项 */
export interface VectorItem {
  id: string;
  content: string;
  embedding: number[];
}

/** 按知识库隔离的向量存储结构 */
export interface KnowledgeBaseVectorStore {
  knowledgeBaseId: string;
  vectors: VectorItem[];
}
