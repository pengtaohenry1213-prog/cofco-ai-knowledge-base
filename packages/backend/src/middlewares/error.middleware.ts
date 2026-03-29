import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FILE_ERROR_MESSAGES } from '../types/file.types';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', err.message);

  if (err instanceof multer.MulterError) {
    const statusCode = 400;
    let message = FILE_ERROR_MESSAGES.PARSE_FAILED;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = FILE_ERROR_MESSAGES.FILE_TOO_LARGE;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = FILE_ERROR_MESSAGES.NO_FILE;
    }

    res.status(statusCode).json({
      success: false,
      data: null,
      error: message
    });
    return;
  }

  if (err.message === FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE) {
    res.status(400).json({
      success: false,
      data: null,
      error: FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误'
  });
};
