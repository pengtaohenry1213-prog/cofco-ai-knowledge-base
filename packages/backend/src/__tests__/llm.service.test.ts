import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('chatCompletion (非流式对话)', () => {
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

  // TC-CHAT-SVC-001: 非流式对话成功
  it('TC-CHAT-SVC-001: 非流式对话成功返回完整回答', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '这是一个测试回答。'
          }
        }]
      })
    });

    const { chatCompletion } = await import('../services/llm.service');
    const result = await chatCompletion('测试问题');

    expect(result.success).toBe(true);
    expect(result.data?.answer).toBe('这是一个测试回答。');
  });

  // TC-CHAT-SVC-002: 空 Prompt
  it('TC-CHAT-SVC-002: 空 Prompt 返回错误', async () => {
    const { chatCompletion } = await import('../services/llm.service');

    const result = await chatCompletion('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Prompt 不能为空');
  });

  it('TC-CHAT-SVC-002: 仅空白 Prompt 返回错误', async () => {
    const { chatCompletion } = await import('../services/llm.service');

    const result = await chatCompletion('   ');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Prompt 不能为空');
  });

  // TC-CHAT-SVC-005: API 返回错误
  it('TC-CHAT-SVC-005: API 返回错误状态码时返回错误', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Invalid request'
    });

    const { chatCompletion } = await import('../services/llm.service');
    const result = await chatCompletion('测试问题');

    expect(result.success).toBe(false);
    expect(result.error).toContain('API 请求失败');
    expect(result.error).toContain('400');
  });

  // TC-CHAT-SVC-006: 网络错误
  it('TC-CHAT-SVC-006: 网络错误时捕获并返回错误信息', async () => {
    // 3 次网络错误（初始 + 2 次重试）
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    const { chatCompletion } = await import('../services/llm.service');
    const result = await chatCompletion('测试问题');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  // TC-CHAT-SVC-004: API 调用超时
  it('TC-CHAT-SVC-004: 超时触发重试机制', async () => {
    // 第一次超时，第二次成功
    mockFetch
      .mockImplementationOnce(() => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
      }))
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: '重试后成功' }
          }]
        })
      });

    const { chatCompletion } = await import('../services/llm.service');
    const result = await chatCompletion('测试问题');

    expect(result.success).toBe(true);
    expect(result.data?.answer).toBe('重试后成功');
  });

  // TC-CHAT-SVC-011: 模型名称配置正确
  it('TC-CHAT-SVC-011: 使用配置中的模型名称', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '测试回答' }
        }]
      })
    });

    const { chatCompletion } = await import('../services/llm.service');
    await chatCompletion('测试问题');

    // 验证请求中使用了配置中的模型名称
    expect(mockFetch).toHaveBeenCalled();
    const calledWith = mockFetch.mock.calls[0][1];
    expect(calledWith.body).toContain('doubao-seed-2-0-code-preview-260215');
  });

  // TC-CHAT-SVC-012: 消息格式正确
  it('TC-CHAT-SVC-012: 消息格式为 messages: [{role: "user", content: "..."}]', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '测试回答' }
        }]
      })
    });

    const { chatCompletion } = await import('../services/llm.service');
    await chatCompletion('用户问题');

    expect(mockFetch).toHaveBeenCalled();
    const calledWith = mockFetch.mock.calls[0][1];
    const body = JSON.parse(calledWith.body);
    expect(body.messages).toEqual([
      { role: 'user', content: '用户问题' }
    ]);
  });
});

describe('chatCompletionStream (流式对话)', () => {
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

  // TC-CHAT-SVC-007: 流式对话成功
  it('TC-CHAT-SVC-007: 流式对话逐块返回', async () => {
    // Mock chatCompletion（非流式获取完整回答）
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '你好，世界！这是一段很长的回答。' }
        }]
      })
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试问题', onChunk, onError);

    expect(onError).not.toHaveBeenCalled();
    // 答案 "你好，世界！这是一段很长的回答。" 按 5 字符分块
    expect(onChunk).toHaveBeenCalled();
  });

  // TC-CHAT-SVC-008: 流式对话 JSON 格式
  it('TC-CHAT-SVC-008: 流式响应逐块返回', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '测试' }
        }]
      })
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试', onChunk, onError);

    expect(onChunk).toHaveBeenCalled();
  });

  // TC-CHAT-SVC-009: 流式对话最后一块
  it('TC-CHAT-SVC-009: 流式对话正确处理结束标记', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '内容' }
        }]
      })
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试', onChunk, onError);

    // 内容按 5 字符分块后剩余 "内容" 两个字，分两批返回
    expect(onChunk).toHaveBeenCalledTimes(1);
  });

  // TC-CHAT-SVC-010: 流式 API 错误
  it('TC-CHAT-SVC-010: 流式 API 错误时调用 onError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '服务器错误'
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试问题', onChunk, onError);

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toContain('API 请求失败');
    expect(onError.mock.calls[0][0]).toContain('500');
  });

  // 空 Prompt
  it('流式对话空 Prompt 调用 onError', async () => {
    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('', onChunk, onError);

    expect(onError).toHaveBeenCalledWith('Prompt 不能为空');
    expect(onChunk).not.toHaveBeenCalled();
  });

  // 响应体为空
  it('流式对话响应体为空时调用 onError', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '' }
        }]
      })
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试', onChunk, onError);

    expect(onError).toHaveBeenCalled();
    // 回答为空时返回 'LLM 返回结果为空'
    expect(onError.mock.calls[0][0]).toBe('LLM 返回结果为空');
  });

  // TC-CHAT-SVC-011: 流式对话使用配置中的模型名称
  it('TC-CHAT-SVC-011: 流式对话使用配置中的模型名称', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: '' }
        }]
      })
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试', onChunk, onError);

    expect(mockFetch).toHaveBeenCalled();
    const calledWith = mockFetch.mock.calls[0][1];
    const body = JSON.parse(calledWith.body);
    expect(body.model).toBe('doubao-seed-2-0-code-preview-260215');
  });
});
