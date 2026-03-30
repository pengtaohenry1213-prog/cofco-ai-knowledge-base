/** 单个文本分块 */
export interface TextChunk {
  id: string;
  content: string;
}

/** 内存向量存储项 */
export interface VectorItem {
  id: string;
  content: string;
  embedding: number[];
}

/** Embedding API 请求结构 */
export interface EmbeddingRequest {
  input: string[];
  model: string;
}

/** Embedding API 响应结构 */
export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
}

/** Embedding API 调用结果 */
export interface EmbeddingResult {
  success: boolean;
  data?: number[];
  error?: string;
}

/** 豆包 Embedding API 完整响应 */
export interface DoubaoEmbeddingResponse {
  code?: number;
  msg?: string;
  data?: {
    embeddings?: Array<{
      embedding: number[];
      index: number;
    }>;
  };
}

/** 文本分块选项 */
export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}
