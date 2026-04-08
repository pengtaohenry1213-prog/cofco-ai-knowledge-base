/**
 * LLM 对话服务
 * 调用豆包对话 API 生成回答
 */
import { config } from '../config';

/** 对话 API 请求参数 */
export interface ChatRequest {
  prompt: string;
  stream?: boolean;
}

/** 对话 API 响应 */
export interface ChatResponse {
  success: boolean;
  data?: {
    answer: string;
  };
  error?: string;
}

/** 流式响应块 */
export interface StreamChunk {
  chunk: string;
  finish: boolean;
}

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
  id?: string;
  code?: number;
  msg?: string;
  choices?: Array<{
    finish_reason?: string;
    index?: number;
    message?: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
  }>;
  created?: number;
  model?: string;
  object?: string;
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
}

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
  if (!prompt || prompt.trim().length === 0) {
    return { success: false, error: 'Prompt 不能为空' };
  }

  const endpoint = `${config.doubao.baseUrl}/chat/completions`;
  console.log(`[LLM] 请求豆包 API: ${endpoint}`);
  console.log(`[LLM] 模型: ${config.doubao.model}`);
  console.log(`[LLM] Prompt 前100字: "${prompt.slice(0, 100)}..."`);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const requestBody: DoubaoChatRequest = {
        model: config.doubao.model,
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
          'Authorization': `Bearer ${config.doubao.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.log(`[LLM] ✗ HTTP 错误: ${response.status} ${response.statusText} - ${errorBody}`);
        return {
          success: false,
          error: `API 请求失败: ${response.status} ${response.statusText} ${errorBody}`.trim()
        };
      }

      const data = await response.json() as DoubaoChatResponse;
      console.log(`[LLM] 响应 code=${data.code}，choices=${data.choices?.length}，content="${data.choices?.[0]?.message?.content?.slice(0, 80)}..."`);
      console.log(`[LLM] 响应 reasoning_content="${data.choices?.[0]?.message?.reasoning_content?.slice(0, 80)}..."`);

      // 豆包 ARK API 返回的响应没有 code 字段，需要检查 choices 是否存在
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0].message;
        const answer = choice?.content || choice?.reasoning_content || '';
        if (answer) {
          console.log(`[LLM] ✓ 成功获取回答，长度=${answer.length}`);
          return { success: true, data: { answer } };
        }
        console.log(`[LLM] ✗ answer 为空`);
        return { success: false, error: 'LLM 返回结果为空' };
      }
      
      // 火山引擎 MaaS API 可能有 code 字段
      if (data.code !== 0 && data.code !== 200) {
        console.log(`[LLM] ✗ API error: code=${data.code}, msg=${data.msg}`);
        return {
          success: false,
          error: data.msg || 'LLM API 返回错误'
        };
      }

      console.log(`[LLM] ✗ choices 不存在或为空`);
      return { success: false, error: 'LLM 返回结果为空' };
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
 * 注意：Seed 模型流式过程只返回 reasoning_content（思考过程），
 * 真正回答在非流式响应中。为了提供更好的体验，
 * 我们先调用非流式获取完整回答，再模拟流式返回。
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
  if (!prompt || prompt.trim().length === 0) {
    onError('Prompt 不能为空');
    return;
  }

  console.group('流式对话服务 - chatCompletionStream （调用豆包流式对话 API，逐块处理响应）');
  console.log('prompt', prompt);
  

  try {
    // 先调用非流式获取完整回答
    const result = await chatCompletion(prompt);
    if (!result.success || !result.data) {
      onError(result.error || '获取回答失败');
      return;
    }

    console.log('chatCompletion 结果: ', result);

    // 模拟流式返回（逐字返回）
    const answer = result.data.answer;
    const chunkSize = 5; // 每批返回5个字符
    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.slice(i, i + chunkSize);
      onChunk(chunk);
      // 小延迟让前端能实时看到打字效果
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    onError(`流式请求失败: ${errorMessage}`);
  }
  finally {
    console.log('流式对话服务 - chatCompletionStream 结束');
    console.groupEnd();
  }

}
