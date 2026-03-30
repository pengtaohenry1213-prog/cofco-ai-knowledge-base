/**
 * Prompt 拼接服务
 * 将检索到的文档块与用户问题拼接成最终 Prompt
 */

/** Prompt 拼接结果 */
export interface PromptResult {
  success: boolean;
  prompt?: string;
  error?: string;
}

/** 默认 Prompt 模板 */
const DEFAULT_PROMPT_TEMPLATE = `基于以下文档内容回答问题：
{context}

问题：{question}`;

/**
 * 拼接用户问题与检索到的文档块，生成最终 Prompt
 *
 * @param question - 用户提问
 * @param chunks - 检索到的相关文档块数组
 * @param template - Prompt 模板（可选）
 * @returns PromptResult
 */
export function buildPrompt(
  question: string,
  chunks: string[],
  template: string = DEFAULT_PROMPT_TEMPLATE
): PromptResult {
  // 验证问题
  if (!question || question.trim().length === 0) {
    return {
      success: false,
      error: '问题不能为空'
    };
  }

  // 验证文档块
  if (!chunks || chunks.length === 0) {
    return {
      success: false,
      error: '检索结果为空，无法回答问题'
    };
  }

  // 过滤空字符串
  const validChunks = chunks.filter((chunk) => chunk && chunk.trim().length > 0);
  if (validChunks.length === 0) {
    return {
      success: false,
      error: '检索结果为空，无法回答问题'
    };
  }

  // 用换行符拼接文档块
  const context = validChunks.join('\n');

  // 替换模板中的占位符
  const prompt = template
    .replace('{context}', context)
    .replace('{question}', question.trim());

  return {
    success: true,
    prompt
  };
}

/**
 * 验证 Prompt 格式
 *
 * @param prompt - 待验证的 Prompt
 * @returns 是否包含必要内容
 */
export function validatePromptFormat(prompt: string): {
  hasContext: boolean;
  hasQuestion: boolean;
} {
  return {
    hasContext: prompt.includes('文档') || prompt.includes('context'),
    hasQuestion: prompt.includes('问题') || prompt.includes('question')
  };
}
