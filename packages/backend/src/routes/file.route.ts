import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import express from 'express';
import { fileService } from '../services/file.service';
import { vectorStore } from '../services/embedding.service';
import {
  FileUploadResponse,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  FILE_ERROR_MESSAGES
} from '../types/file.types';

const router = Router();

/**
 * 修正文件名编码
 * 处理浏览器发送时被错误编码的文件名
 */
function fixFilenameEncoding(filename: string): string {
  if (!filename) return '';

  // 检查是否包含 Latin-1 特殊字符（UTF-8 被当作 Latin-1 解码的典型乱码特征）
  // 常见于 macOS Safari/Chrome 发送的文件名
  const latin1IndicatorPattern = /[æøœ¿¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/;
  
  if (latin1IndicatorPattern.test(filename)) {
    // 将字符串的每个字符转换回其 Latin-1 字节值，然后重新以 UTF-8 解码
    try {
      const latin1Buffer = Buffer.from(filename, 'latin1');
      const correctedFilename = latin1Buffer.toString('utf8');
      const chinesePattern = /[\u4e00-\u9fff]/;
      if (chinesePattern.test(correctedFilename)) {
        return correctedFilename;
      }
    } catch {
      // ignore
    }
  }

  // 尝试解码 percent-encoded 字符
  try {
    const decoded = decodeURIComponent(filename);
    if (decoded && decoded !== filename) {
      return decoded;
    }
  } catch {
    // ignore
  }

  return filename;
}

// 使用 memoryStorage，buffer 会在内存中保存文件内容
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

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          data: null,
          error: '未上传文件'
        });
        return;
      }

      const mimetype = req.file.mimetype;
      // 修正文件名编码
      let filename = fixFilenameEncoding(req.file.originalname);

      const result = await fileService.parseFile(
        req.file.buffer,
        mimetype,
        filename
      );

      // 存储文档到向量库（使用默认空知识库 ID）
      await vectorStore.addDocument(result.text, '');

      // 设置响应头，确保前端正确解析中文
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: {
          text: result.text,
          html: result.html,
          filename: result.filename,
          pdfPath: result.pdfPath,
          isPdf: result.isPdf
        },
        error: null
      });
    } catch (error) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(400).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '文件解析失败'
      });
    }
  }
);

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const message = err.message;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (message === '不支持的文件类型') {
    res.status(400).json({
      success: false,
      data: null,
      error: message
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    let errorMsg = '文件解析失败';
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMsg = '文件大小超过限制';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMsg = '未上传文件';
    }
    res.status(400).json({
      success: false,
      data: null,
      error: errorMsg
    });
    return;
  }

  res.status(500).json({
    success: false,
    data: null,
    error: err.message || '服务器内部错误'
  });
});

export default router;
