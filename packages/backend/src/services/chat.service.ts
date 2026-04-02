import { searchTopK } from './retrieval.service';
import { chatCompletion } from './llm.service';

/** TopK 默认数量 */
const DEFAULT_TOP_K = 5;

/**
 * 构造「文档问答」系统提示 + 上下文（流式与非流式共用）
 */
export function buildDocumentQaPrompt(question: string, contextText: string): string {
  return `你是一名知识库助手。下方「文档内容」是当前知识库提供的文本（可能为全文或检索片段），请严格依据该文本作答。

规则：
1. 若问题与文档本身相关（例如字数、字符数、段落数、标题、摘要、主题、关键词、语言风格等），请根据所给文本直接统计或归纳，并给出明确结果。
2. 若问题询问文档中的事实、观点、数据，仅在文本有据可查或可合理推断时回答；否则说明无法根据现有文档回答。
3. 不要编造文本中不存在的内容。

文档内容：
${contextText}

问题：${question}`;
}

/** 是否为「统计文档字数/长度」类问题（不依赖模型，直接按上下文文本计算） */
export function isDocumentCharCountQuestion(question: string): boolean {
  const q = question.replace(/\s/g, '');
  return (
    /多少字/.test(q) ||
    /几个字/.test(q) ||
    /字数/.test(q) ||
    /字符数/.test(q) ||
    (/多长/.test(q) && /内容|文档|文章|文本|这篇|上面|该/.test(q))
  );
}

/**
 * 对字数类问题给出确定性回答（避免模型误判为「文档未写明」而拒答）
 */
export function answerDocumentCharCount(
  contextText: string,
  scope: 'full' | 'retrieval'
): string {
  const charCount = [...contextText].length;
  const scopeNote =
    scope === 'full'
      ? '统计范围：本次请求携带的完整文档正文。'
      : '统计范围：当前检索到的文档片段（若未上传或未传全文，可能仅为部分内容）。';
  return `${scopeNote}按 Unicode 字符计数，共计 ${charCount} 个字。`;
}

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
 * 2. 如果有 documentText 直接使用，否则检索 TopK 相关文本块
 * 3. 拼接 Prompt
 * 4. 调用 LLM 获取回答
 *
 * @param question - 用户问题
 * @param documentText - 直接传入的文档文本（可选）
 * @param topK - 检索数量
 * @returns ChatResult
 */
export async function chatWithDocument(
  question: string,
  documentText?: string,
  topK: number = DEFAULT_TOP_K
): Promise<ChatResult> {
  // 1. 验证问题非空
  if (!question || question.trim().length === 0) {
    return {
      success: false,
      error: '问题不能为空'
    };
  }

  let relevantChunks: string[] = [];

  // 2. 获取相关文档内容
  if (documentText && documentText.trim().length > 0) {
    // 直接使用传入的文档文本
    relevantChunks = [documentText.trim()];
  } else {
    // 从向量库检索
    const retrievalResult = await searchTopK(question, topK);

    if (!retrievalResult.success) {
      return {
        success: false,
        error: retrievalResult.error || '检索失败'
      };
    }

    relevantChunks = retrievalResult.chunks || [];
  }

  // 无相关文档时返回提示
  if (relevantChunks.length === 0) {
    return {
      success: false,
      error: '暂无相关文档，请尝试其他问题或上传更多文档'
    };
  }

  // 3. 拼接 Prompt
  const contextText = relevantChunks.join('\n\n');
  const scope: 'full' | 'retrieval' =
    documentText && documentText.trim().length > 0 ? 'full' : 'retrieval';
  if (isDocumentCharCountQuestion(question)) {
    return {
      success: true,
      data: { answer: answerDocumentCharCount(contextText, scope) }
    };
  }

  const prompt = buildDocumentQaPrompt(question, contextText);

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
