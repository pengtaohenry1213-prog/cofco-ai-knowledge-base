import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { documentService } from '../services/document.service.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    const response: ApiResponse = {
      code: 400,
      message: '请上传文件'
    };
    return res.status(400).json(response);
  }

  const result = documentService.uploadDocument(req.file);
  const response: ApiResponse<typeof result> = {
    code: 200,
    message: '上传成功',
    data: result
  };
  res.json(response);
});

export default router;
