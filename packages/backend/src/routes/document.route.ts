import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { fileService } from '../services/file.service';
import { vectorStore } from '../services/embedding.service';
import { documentService } from '../services/document.service';
import {
  DocumentUploadResponse,
  DocumentListResponse,
  AddToKnowledgeBasesRequest
} from '../types/document.types';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  FILE_ERROR_MESSAGES
} from '../types/file.types';

const router = Router();

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

/**
 * POST /api/documents/upload
 * 上传文档并关联到指定知识库
 */
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        const response: DocumentUploadResponse = {
          success: false,
          error: FILE_ERROR_MESSAGES.NO_FILE
        };
        res.status(400).json(response);
        return;
      }

      // 解析知识库 ID
      let knowledgeBaseIds: string[] = [];
      try {
        const kbIdsRaw = req.body.knowledgeBaseIds;
        if (kbIdsRaw) {
          knowledgeBaseIds = typeof kbIdsRaw === 'string' ? JSON.parse(kbIdsRaw) : kbIdsRaw;
        }
      } catch {
        knowledgeBaseIds = [];
      }

      if (knowledgeBaseIds.length === 0) {
        const response: DocumentUploadResponse = {
          success: false,
          error: '请至少选择一个知识库'
        };
        res.status(400).json(response);
        return;
      }

      // 解析文件内容
      console.log('\n========== [测试] 文件解析开始 ==========');
      console.log(`文件名: ${req.file.originalname}`);
      console.log(`MIME 类型: ${req.file.mimetype}`);
      console.log(`文件大小: ${(req.file.size / 1024).toFixed(2)} KB`);
      
      const parseResult = await fileService.parseFile(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
      
      console.log('\n----- 解析结果文本内容 -----');
      console.log(parseResult.text);
      console.log('\n----- 解析结果文本长度 -----');
      console.log(`总字符数: ${parseResult.text.length}`);
      console.log('========== [测试] 文件解析结束 ==========\n');

      // 创建文档记录
      const uploadedBy = req.body.uploadedBy || 'anonymous';
      const doc = documentService.createDocument(
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        knowledgeBaseIds,
        uploadedBy
      );

      // 更新状态为处理中
      documentService.updateEmbeddingStatus(doc.id, 'processing');

      // 向量存储到每个知识库
      const allChunkIds: string[] = [];
      for (const kbId of knowledgeBaseIds) {
        const result = await vectorStore.addDocument(parseResult.text, kbId);
        if (result.success && result.chunkIds) {
          allChunkIds.push(...result.chunkIds);
        } else if (result.error) {
          console.error(`[Document] 向量存储失败: ${result.error}`);
        }
      }

      // 更新文档的分块 ID
      documentService.updateChunkIds(doc.id, allChunkIds);
      documentService.updateEmbeddingStatus(doc.id, 'completed');

      const response: DocumentUploadResponse = {
        success: true,
        data: documentService.getDocumentById(doc.id)
      };
      res.json(response);
    } catch (error) {
      const response: DocumentUploadResponse = {
        success: false,
        error: error instanceof Error ? error.message : FILE_ERROR_MESSAGES.PARSE_FAILED
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/documents
 * 获取文档列表
 * Query: kbId - 可选，按知识库筛选
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { kbId } = req.query;

    let documents;
    if (kbId && typeof kbId === 'string') {
      documents = documentService.getDocumentsByKnowledgeBase(kbId);
    } else {
      documents = documentService.getAllDocuments();
    }

    const response: DocumentListResponse = {
      success: true,
      data: documents
    };
    res.json(response);
  } catch (error) {
    const response: DocumentListResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取文档列表失败'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/documents/:id
 * 获取单个文档详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const doc = documentService.getDocumentById(req.params.id);

    if (!doc) {
      res.status(404).json({
        success: false,
        error: '文档不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取文档详情失败'
    });
  }
});

/**
 * DELETE /api/documents/:id
 * 删除文档
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = documentService.deleteDocument(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '文档不存在'
      });
      return;
    }

    // 删除关联的向量
    if (deleted.chunkIds.length > 0) {
      vectorStore.deleteChunks(deleted.chunkIds);
    }

    res.json({
      success: true,
      data: { id: deleted.id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除文档失败'
    });
  }
});

/**
 * POST /api/documents/:id/knowledgebases
 * 添加文档到指定知识库
 */
router.post('/:id/knowledgebases', async (req: Request, res: Response) => {
  try {
    const { knowledgeBaseIds } = req.body as AddToKnowledgeBasesRequest;

    if (!Array.isArray(knowledgeBaseIds) || knowledgeBaseIds.length === 0) {
      res.status(400).json({
        success: false,
        error: '请提供有效的知识库 ID 列表'
      });
      return;
    }

    const doc = documentService.getDocumentById(req.params.id);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: '文档不存在'
      });
      return;
    }

    // 添加到知识库
    documentService.addToKnowledgeBases(req.params.id, knowledgeBaseIds);

    // 获取文档内容并添加到新知识库
    // 注意：这里需要文档的原始文本，实际可能需要额外存储或从已有块重建
    const updatedDoc = documentService.getDocumentById(req.params.id);

    res.json({
      success: true,
      data: updatedDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '添加文档到知识库失败'
    });
  }
});

/**
 * DELETE /api/documents/:id/knowledgebases/:kbId
 * 从指定知识库移除文档
 */
router.delete('/:id/knowledgebases/:kbId', (req: Request, res: Response) => {
  try {
    const success = documentService.removeFromKnowledgeBase(req.params.id, req.params.kbId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: '文档不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: documentService.getDocumentById(req.params.id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '从知识库移除文档失败'
    });
  }
});

// 错误处理中间件
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE) {
    res.status(400).json({
      success: false,
      error: FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    let message = FILE_ERROR_MESSAGES.PARSE_FAILED;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = FILE_ERROR_MESSAGES.FILE_TOO_LARGE;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = FILE_ERROR_MESSAGES.NO_FILE;
    }
    res.status(400).json({
      success: false,
      error: message
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

export default router;
