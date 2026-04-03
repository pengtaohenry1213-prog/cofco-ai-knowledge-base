import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock retrieval service
const mockSearchTopK = vi.fn();
vi.mock('../services/retrieval.service', () => ({
  searchTopK: (...args: unknown[]) => mockSearchTopK(...args)
}));

describe('chatWithDocument', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    mockFetch.mockReset();
    vi.clearAllMocks();
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

  // TC-CHAT-003: 未上传文档时对话（检索返回空）
  it('TC-CHAT-003: 未上传文档时返回错误', async () => {
    mockSearchTopK.mockResolvedValueOnce({
      success: false,
      error: '暂无文档'
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('什么是机器学习？');

    expect(result.success).toBe(false);
    // chatWithDocument 会将检索错误转换为更友好的提示
    expect(result.error).toMatch(/暂无/);
  });

  // TC-CHAT-001: 正常 RAG 对话
  it('TC-CHAT-001: 正常 RAG 对话返回回答', async () => {
    // Mock 检索返回结果
    mockSearchTopK.mockResolvedValueOnce({
      success: true,
      chunks: ['机器学习是人工智能的一个重要分支。']
    });

    // Mock chat completion API（豆包 ARK：顶层 choices）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '机器学习是人工智能的一个分支。'
            }
          }
        ]
      })
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('什么是机器学习？');

    expect(result.success).toBe(true);
    expect(result.data?.answer).toBe('机器学习是人工智能的一个分支。');
  });

  // TC-CHAT-004: API 调用失败
  it('TC-CHAT-004: API 调用失败时返回错误', async () => {
    // Mock 检索返回结果
    mockSearchTopK.mockResolvedValueOnce({
      success: true,
      chunks: ['文档内容']
    });

    // Mock chat completion API 失败
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '服务器错误'
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('测试问题');

    expect(result.success).toBe(false);
    expect(result.error).toContain('API 请求失败');
  });

  // TC-CHAT-005: Embedding 服务不可用（检索失败）
  it('TC-CHAT-005: 检索服务不可用时返回错误', async () => {
    mockSearchTopK.mockResolvedValueOnce({
      success: false,
      error: '检索服务异常'
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('测试问题');

    expect(result.success).toBe(false);
    expect(result.error).toBe('检索服务异常');
  });

  // TC-CHAT-008: 验证响应结构
  it('TC-CHAT-008: 响应结构正确', async () => {
    mockSearchTopK.mockResolvedValueOnce({
      success: true,
      chunks: ['文档']
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '测试回答'
          }
        }]
      })
    });

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

    mockSearchTopK.mockResolvedValueOnce({
      success: true,
      chunks: ['人工智能包括机器学习、深度学习等领域']
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '人工智能是一个广泛的领域...'
            }
          }
        ]
      })
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument(longQuestion);

    expect(result.success).toBe(true);
    expect(result.data?.answer).toBeDefined();
  });

  // 直接传入文档文本测试
  it('直接传入文档文本时不调用检索', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '文档共有100个字。'
            }
          }
        ]
      })
    });

    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('文档有多少字？', '这是测试文档内容。');

    expect(result.success).toBe(true);
    expect(mockSearchTopK).not.toHaveBeenCalled();
  });

  // 字数统计问题
  it('字数统计问题直接返回答案', async () => {
    const { chatWithDocument } = await import('../services/chat.service');
    const result = await chatWithDocument('这段话有多少字？', '这是一段测试文本。');

    expect(result.success).toBe(true);
    expect(result.data?.answer).toContain('9');
  });
});
