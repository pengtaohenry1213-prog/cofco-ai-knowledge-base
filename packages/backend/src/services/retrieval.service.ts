import { vectorStore } from './embedding.service';
// import { createEmbedding } from './embedding.service';

/** 检索结果 */
export interface RetrievalResult {
  success: boolean;
  chunks?: string[];
  error?: string;
}

/**
 * 从向量存储中检索与查询最相关的 TopK 个文本块
 *
 * @param question - 查询问题
 * @param k - 返回的最相似结果数量（默认1）
 * @param knowledgeBaseId - 可选，指定知识库 ID，不指定则搜索所有
 * @returns RetrievalResult，包含最相似的文本块数组【`searchTopK` 返回的是 **文本块数组**（`chunks`），而不是向量本身。】
 */
export async function searchTopK(
  question: string,
  k: number = 1,
  knowledgeBaseId?: string
): Promise<RetrievalResult> {
  // 验证 k 值
  if (k < 1) {
    return {
      success: false,
      error: 'k 值必须大于等于 1'
    };
  }

  // 数据流: 内存 (vectorStore.kbStores) → 检索服务 (retrieval.service.ts) → 返回给调用方

  // 获取向量（按知识库或全部）
  const vectors = knowledgeBaseId
    ? await vectorStore.queryByKnowledgeBase(question, knowledgeBaseId, k) // 查询指定知识库的向量，指定知识库存储在内存中
    : await vectorStore.query(question, k); // 查询所有知识库的向量，所有知识库存储在内存中

  // 无文档时返回错误
  if (vectors.length === 0) {
    return {
      success: false,
      error: knowledgeBaseId ? '该知识库暂无文档' : '暂无文档'
    };
  }

  // console调试
  console.log('knowledgeBaseId = ', knowledgeBaseId);
  console.log('[retrieval.service.ts] [searchTopK] 检索服务 - searchTopK （从向量存储中检索与查询最相关的 TopK 个文本块）');
  console.log('[retrieval.service.ts] [searchTopK] vectors', vectors);
  // console.groupEnd();

  // 直接返回检索结果
  // `searchTopK` 返回的是 **文本块数组**（`chunks`），而不是向量本身。
  return {
    success: true,
    chunks: vectors.map((v) => v.content) // ← 只返回文本内容，不返回向量
  };
}
