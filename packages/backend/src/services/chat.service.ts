import { searchTopK } from './retrieval.service';
import { chatCompletion } from './llm.service';

/** TopK 默认数量 */
const DEFAULT_TOP_K = 5;

/** 聊天服务结果 */
export interface ChatResult {
  success: boolean;
  data?: { answer: string };
  error?: string;
}

/**
 * 文档对话（非流式）
 * 完整的 RAG 流程：
 * 1. 验证问题非空
 * 2. 检索 TopK 相关文本块
 * 3. 拼接 Prompt
 * 4. 调用 LLM 获取回答
 *
 * @param question - 用户问题
 * @returns ChatResult
 */
export async function chatWithDocument(
  question: string,
  topK: number = DEFAULT_TOP_K
): Promise<ChatResult> {
  // 1. 验证问题非空
  if (!question || question.trim().length === 0) {
    return {
      success: false,
      error: '问题不能为空'
    };
  }

  // 2. 检索 TopK 相关文本块
  const retrievalResult = await searchTopK(question, topK);

  if (!retrievalResult.success) {
    return {
      success: false,
      error: retrievalResult.error || '检索失败'
    };
  }

  const relevantChunks = retrievalResult.data || [];

  // 无相关文档时返回提示
  if (relevantChunks.length === 0) {
    return {
      success: false,
      error: '暂无相关文档，请尝试其他问题或上传更多文档'
    };
  }

  // 3. 拼接 Prompt
  const contextText = relevantChunks.join('\n\n');
  const prompt = `基于以下文档内容回答问题。如果文档中没有相关信息，请说明无法根据现有文档回答该问题。

文档内容：
${contextText}

问题：${question}`;

  // 4. 调用 LLM 获取回答
  const llmResult = await chatCompletion(prompt);

  if (!llmResult.success) {
    return {
      success: false,
      error: llmResult.error || 'LLM 调用失败'
    };
  }

  return {
    success: true,
    data: { answer: llmResult.data!.answer }
  };
}
