import { DocumentUploadResponse } from '../types/index.js';

export class DocumentService {
  uploadDocument(file: Express.Multer.File): DocumentUploadResponse {
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    };
  }
}

export const documentService = new DocumentService();
