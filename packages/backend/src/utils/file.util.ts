import path from 'path';
import fs from 'fs';

export const FILE_UPLOAD_DIR = path.join(__dirname, '../../uploads');

export function ensureUploadDir(): void {
  if (!fs.existsSync(FILE_UPLOAD_DIR)) {
    fs.mkdirSync(FILE_UPLOAD_DIR, { recursive: true });
  }
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function isAllowedFileType(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype);
}

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
