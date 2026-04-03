import { Request } from 'express';
import { Multer } from 'multer';

export interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
}

export interface FileUploadResponse {
  success: boolean;
  data: {
    text: string;
    html?: string;      // HTML 格式，用于预览
    filename: string;
  } | null;
  error: string | null;
}

export interface FileParseResult {
  text: string;
  html?: string;
  filename: string;
  originalSize: number;
  /** PDF 文件存储路径（前端渲染用） */
  pdfPath?: string;
  /** 是否为 PDF 文件 */
  isPdf?: boolean;
}

export type FileType = 'pdf' | 'docx' | 'txt';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FILE_ERROR_MESSAGES = {
  NO_FILE: '未上传文件',
  FILE_TOO_LARGE: '文件大小超过限制',
  UNSUPPORTED_TYPE: '不支持的文件类型',
  PARSE_FAILED: '文件解析失败',
  EMPTY_FILE: '文件内容为空'
} as const;
