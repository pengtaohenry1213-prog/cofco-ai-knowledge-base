/**
 * 历史对话路由
 */

import { Router, Request, Response } from 'express';
import { historyService } from '../services/history.service';
import type { CreateHistoryDto, HistoryResponse, HistoryItem } from '../types/history.types';

const router = Router();

/**
 * POST /api/history
 * 新增对话
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body as CreateHistoryDto;

    if (!question || typeof question !== 'string') {
      const response: HistoryResponse = {
        success: false,
        data: null,
        error: 'question 为必填参数'
      };
      res.status(400).json(response);
      return;
    }

    if (!answer || typeof answer !== 'string') {
      const response: HistoryResponse = {
        success: false,
        data: null,
        error: 'answer 为必填参数'
      };
      res.status(400).json(response);
      return;
    }

    const item = historyService.create({ question, answer });

    const response: HistoryResponse = {
      success: true,
      data: {
        id: item.id,
        createTime: item.createTime
      },
      error: null
    };
    res.status(201).json(response);
  } catch (error) {
    const response: HistoryResponse = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/history
 * 查询所有历史对话
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const list = historyService.findAll();

    const response: HistoryResponse = {
      success: true,
      data: list,
      error: null
    };
    res.json(response);
  } catch (error) {
    const response: HistoryResponse = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/history/:id
 * 根据 ID 查询单条对话
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = historyService.findById(id);

    if (!item) {
      const response: HistoryResponse = {
        success: false,
        data: null,
        error: '记录不存在'
      };
      res.status(404).json(response);
      return;
    }

    const response: HistoryResponse = {
      success: true,
      data: item,
      error: null
    };
    res.json(response);
  } catch (error) {
    const response: HistoryResponse = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/history
 * 清空所有历史对话
 */
router.delete('/', (_req: Request, res: Response) => {
  try {
    historyService.clearAll();

    const response: HistoryResponse = {
      success: true,
      data: null,
      error: null
    };
    res.json(response);
  } catch (error) {
    const response: HistoryResponse = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/history/:id
 * 删除单条对话
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = historyService.deleteById(id);

    if (!deleted) {
      const response: HistoryResponse = {
        success: false,
        data: null,
        error: '记录不存在'
      };
      res.status(404).json(response);
      return;
    }

    const response: HistoryResponse = {
      success: true,
      data: null,
      error: null
    };
    res.json(response);
  } catch (error) {
    const response: HistoryResponse = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
    res.status(500).json(response);
  }
});

export default router;
