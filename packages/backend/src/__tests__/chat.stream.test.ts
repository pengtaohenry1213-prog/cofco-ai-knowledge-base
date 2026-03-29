import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupStreamResponse, sendStreamError, StreamWriter } from '../utils/streamResponse';
import { Response } from 'express';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('chatCompletionStream', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DOUBAO_API_KEY = 'test-api-key';
    process.env.DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // TC-STREAM-109: API 返回错误
  it('TC-STREAM-109: API Key 未配置时调用 onError', async () => {
    delete process.env.DOUBAO_API_KEY;

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('测试问题', onChunk, onError);

    expect(onError).toHaveBeenCalledWith('API Key 未配置');
    expect(onChunk).not.toHaveBeenCalled();
  });

  // TC-STREAM-107: 空 Prompt 校验
  it('TC-STREAM-107: 发送空 Prompt 时调用 onError', async () => {
    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('', onChunk, onError);

    expect(onError).toHaveBeenCalledWith('Prompt 不能为空');
    expect(onChunk).not.toHaveBeenCalled();
  });

  // TC-STREAM-109: API 返回非 200 状态码
  it('TC-STREAM-109: API 返回错误状态码时调用 onError', async () => {
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

  // TC-STREAM-101: 正常流式对话
  it('TC-STREAM-101: 正常流式对话调用 onChunk', async () => {
    // 模拟流式响应
    const stream = new ReadableStream({
      start(controller) {
        // 发送第一块数据
        controller.enqueue(new TextEncoder().encode('data: {"data":{"choices":[{"delta":{"content":"你好"}}]}}\n'));
        // 发送第二块数据
        controller.enqueue(new TextEncoder().encode('data: {"data":{"choices":[{"delta":{"content":"，世界"}}]}}\n'));
        // 发送结束标记
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n'));
        controller.close();
      }
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream
    });

    const onChunk = vi.fn();
    const onError = vi.fn();

    const { chatCompletionStream } = await import('../services/llm.service');
    await chatCompletionStream('你好', onChunk, onError);

    expect(onError).not.toHaveBeenCalled();
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenNthCalledWith(1, '你好');
    expect(onChunk).toHaveBeenNthCalledWith(2, '，世界');
  });
});

describe('setupStreamResponse', () => {
  it('TC-STREAM-102/103/104: 设置正确的响应头', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
      writableEnded: false,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    const stream = setupStreamResponse(mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Transfer-Encoding', 'chunked');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    expect(mockRes.flushHeaders).toHaveBeenCalled();
  });

  it('TC-STREAM-105: JSON Line 格式验证', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
      writableEnded: false,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    const stream = setupStreamResponse(mockRes);

    // 写入数据块
    stream.writeChunk('你好', false);
    stream.writeChunk('，世界', true);

    expect(mockRes.write).toHaveBeenCalledTimes(2);
    expect(mockRes.write).toHaveBeenNthCalledWith(1, '{"chunk":"你好","finish":false}\n');
    expect(mockRes.write).toHaveBeenNthCalledWith(2, '{"chunk":"，世界","finish":true}\n');
  });

  it('TC-STREAM-106: 最后一行 finish=true', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
      writableEnded: false,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    const stream = setupStreamResponse(mockRes);

    stream.writeChunk('', true);

    expect(mockRes.write).toHaveBeenCalledWith('{"chunk":"","finish":true}\n');
  });

  it('TC-STREAM-108: 客户端断开时不写入', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
      writableEnded: true,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    const stream = setupStreamResponse(mockRes);

    stream.writeChunk('测试', false);

    expect(mockRes.write).not.toHaveBeenCalled();
  });

  it('监听连接关闭事件', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
      writableEnded: false,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    const onClose = vi.fn();
    setupStreamResponse(mockRes, onClose);

    expect(mockRes.on).toHaveBeenCalledWith('close', onClose);
  });
});

describe('sendStreamError', () => {
  it('发送错误信息并结束流', () => {
    const mockRes = {
      writableEnded: false,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    sendStreamError(mockRes, '测试错误');

    expect(mockRes.write).toHaveBeenCalledWith('{"error":"测试错误","finish":true}\n');
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('writableEnded 为 true 时不发送', () => {
    const mockRes = {
      writableEnded: true,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    sendStreamError(mockRes, '测试错误');

    expect(mockRes.write).not.toHaveBeenCalled();
    expect(mockRes.end).not.toHaveBeenCalled();
  });
});

describe('streamResponse.ts - 工具函数', () => {
  it('StreamWriter 接口正确实现', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
      writableEnded: false,
      write: vi.fn(),
      end: vi.fn()
    } as unknown as Response;

    const stream: StreamWriter = setupStreamResponse(mockRes);

    // 验证接口
    expect(typeof stream.writeChunk).toBe('function');
    expect(typeof stream.close).toBe('function');

    // 测试 close 方法
    stream.close();
    expect(mockRes.end).toHaveBeenCalled();
  });
});
