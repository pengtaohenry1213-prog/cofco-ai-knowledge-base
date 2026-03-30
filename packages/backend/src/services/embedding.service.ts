import {
  TextChunk,
  VectorItem,
  EmbeddingResult,
  DoubaoEmbeddingResponse,
  ChunkOptions
} from '../types/embedding.types';
import { config } from '../config';

/** 默认分块参数 */
const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 100;

/** API 超时时间（ms） */
const API_TIMEOUT_MS = 10_000;

/** 最大重试次数 */
const MAX_RETRIES = 2;

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
 * 调用豆包 Embedding API，将文本转为向量
 *
 * @param text - 待向量化的文本
 * @returns EmbeddingResult
 */
export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    return { success: false, error: '文本内容为空' };
  }

  const endpoint = `${config.doubao.baseUrl}/embeddings`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.doubao.apiKey}`
        },
        body: JSON.stringify({
          model: 'embedding-v1',
          input: text
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        return {
          success: false,
          error: `API 请求失败: ${response.status} ${response.statusText} ${errorBody}`.trim()
        };
      }

      const data = (await response.json()) as DoubaoEmbeddingResponse;

      if (data.code !== 0 && data.code !== 200) {
        return {
          success: false,
          error: data.msg || 'Embedding API 返回错误'
        };
      }

      const embedding = data.data?.embeddings?.[0]?.embedding;
      if (!embedding) {
        return { success: false, error: 'Embedding 返回结果为空' };
      }

      return { success: true, data: embedding };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

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
 * 提供文档添加和向量查询能力，预留数据库扩展接口
 */
export class VectorStore {
  private vectors: VectorItem[] = [];

  /**
   * 添加文档到向量存储
   * - 自动分块
   * - 调用 Embedding API 获取向量
   *
   * @param text - 文档文本
   * @param options - 分块选项
   * @returns EmbeddingResult
   */
  async addDocument(
    text: string,
    options: ChunkOptions = {}
  ): Promise<EmbeddingResult> {
    const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const overlap = options.overlap ?? DEFAULT_OVERLAP;

    if (!text || text.trim().length === 0) {
      return { success: false, error: '文本内容为空' };
    }

    const chunks = splitIntoChunks(text, chunkSize, overlap);

    for (const chunk of chunks) {
      const result = await createEmbedding(chunk.content);

      if (!result.success) {
        return result;
      }

      this.vectors.push({
        id: chunk.id,
        content: chunk.content,
        embedding: result.data!
      });
    }

    return { success: true };
  }

  /**
   * 获取所有已存储的向量
   */
  getAllVectors(): VectorItem[] {
    return [...this.vectors];
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
