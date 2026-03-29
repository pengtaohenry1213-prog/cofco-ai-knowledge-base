import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { fileService } from '../services/file.service';
import {
  FileUploadResponse,
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

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        const response: FileUploadResponse = {
          success: false,
          data: null,
          error: FILE_ERROR_MESSAGES.NO_FILE
        };
        res.status(400).json(response);
        return;
      }

      const result = await fileService.parseFile(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      const response: FileUploadResponse = {
        success: true,
        data: { text: result.text },
        error: null
      };
      res.json(response);
    } catch (error) {
      const response: FileUploadResponse = {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : FILE_ERROR_MESSAGES.PARSE_FAILED
      };
      res.status(400).json(response);
    }
  }
);

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE) {
    res.status(400).json({
      success: false,
      data: null,
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
      data: null,
      error: message
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
