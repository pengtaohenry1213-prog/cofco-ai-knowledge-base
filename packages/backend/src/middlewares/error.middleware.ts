import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FILE_ERROR_MESSAGES } from '../types/file.types';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class BusinessError extends Error {
  statusCode: number;
  isOperational: true;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
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

  if (err instanceof BusinessError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message
    });
    return;
  }

  if (err.isOperational) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({
      success: false,
      data: null,
      error: err.message
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? '服务器内部错误' : err.message;

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message
  });
};

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Uncaught Exception]', err.message);
  process.exit(1);
});

export { errorHandler };
