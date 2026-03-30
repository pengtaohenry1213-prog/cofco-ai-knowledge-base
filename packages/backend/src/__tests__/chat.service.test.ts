import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('chatWithDocument', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // TC-CHAT-002: 发送空问题
  it('TC-CHAT-002: 发送空问题时返回错误', async () => {
    const { chatWithDocument } = await import('../services/chat.service');

    const result = await chatWithDocument('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('问题不能为空');
  });

  it('TC-CHAT-002: 发送纯空白问题时返回错误', async () => {
    const { chatWithDocument } = await import('../services/chat.service');

    const result = await chatWithDocument('   ');

    expect(result.success).toBe(false);
    expect(result.error).toBe('问题不能为空');
  });

  // TC-CHAT-003: 未上传文档时对话
  it('TC-CHAT-003: 未上传文档时返回错误', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], index: 0 }] }
      })
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('什么是机器学习？');

    expect(result.success).toBe(false);
    expect(result.error).toBe('暂无文档');
  });

  // TC-CHAT-001: 正常 RAG 对话
  it('TC-CHAT-001: 正常 RAG 对话返回回答', async () => {
    // Mock embedding API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9], index: 0 }] }
      })
    });

    // Mock chat completion API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          choices: [{
            message: {
              content: '机器学习是人工智能的一个分支。'
            }
          }]
        }
      })
    });

    const { vectorStore } = await import('../services/embedding.service');
    vi.spyOn(vectorStore, 'getAllVectors').mockReturnValue([
      { id: 'chunk-0', content: '机器学习是人工智能的一个重要分支。', embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] }
    ]);

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('什么是机器学习？');

    expect(result.success).toBe(true);
    expect(result.data?.answer).toBe('机器学习是人工智能的一个分支。');
  });

  // TC-CHAT-004: API 调用失败
  it('TC-CHAT-004: API 调用失败时返回错误', async () => {
    // Mock embedding API 成功
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9], index: 0 }] }
      })
    });

    // Mock chat completion API 失败
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '服务器错误'
    });

    const { vectorStore } = await import('../services/embedding.service');
    vi.spyOn(vectorStore, 'getAllVectors').mockReturnValue([
      { id: 'chunk-0', content: '文档内容', embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] }
    ]);

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('测试问题');

    expect(result.success).toBe(false);
    expect(result.error).toContain('API 请求失败');
  });

  // TC-CHAT-005: Embedding 服务不可用
  it('TC-CHAT-005: Embedding 服务不可用时返回错误', async () => {
    // Mock embedding API 返回错误
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 10001,
        msg: 'invalid request'
      })
    });

    const { vectorStore } = await import('../services/embedding.service');
    vi.spyOn(vectorStore, 'getAllVectors').mockReturnValue([
      { id: 'chunk-0', content: '文档内容', embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] }
    ]);

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('测试问题');

    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid request');
  });

  // TC-CHAT-008: 验证响应结构
  it('TC-CHAT-008: 响应结构正确', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9], index: 0 }] }
      })
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          choices: [{
            message: {
              content: '测试回答'
            }
          }]
        }
      })
    });

    const { vectorStore } = await import('../services/embedding.service');
    vi.spyOn(vectorStore, 'getAllVectors').mockReturnValue([
      { id: 'chunk-0', content: '文档', embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] }
    ]);

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('测试');

    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    if (result.success) {
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('answer');
      expect(typeof result.data?.answer).toBe('string');
    } else {
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    }
  });

  // TC-CHAT-010: 长文本问题处理
  it('TC-CHAT-010: 长文本问题正确处理', async () => {
    const longQuestion = '请详细解释一下什么是人工智能，它包括哪些主要领域，这些领域各自的特点是什么，以及它们之间有什么联系和区别？';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: { embeddings: [{ embedding: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9], index: 0 }] }
      })
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          choices: [{
            message: {
              content: '人工智能是一个广泛的领域...'
            }
          }]
        }
      })
    });

    const { vectorStore } = await import('../services/embedding.service');
    vi.spyOn(vectorStore, 'getAllVectors').mockReturnValue([
      { id: 'chunk-0', content: '人工智能包括机器学习、深度学习等领域', embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] }
    ]);

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument(longQuestion);

    expect(result.success).toBe(true);
    expect(result.data?.answer).toBeDefined();
  });
});
