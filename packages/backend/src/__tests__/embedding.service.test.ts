import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_EMBEDDING = Array.from({ length: 1536 }, () => Math.random());

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('splitIntoChunks', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TC-EMB-001: 分块函数处理 500 字文本 → 返回 1 个分块
  it('TC-EMB-001: 500字文本返回1个分块', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = 'a'.repeat(500);
    const chunks = splitIntoChunks(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
  });

  // TC-EMB-002: 分块函数处理 1500 字文本 → 返回约 3 个分块
  it('TC-EMB-002: 1500字文本返回约3个分块', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = 'a'.repeat(1500);
    const chunks = splitIntoChunks(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.length).toBeLessThanOrEqual(4);
  });

  // TC-EMB-003: 分块函数处理边界（499字）→ 返回 1 个分块
  it('TC-EMB-003: 499字文本返回1个分块', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = 'a'.repeat(499);
    const chunks = splitIntoChunks(text);
    expect(chunks).toHaveLength(1);
  });

  // TC-EMB-004: 分块函数处理边界（501字）→ 返回 2 个分块
  it('TC-EMB-004: 501字文本返回2个分块', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = 'a'.repeat(501);
    const chunks = splitIntoChunks(text);
    expect(chunks).toHaveLength(2);
  });

  // TC-EMB-005: 分块保留句子完整性（不截断句子中间）
  // chunkSize >= 句子平均长度时，句子不应被截断
  it('TC-EMB-005: 分块大小足够时句子不被截断', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = '这是第一句话。这是第二句话。';
    const chunks = splitIntoChunks(text, 50, 10);

    // 每个分块必须以句子标点结尾，或恰好是整句
    for (const chunk of chunks) {
      const trimmed = chunk.content.trim();
      const endsWithSentencePunctuation = /[。！？.!?]$/.test(trimmed);
      expect(endsWithSentencePunctuation).toBe(true);
    }
  });

  // chunkSize < 单句长度时，硬切不受"句子完整性"约束（不可拆分最小单元）
  it('超长单句按字符硬切（不适用"不截断"约束）', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = '这是一个非常长的句子。'.repeat(50); // 远超 500 字
    const chunks = splitIntoChunks(text, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  // 空文本
  it('空文本返回空数组', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    expect(splitIntoChunks('')).toEqual([]);
    expect(splitIntoChunks('   ')).toEqual([]);
  });

  // 分块 ID 唯一性
  it('分块 ID 唯一且递增', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = '这是第一句话。这是第二句话。这是第三句话。这是第四句话。第五句话。第六句话。';
    const chunks = splitIntoChunks(text);
    const ids = chunks.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // overlap 参数
  it('overlap=100时相邻块有重叠内容', async () => {
    const { splitIntoChunks } = await import('../services/embedding.service');
    const text = 'a'.repeat(600) + 'b'.repeat(600) + 'c'.repeat(600);
    const chunks = splitIntoChunks(text, 500, 100);
    if (chunks.length >= 2) {
      expect(chunks[0].content.endsWith(chunks[1].content.slice(0, 100))).toBe(true);
    }
  });
});

describe('createEmbedding', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TC-EMB-008: 配置校验在服务启动时执行（已在 index.ts 测试）
  // 此处验证正常情况下 API Key 校验通过
  it('TC-EMB-008: 正常配置下 API Key 校验通过', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: MOCK_EMBEDDING, index: 0 }] }
      })
    });
    const { createEmbedding } = await import('../services/embedding.service');
    const result = await createEmbedding('测试');
    expect(result.success).toBe(true);
  });

  // TC-EMB-010: 空文本调用
  it('TC-EMB-010: 空文本返回错误', async () => {
    const { createEmbedding } = await import('../services/embedding.service');
    expect(await createEmbedding('')).toEqual({ success: false, error: '文本内容为空' });
    expect(await createEmbedding('   ')).toEqual({ success: false, error: '文本内容为空' });
  });

  // TC-EMB-006: API 调用成功
  it('TC-EMB-006: API调用成功返回1536维向量', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        code: 0,
        msg: 'success',
        data: {
          embeddings: [{ embedding: MOCK_EMBEDDING, index: 0 }]
        }
      })
    });

    const { createEmbedding } = await import('../services/embedding.service');
    const result = await createEmbedding('测试文本');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1536);
  });

  // TC-EMB-007: API 超时处理
  it('TC-EMB-007: 超时触发AbortError后重试2次均失败返回错误', async () => {
    // 延迟 15s > timeout 10s，模拟超时不触发
    // 但实际返回 AbortError，模拟网络中断
    mockFetch.mockImplementation(() => new Promise((_, reject) => {
      setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
    }));

    const { createEmbedding } = await import('../services/embedding.service');
    const result = await createEmbedding('超时测试');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Aborted');
    expect(result.error).toContain('Embedding 请求失败');
  });

  // 网络错误重试
  it('网络错误时重试2次', async () => {
    let attempts = 0;
    mockFetch.mockImplementation(() => {
      attempts++;
      if (attempts <= 2) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        status: 200,
        ok: true,
        json: async () => ({
          code: 0,
          data: { embeddings: [{ embedding: MOCK_EMBEDDING, index: 0 }] }
        })
      });
    });

    const { createEmbedding } = await import('../services/embedding.service');
    const result = await createEmbedding('重试测试');
    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
  });

  // HTTP 4xx/5xx 错误
  it('HTTP错误码返回错误信息', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid credentials'
    });

    const { createEmbedding } = await import('../services/embedding.service');
    const result = await createEmbedding('认证失败测试');
    expect(result.success).toBe(false);
    expect(result.error).toContain('401');
  });

  // 业务码非 0/200
  it('业务码错误返回msg', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        code: 10001,
        msg: 'invalid input'
      })
    });

    const { createEmbedding } = await import('../services/embedding.service');
    const result = await createEmbedding('错误测试');
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid input');
  });
});

describe('VectorStore', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TC-EMB-009: addDocument 后 getAllVectors 返回包含所有文档的向量数组
  it('TC-EMB-009: addDocument后getAllVectors返回正确数量的向量', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: MOCK_EMBEDDING, index: 0 }] }
      })
    });

    const { VectorStore } = await import('../services/embedding.service');
    const store = new VectorStore();

    await store.addDocument('这是测试文档。');
    const vectors = store.getAllVectors();

    expect(vectors).toHaveLength(1);
    expect(vectors[0].embedding).toHaveLength(1536);
    expect(vectors[0].content).toBe('这是测试文档。');
  });

  // TC-EMB-010: 空文本调用 addDocument
  it('TC-EMB-010: 空文本addDocument返回错误', async () => {
    const { VectorStore } = await import('../services/embedding.service');
    const store = new VectorStore();

    const result = await store.addDocument('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('文本内容为空');
  });

  // 多文档累加
  it('多次addDocument累加到存储', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: MOCK_EMBEDDING, index: 0 }] }
      })
    });

    const { VectorStore } = await import('../services/embedding.service');
    const store = new VectorStore();

    await store.addDocument('文档一。');
    await store.addDocument('文档二。');
    const vectors = store.getAllVectors();

    expect(vectors).toHaveLength(2);
  });

  // getAllVectors 返回拷贝，不影响内部状态
  it('getAllVectors返回拷贝，外部修改不影响内部', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: MOCK_EMBEDDING, index: 0 }] }
      })
    });

    const { VectorStore } = await import('../services/embedding.service');
    const store = new VectorStore();
    await store.addDocument('测试。');

    const vectors = store.getAllVectors();
    vectors.push({ id: 'hacked', content: 'hacked', embedding: [] });

    expect(store.getAllVectors()).toHaveLength(1);
  });

  // toDatabase 预留方法
  it('toDatabase方法存在（预留接口）', async () => {
    const { VectorStore } = await import('../services/embedding.service');
    const store = new VectorStore();
    expect(typeof store.toDatabase).toBe('function');
    await expect(store.toDatabase()).resolves.toBeUndefined();
  });
});
