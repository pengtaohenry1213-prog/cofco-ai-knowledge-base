import { Router, Request, Response } from 'express';
import { chatWithDocument } from '../services/chat.service';

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

export default router;
