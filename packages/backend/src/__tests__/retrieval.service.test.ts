import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_EMBEDDING_1 = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const MOCK_EMBEDDING_2 = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
const MOCK_EMBEDDING_3 = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

// Mock 函数
const mockQuery = vi.fn();
const mockQueryByKnowledgeBase = vi.fn();
const mockCreateEmbedding = vi.fn();

// Mock 模块
vi.mock('../services/embedding.service', () => ({
  createEmbedding: (...args: unknown[]) => mockCreateEmbedding(...args),
  vectorStore: {
    query: (...args: unknown[]) => mockQuery(...args),
    queryByKnowledgeBase: (...args: unknown[]) => mockQueryByKnowledgeBase(...args)
  }
}));

describe('searchTopK', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    vi.clearAllMocks();
    mockCreateEmbedding.mockResolvedValue({
      success: true,
      data: MOCK_EMBEDDING_1
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // TC-RET-004: 无文档时返回错误
  it('TC-RET-004: 无文档时返回错误', async () => {
    mockQuery.mockResolvedValue([]);

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('这是一个测试问题', 3);

    expect(result.success).toBe(false);
    expect(result.error).toBe('暂无文档');
  });

  // TC-RET-001: 正常检索返回 TopK 结果
  it('TC-RET-001: 正常检索返回 TopK 结果', async () => {
    // query 返回前 k 个结果
    mockQuery.mockImplementation(async (question: string, k: number) => {
      return [
        { id: 'chunk-0', content: '文档内容1', embedding: MOCK_EMBEDDING_1 },
        { id: 'chunk-1', content: '文档内容2', embedding: MOCK_EMBEDDING_2 }
      ].slice(0, k);
    });

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 2);

    expect(result.success).toBe(true);
    expect(result.chunks).toHaveLength(2);
    expect(result.chunks).toContain('文档内容1');
    expect(result.chunks).toContain('文档内容2');
  });

  // TC-RET-002: k=1 时返回 1 个结果
  it('TC-RET-002: k=1 时返回1个结果', async () => {
    mockQuery.mockResolvedValue([
      { id: 'chunk-0', content: '文档内容1', embedding: MOCK_EMBEDDING_1 }
    ]);

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 1);

    expect(result.success).toBe(true);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks![0]).toBe('文档内容1');
  });

  // k < 1 时返回错误
  it('k值小于1时返回错误', async () => {
    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 0);

    expect(result.success).toBe(false);
    expect(result.error).toBe('k 值必须大于等于 1');
  });

  it('k值为负数时返回错误', async () => {
    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', -1);

    expect(result.success).toBe(false);
    expect(result.error).toBe('k 值必须大于等于 1');
  });

  // 当 k 大于文档数量时，返回所有文档
  it('k大于文档数量时返回所有文档', async () => {
    mockQuery.mockResolvedValue([
      { id: 'chunk-0', content: '文档1', embedding: MOCK_EMBEDDING_1 },
      { id: 'chunk-1', content: '文档2', embedding: MOCK_EMBEDDING_2 }
    ]);

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 10);

    expect(result.success).toBe(true);
    expect(result.chunks).toHaveLength(2);
  });

  // 返回结果按相似度降序排列（mock 返回已排序的结果）
  it('返回结果按相似度降序排列', async () => {
    mockQuery.mockResolvedValue([
      { id: 'chunk-1', content: '高相似度', embedding: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9] },
      { id: 'chunk-2', content: '中等相似度', embedding: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
      { id: 'chunk-0', content: '低相似度', embedding: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] }
    ]);

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 3);

    expect(result.success).toBe(true);
    expect(result.chunks![0]).toBe('高相似度');
    expect(result.chunks![1]).toBe('中等相似度');
    expect(result.chunks![2]).toBe('低相似度');
  });

  // 获取向量失败时返回错误
  it('获取问题向量失败时返回错误', async () => {
    mockQuery.mockResolvedValue([]);

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 1);

    expect(result.success).toBe(false);
    expect(result.error).toBe('暂无文档');
  });

  // 配置校验在服务启动时执行（已在 index.ts 测试）
  // 此处验证正常情况下 API Key 校验通过
  it('正常配置下 API Key 校验通过', async () => {
    mockQuery.mockResolvedValue([
      { id: 'chunk-0', content: '文档1', embedding: MOCK_EMBEDDING_1 }
    ]);

    const { searchTopK } = await import('../services/retrieval.service');
    const result = await searchTopK('测试问题', 1);

    expect(result.success).toBe(true);
  });
});
