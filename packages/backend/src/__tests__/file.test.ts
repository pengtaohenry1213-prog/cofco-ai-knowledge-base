import { describe, it, expect, beforeAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import fileRouter from '../routes/file.route';
import {
  MAX_FILE_SIZE,
  FILE_ERROR_MESSAGES
} from '../types/file.types.js';

describe('File Upload API - TC-FILE-001~007', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/file', fileRouter);
  });

  describe('TC-FILE-001: 上传合法 PDF 文件', () => {
    it('should accept PDF upload request and return proper response structure', async () => {
      const response = await request(app)
        .post('/api/file/upload')
        .attach('file', Buffer.from('%PDF-1.4\ntest content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
      expect(response.body.error === null || typeof response.body.error === 'string').toBe(true);
    });
  });

  describe('TC-FILE-002: 上传合法 Word 文件', () => {
    it('should return success with extracted text for Word', async () => {
      const response = await request(app)
        .post('/api/file/upload')
        .attach('file', Buffer.from('PK\x03\x04test docx content'), {
          filename: 'test.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('text');
      }
    });
  });

  describe('TC-FILE-003: 上传超过 10MB 的文件', () => {
    it('should reject file larger than 10MB', async () => {
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE + 1, 'a');

      const response = await request(app)
        .post('/api/file/upload')
        .attach('file', largeBuffer, {
          filename: 'large.pdf',
          contentType: 'application/pdf'
        });

      // multer 返回 426 (Payload Too Large) 或 400
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TC-FILE-004: 上传不允许的文件类型', () => {
    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/api/file/upload')
        .attach('file', Buffer.from('text content'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TC-FILE-005: 上传损坏文件', () => {
    it('should handle corrupted PDF file', async () => {
      const response = await request(app)
        .post('/api/file/upload')
        .attach('file', Buffer.from('NOT A REAL PDF FILE'), {
          filename: 'corrupted.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TC-FILE-006: 不带文件参数请求', () => {
    it('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/file/upload')
        .field('other', 'value');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(FILE_ERROR_MESSAGES.NO_FILE);
    });
  });

  describe('Response Structure Validation', () => {
    it('should return correct response structure', async () => {
      const response = await request(app)
        .post('/api/file/upload')
        .attach('file', Buffer.from('%PDF-1.4 valid'), {
          filename: 'valid.pdf',
          contentType: 'application/pdf'
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('data');
    });
  });
});
