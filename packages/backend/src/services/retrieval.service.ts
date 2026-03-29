import { vectorStore } from './embedding.service';
import { cosineSimilarity } from '../utils/similarity';
import { createEmbedding } from './embedding.service';

/** 检索结果 */
export interface RetrievalResult {
  success: boolean;
  data?: string[];
  error?: string;
}

/**
 * 从向量存储中检索与查询最相关的 TopK 个文本块
 *
 * @param question - 查询问题
 * @param k - 返回的最相似结果数量（默认1）
 * @returns RetrievalResult，包含最相似的文本块数组
 */
export async function searchTopK(
  question: string,
  k: number = 1
): Promise<RetrievalResult> {
  // 验证 k 值
  if (k < 1) {
    return {
      success: false,
      error: 'k 值必须大于等于 1'
    };
  }

  // 获取所有已存储的文档向量
  const allVectors = vectorStore.getAllVectors();

  // 无文档时返回错误
  if (allVectors.length === 0) {
    return {
      success: false,
      error: '暂无文档'
    };
  }

  // 创建查询问题的 embedding
  const embeddingResult = await createEmbedding(question);

  if (!embeddingResult.success || !embeddingResult.data) {
    return {
      success: false,
      error: embeddingResult.error || '获取问题向量失败'
    };
  }

  const queryVector = embeddingResult.data;

  // 计算每个文档与查询的余弦相似度
  const scoredResults = allVectors.map((item) => ({
    content: item.content,
    score: cosineSimilarity(queryVector, item.embedding)
  }));

  // 按相似度降序排序，取前 k 个
  scoredResults.sort((a, b) => b.score - a.score);
  const topKResults = scoredResults.slice(0, k);

  // 返回文本块数组
  return {
    success: true,
    data: topKResults.map((r) => r.content)
  };
}
