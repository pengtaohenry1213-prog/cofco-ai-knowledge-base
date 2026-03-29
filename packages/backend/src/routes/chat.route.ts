import { Router, Request, Response } from 'express';
import { chatWithDocument } from '../services/chat.service';
import { searchTopK } from '../services/retrieval.service';
import { chatCompletionStream } from '../services/llm.service';
import { setupStreamResponse, sendStreamError } from '../utils/streamResponse';

/** TopK 默认数量 */
const DEFAULT_TOP_K = 5;

/** 聊天请求参数 */
interface ChatRequestBody {
  question: string;
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
  const { question } = req.body as ChatRequestBody;

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
    const result = await chatWithDocument(question.trim());

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
 */
router.post('/stream', async (req: Request, res: Response) => {
  const { question } = req.body as ChatRequestBody;

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
    // 1. 检索相关文档
    const retrievalResult = await searchTopK(trimmedQuestion, DEFAULT_TOP_K);

    if (!retrievalResult.success) {
      sendStreamError(res, retrievalResult.error || '检索失败');
      return;
    }

    const relevantChunks = retrievalResult.data || [];

    // 无相关文档时返回提示
    if (relevantChunks.length === 0) {
      sendStreamError(res, '暂无相关文档，请尝试其他问题或上传更多文档');
      return;
    }

    // 2. 拼接 Prompt
    const contextText = relevantChunks.join('\n\n');
    const prompt = `基于以下文档内容回答问题。如果文档中没有相关信息，请说明无法根据现有文档回答该问题。

文档内容：
${contextText}

问题：${trimmedQuestion}`;

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
