export interface DocumentUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export * from './embedding.types';
