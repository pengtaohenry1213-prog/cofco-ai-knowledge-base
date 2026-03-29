import { describe, it, expect } from 'vitest';
import { DocumentService } from '../services/document.service';

describe('DocumentService', () => {
  const documentService = new DocumentService();

  it('should return valid document response structure', () => {
    const mockFile = {
      originalname: 'test.pdf',
      size: 1024,
      mimetype: 'application/pdf',
      filename: '123456-test.pdf',
      path: '/uploads/123456-test.pdf',
      fieldname: 'file',
      encoding: '7bit',
      destination: '/uploads',
      buffer: Buffer.from(''),
      stream: null as unknown as NodeJS.ReadableStream
    };

    const result = documentService.uploadDocument(mockFile as Express.Multer.File);

    expect(result).toHaveProperty('filename');
    expect(result).toHaveProperty('originalName');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('mimetype');
    expect(result).toHaveProperty('path');
    expect(result.originalName).toBe('test.pdf');
    expect(result.size).toBe(1024);
  });
});
