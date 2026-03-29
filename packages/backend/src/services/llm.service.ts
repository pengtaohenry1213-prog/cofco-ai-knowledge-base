/**
 * LLM 对话服务
 * 调用豆包对话 API 生成回答
 */

/** LLM API 调用结果 */
export interface LLMResult {
  success: boolean;
  data?: { answer: string };
  error?: string;
}

/** 豆包对话 API 请求参数 */
interface DoubaoChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

/** 豆包对话 API 响应结构 */
interface DoubaoChatResponse {
  code: number;
  msg: string;
  data?: {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };
}

/** 豆包 API Key（从环境变量读取） */
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '';
/** 豆包 API 基础地址 */
const DOUBAO_BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';

/** API 超时时间（ms） */
const API_TIMEOUT_MS = 30_000;

/** 最大重试次数 */
const MAX_RETRIES = 2;

/**
 * 调用豆包对话 API，生成回答
 *
 * @param prompt - 构造好的 Prompt（包含上下文和问题）
 * @returns LLMResult
 */
export async function chatCompletion(prompt: string): Promise<LLMResult> {
  if (!DOUBAO_API_KEY) {
    return { success: false, error: 'API Key 未配置' };
  }

  if (!prompt || prompt.trim().length === 0) {
    return { success: false, error: 'Prompt 不能为空' };
  }

  const endpoint = `${DOUBAO_BASE_URL}/chat/completions`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const requestBody: DoubaoChatRequest = {
        model: 'doubao-pro-32k',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        body: JSON.stringify(requestBody),
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

      const data = (await response.json()) as DoubaoChatResponse;

      if (data.code !== 0 && data.code !== 200) {
        return {
          success: false,
          error: data.msg || 'LLM API 返回错误'
        };
      }

      const answer = data.data?.choices?.[0]?.message?.content;
      if (!answer) {
        return { success: false, error: 'LLM 返回结果为空' };
      }

      return { success: true, data: { answer } };
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
    error: `LLM 请求失败: ${lastError?.message || '未知错误'}`
  };
}

/** 豆包流式对话 API 请求参数 */
interface DoubaoStreamRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream: boolean;
}

/**
 * 调用豆包流式对话 API，逐块处理响应
 *
 * @param prompt - 构造好的 Prompt
 * @param onChunk - 每块数据回调 (chunk: string) => void
 * @param onError - 错误回调 (error: string) => void
 * @returns Promise<void>
 */
export async function chatCompletionStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void
): Promise<void> {
  if (!DOUBAO_API_KEY) {
    onError('API Key 未配置');
    return;
  }

  if (!prompt || prompt.trim().length === 0) {
    onError('Prompt 不能为空');
    return;
  }

  const endpoint = `${DOUBAO_BASE_URL}/chat/completions`;

  try {
    const requestBody: DoubaoStreamRequest = {
      model: 'doubao-pro-32k',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      onError(`API 请求失败: ${response.status} ${response.statusText} ${errorBody}`.trim());
      return;
    }

    if (!response.body) {
      onError('响应体为空');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data:')) {
            continue;
          }

          const dataStr = trimmedLine.slice(5).trim();

          // 跳过 [DONE] 标记
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            const content = data.data?.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // 忽略解析错误，继续处理下一行
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    onError(`流式请求失败: ${errorMessage}`);
  }
}
