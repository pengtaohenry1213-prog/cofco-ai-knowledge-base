import { Response } from 'express';

/** 流式响应写入器接口 */
export interface StreamWriter {
  writeChunk: (chunk: string, finish: boolean) => void;
  close: () => void;
}

/**
 * 设置流式响应环境
 * 配置 SSE 响应头并返回写入器
 *
 * @param res - Express Response 对象
 * @param onClose - 连接关闭时的回调（用于资源释放）
 * @returns StreamWriter 写入器
 */
export function setupStreamResponse(
  res: Response,
  onClose?: () => void
): StreamWriter {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 刷新响应头
  res.flushHeaders();

  // 监听请求关闭事件，释放资源
  if (onClose) {
    res.on('close', onClose);
  }

  /**
   * 写入一个数据块
   * @param chunk - 文本片段
   * @param finish - 是否为最后一个数据块
   */
  function writeChunk(chunk: string, finish: boolean): void {
    if (res.writableEnded) {
      return;
    }

    const data = JSON.stringify({ chunk, finish });
    res.write(`${data}\n`);
  }

  /**
   * 关闭流
   */
  function close(): void {
    if (!res.writableEnded) {
      res.end();
    }
  }

  return { writeChunk, close };
}

/**
 * 发送错误信息到流
 *
 * @param res - Express Response 对象
 * @param error - 错误信息
 */
export function sendStreamError(res: Response, error: string): void {
  if (res.writableEnded) {
    return;
  }

  const data = JSON.stringify({ error, finish: true });
  res.write(`${data}\n`);
  res.end();
}
