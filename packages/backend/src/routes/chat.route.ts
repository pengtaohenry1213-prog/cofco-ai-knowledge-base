import { Router, Request, Response } from 'express';
import {
  chatWithDocument,
  buildDocumentQaPrompt,
  isDocumentCharCountQuestion,
  answerDocumentCharCount
} from '../services/chat.service';
import { searchTopK } from '../services/retrieval.service';
import { chatCompletionStream } from '../services/llm.service';
import { setupStreamResponse, sendStreamError } from '../utils/streamResponse';

/** TopK 默认数量 */
const DEFAULT_TOP_K = 5;

/** 聊天请求参数 */
interface ChatRequestBody {
  question: string;
  documentText?: string; // 可选：直接传入文档文本（当无法使用 embedding 时）
  knowledgeBaseId?: string; // 可选：指定知识库 ID 进行检索
}

/** 聊天响应类型 */
interface ChatResponse {
  success: boolean;
  data?: { answer: string };
  error?: string | null;
}

const router = Router();

/**
 * POST /api/chat/normal
 * 文档对话接口（非流式）
 * 完整的 RAG 流程：问题 → embedding → 检索 → Prompt → LLM → 回答
 */
router.post('/normal', async (req: Request, res: Response) => {
  const { question, documentText } = req.body as ChatRequestBody;

  // 验证问题参数
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    const response: ChatResponse = {
      success: false,
      data: undefined,
      error: '问题不能为空'
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await chatWithDocument(question.trim(), documentText);

    if (result.success) {
      const response: ChatResponse = {
        success: true,
        data: result.data,
        error: null
      };
      res.json(response);
    } else {
      const response: ChatResponse = {
        success: false,
        data: undefined,
        error: result.error || '对话失败'
      };
      res.status(400).json(response);
    }
  } catch (error) {
    const response: ChatResponse = {
      success: false,
      data: undefined,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/chat/stream
 * 文档对话接口（流式）
 * 将 LLM 的流式响应逐行推送给前端
 * 支持三种模式：
 * 1. documentText 模式：直接使用传入的文档文本
 * 2. knowledgeBaseId 模式：从指定知识库的向量库检索
 * 3. 向量检索模式：从所有向量库检索（向后兼容）
 */
router.post('/stream', async (req: Request, res: Response) => {
  const { question, documentText, knowledgeBaseId } = req.body as ChatRequestBody;

  // 验证问题参数
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: '问题不能为空'
    });
    return;
  }

  const trimmedQuestion = question.trim();

  // 设置流式响应
  const stream = setupStreamResponse(res, () => {
    // 客户端断开连接时的清理逻辑
  });

  try {
    let relevantChunks: string[] = [];

    // 如果传入了文档文本，直接使用
    if (documentText && documentText.trim().length > 0) {
      relevantChunks = [documentText.trim()];
      console.log(`[Chat/Stream] ✓ 使用传入的 documentText，长度=${documentText.length}`);
    } else {
      // 从知识库向量库检索或从所有向量库检索
      console.log(`[Chat/Stream] 走向量检索模式${knowledgeBaseId ? `，知识库=${knowledgeBaseId}` : '（全库）'}`);
      const retrievalResult = await searchTopK(trimmedQuestion, DEFAULT_TOP_K, knowledgeBaseId);

      if (!retrievalResult.success) {
        console.log(`[Chat/Stream] ✗ 检索失败: ${retrievalResult.error}`);
        sendStreamError(res, retrievalResult.error || '检索失败');
        return;
      }

      relevantChunks = retrievalResult.chunks || [];
      console.log(`[Chat/Stream] 检索到 ${relevantChunks.length} 个相关片段`);
    }

    // 无相关文档时返回提示
    if (relevantChunks.length === 0) {
      console.log(`[Chat/Stream] ✗ 无相关文档`);
      sendStreamError(res, '暂无文档，请先上传文档');
      return;
    }

    // 2. 拼接 Prompt
    const contextText = relevantChunks.join('\n\n');
    const scope: 'full' | 'retrieval' =
      documentText && documentText.trim().length > 0 ? 'full' : 'retrieval';
    
    console.log(`[Chat/Stream] contextText 长度=${contextText.length}，scope=${scope}`);

    if (isDocumentCharCountQuestion(trimmedQuestion)) {
      const text = answerDocumentCharCount(contextText, scope);
      stream.writeChunk(text, false);
      stream.writeChunk('', true);
      stream.close();
      return;
    }

    const prompt = buildDocumentQaPrompt(trimmedQuestion, contextText);

    // 3. 调用流式 LLM 服务
    await chatCompletionStream(
      prompt,
      // onChunk: 逐块发送
      (chunk) => {
        stream.writeChunk(chunk, false);
      },
      // onError: 发生错误时发送错误信息并结束
      (error) => {
        sendStreamError(res, error);
      }
    );

    // 流正常结束时发送 finish
    stream.writeChunk('', true);
    stream.close();
  } catch (error) {
    sendStreamError(res, error instanceof Error ? error.message : '服务器内部错误');
  }
});

export default router;
