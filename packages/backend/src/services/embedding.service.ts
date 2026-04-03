import {
  TextChunk,
  VectorItem,
  EmbeddingResult,
  ChunkOptions
} from '../types/embedding.types';
import { KnowledgeBaseVectorStore, VectorItem as KbVectorItem } from '../types/document.types';
import { config } from '../config';

/** SiliconFlow Embedding API 端点 */
const EMBEDDING_ENDPOINT = '/embeddings';
/** SiliconFlow Embedding 模型名称 */
const EMBEDDING_MODEL = 'BAAI/bge-large-zh-v1.5';

/** 默认分块参数 */
const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 100;

/** API 超时时间（ms） */
const API_TIMEOUT_MS = 10_000;

/** 最大重试次数 */
const MAX_RETRIES = 2;

/**
 * 获取当前使用的 embedding 配置
 */
function getEmbeddingConfig() {
  if (config.siliconFlow?.apiKey) {
    return {
      endpoint: `${config.siliconFlow.baseUrl}${EMBEDDING_ENDPOINT}`,
      apiKey: config.siliconFlow.apiKey,
      model: config.siliconFlow.model,
      provider: 'SiliconFlow'
    };
  }
  return {
    endpoint: `${config.doubao.baseUrl}/embeddings4`,
    apiKey: config.doubao.apiKey,
    model: 'doubao-embedding',
    provider: 'Doubao'
  };
}

/**
 * 将文本按句子拆分，返回句子数组
 * 句子分隔符：中英文句号、感叹号、问号
 */
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const regex = /[^.!?。！？]+(?:[.!?。！？]+|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence) {
      sentences.push(sentence);
    }
  }

  if (sentences.length === 0 && text.trim()) {
    sentences.push(text.trim());
  }

  return sentences;
}

/**
 * 将文本按句子边界拆分为固定大小的分块
 * - 每个分块约 chunkSize 字
 * - 相邻分块重叠 overlap 字
 * - 不在句子中间截断
 *
 * @param text - 待分块文本
 * @param chunkSize - 每块字数（默认 500）
 * @param overlap - 相邻块重叠字数（默认 100）
 * @returns 分块数组
 */
export function splitIntoChunks(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const sentences = splitIntoSentences(text);
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentLen = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceLen = sentence.length;

    // 如果当前句子本身就超过 chunkSize，按字符数硬切（不可拆分的最小单元）
    if (sentenceLen > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push({
          id: `chunk-${chunkIndex++}`,
          content: currentChunk.trim()
        });
        currentChunk = currentChunk.slice(-overlap);
        currentLen = currentChunk.length;
      }
      // 按字符数硬切成多个子块
      let pos = 0;
      while (pos < sentenceLen) {
        const end = pos + chunkSize;
        const subChunk = sentence.slice(pos, Math.min(end, sentenceLen));
        chunks.push({
          id: `chunk-${chunkIndex++}`,
          content: subChunk.trim()
        });
        pos = end - overlap;
        if (pos <= 0) break; // overlap >= chunkSize 时退出，避免死循环
      }
      currentChunk = '';
      currentLen = 0;
      continue;
    }

    // 如果加上当前句子超过 chunkSize，先保存当前块
    if (currentLen + sentenceLen > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push({
          id: `chunk-${chunkIndex++}`,
          content: currentChunk.trim()
        });
        // overlap：保留最后 overlap 字作为下一个块的开头
        currentChunk = currentChunk.slice(-overlap);
        currentLen = currentChunk.length;
      }
    }

    currentChunk += sentence;
    currentLen += sentenceLen;
  }

  // 处理最后一块
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `chunk-${chunkIndex}`,
      content: currentChunk.trim()
    });
  }

  return chunks;
}

/**
 * 调用 Embedding API，将文本转为向量
 * 支持 SiliconFlow 和豆包
 *
 * @param text - 待向量化的文本
 * @returns EmbeddingResult
 */
export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    return { success: false, error: '文本内容为空' };
  }

  const embeddingConfig = getEmbeddingConfig();
  console.log(`[Embedding] Provider: ${embeddingConfig.provider}`);
  console.log(`[Embedding] 请求 endpoint: ${embeddingConfig.endpoint}`);
  console.log(`[Embedding] 模型: ${embeddingConfig.model}`);
  console.log(`[Embedding] 文本长度: ${text.length}`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const response = await fetch(embeddingConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${embeddingConfig.apiKey}`
        },
        body: JSON.stringify({
          model: embeddingConfig.model,
          input: [text]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[Embedding] HTTP 状态: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.log(`[Embedding] ✗ 错误: ${errorBody}`);
        return {
          success: false,
          error: `API 请求失败: ${response.status} ${response.statusText} ${errorBody}`.trim()
        };
      }

      const data = await response.json() as { data?: Array<{ embedding: number[] }>; error?: { message: string } };
      console.log(`[Embedding] 响应: ${JSON.stringify(data).slice(0, 200)}`);

      // SiliconFlow API 响应格式：{ data: [{ embedding: [...], index: 0 }] }
      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Embedding API 返回错误'
        };
      }

      const embedding = data.data?.[0]?.embedding;
      if (!embedding) {
        console.log(`[Embedding] ✗ embedding 为空`);
        return { success: false, error: 'Embedding 返回结果为空' };
      }
      console.log(`[Embedding] ✓ 成功，向量长度: ${embedding.length}`);

      return { success: true, data: embedding };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.log(`[Embedding] ✗ 异常: ${lastError.message}`);

      // 如果是 AbortError（超时），继续重试
      if (lastError.name === 'AbortError' && attempt < MAX_RETRIES) {
        continue;
      }

      // 其他错误（如网络错误），继续重试
      if (attempt < MAX_RETRIES) {
        continue;
      }
    }
  }

  return {
    success: false,
    error: `Embedding 请求失败: ${lastError?.message || '未知错误'}`
  };
}

/**
 * 向量内存存储类
 * 提供文档添加和向量查询能力，按知识库隔离存储
 */
export class VectorStore {
  /** 按知识库 ID 隔离的向量存储 */
  private kbStores: Map<string, VectorItem[]> = new Map();

  /**
   * 添加文档到指定知识库的向量存储
   * - 自动分块
   * - 调用 Embedding API 获取向量
   *
   * @param text - 文档文本
   * @param knowledgeBaseId - 知识库 ID
   * @param options - 分块选项
   * @returns 包含 chunkIds 的结果
   */
  async addDocument(
    text: string,
    knowledgeBaseId: string,
    options: ChunkOptions = {}
  ): Promise<{ success: boolean; chunkIds?: string[]; error?: string }> {
    const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const overlap = options.overlap ?? DEFAULT_OVERLAP;

    if (!text || text.trim().length === 0) {
      return { success: false, error: '文本内容为空' };
    }

    const chunks = splitIntoChunks(text, chunkSize, overlap);
    const chunkIds: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < chunks.length; i++) {
      const result = await createEmbedding(chunks[i].content);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const chunkId = `kb-${knowledgeBaseId}-chunk-${timestamp}-${i}`;
      chunkIds.push(chunkId);

      const vectorItem: VectorItem = {
        id: chunkId,
        content: chunks[i].content,
        embedding: result.data!
      };

      // 按知识库 ID 存储
      const kbVectors = this.kbStores.get(knowledgeBaseId) || [];
      kbVectors.push(vectorItem);
      this.kbStores.set(knowledgeBaseId, kbVectors);
    }

    console.log(`[VectorStore] 添加到知识库 ${knowledgeBaseId}: ${chunkIds.length} 个分块`);
    return { success: true, chunkIds };
  }

  /**
   * 向已有知识库添加新的分块
   * @param text - 文档文本
   * @param knowledgeBaseId - 知识库 ID
   * @param options - 分块选项
   * @returns 包含 chunkIds 的结果
   */
  async addChunks(
    text: string,
    knowledgeBaseId: string,
    options: ChunkOptions = {}
  ): Promise<{ success: boolean; chunkIds?: string[]; error?: string }> {
    return this.addDocument(text, knowledgeBaseId, options);
  }

  /**
   * 查询指定知识库的相关向量
   * @param question - 查询问题
   * @param knowledgeBaseId - 知识库 ID
   * @param topK - 返回数量
   * @returns 相似度最高的向量
   */
  async queryByKnowledgeBase(
    question: string,
    knowledgeBaseId: string,
    topK: number = 5
  ): Promise<VectorItem[]> {
    const kbVectors = this.kbStores.get(knowledgeBaseId) || [];
    if (kbVectors.length === 0) {
      console.log(`[VectorStore] 知识库 ${knowledgeBaseId} 没有向量数据`);
      return [];
    }

    // 生成问题的 embedding
    const questionEmbedding = await createEmbedding(question);
    if (!questionEmbedding.success || !questionEmbedding.data) {
      console.log(`[VectorStore] 问题 embedding 失败: ${questionEmbedding.error}`);
      return [];
    }

    // 计算相似度并排序
    const similarities = kbVectors.map((v) => ({
      vector: v,
      similarity: this.cosineSimilarity(questionEmbedding.data!, v.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    const results = similarities.slice(0, topK).map((s) => s.vector);

    console.log(`[VectorStore] 查询知识库 ${knowledgeBaseId}: 返回 ${results.length} 个结果`);
    return results;
  }

  /**
   * 查询所有知识库的相关向量（兼容旧接口）
   * @param question - 查询问题
   * @param topK - 返回数量
   * @returns 相似度最高的向量
   */
  async query(question: string, topK: number = 5): Promise<VectorItem[]> {
    // 合并所有知识库的向量
    const allVectors: VectorItem[] = [];
    for (const vectors of this.kbStores.values()) {
      allVectors.push(...vectors);
    }

    if (allVectors.length === 0) {
      return [];
    }

    const questionEmbedding = await createEmbedding(question);
    if (!questionEmbedding.success || !questionEmbedding.data) {
      return [];
    }

    const similarities = allVectors.map((v) => ({
      vector: v,
      similarity: this.cosineSimilarity(questionEmbedding.data!, v.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK).map((s) => s.vector);
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 删除指定分块
   * @param chunkIds - 分块 ID 数组
   */
  deleteChunks(chunkIds: string[]): void {
    for (const [kbId, vectors] of this.kbStores.entries()) {
      const filtered = vectors.filter((v) => !chunkIds.includes(v.id));
      this.kbStores.set(kbId, filtered);
    }
    console.log(`[VectorStore] 删除分块: ${chunkIds.length} 个`);
  }

  /**
   * 删除指定知识库的所有向量
   * @param knowledgeBaseId - 知识库 ID
   */
  deleteByKnowledgeBase(knowledgeBaseId: string): void {
    this.kbStores.delete(knowledgeBaseId);
    console.log(`[VectorStore] 删除知识库 ${knowledgeBaseId} 的所有向量`);
  }

  /**
   * 获取指定知识库的向量数量
   * @param knowledgeBaseId - 知识库 ID
   */
  getVectorCount(knowledgeBaseId: string): number {
    return this.kbStores.get(knowledgeBaseId)?.length || 0;
  }

  /**
   * 获取所有知识库的向量统计
   */
  getStats(): { knowledgeBaseId: string; count: number }[] {
    const stats: { knowledgeBaseId: string; count: number }[] = [];
    for (const [kbId, vectors] of this.kbStores.entries()) {
      stats.push({ knowledgeBaseId: kbId, count: vectors.length });
    }
    return stats;
  }

  /**
   * 预留：持久化到数据库
   * TODO: 实现数据库存储逻辑
   */
  async toDatabase(): Promise<void> {
    // TODO: 接入数据库（如 pgvector / Qdrant / Milvus）
  }
}

export const vectorStore = new VectorStore();
