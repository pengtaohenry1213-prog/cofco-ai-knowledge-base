import { describe, it, expect } from 'vitest';
import { validateFileType, validateFileSize, getFileExtension } from '@/api/file';

describe('file.ts - 工具函数', () => {
  describe('validateFileType', () => {
    // TC-FILE-001: 合法 PDF 文件
    it('TC-FILE-001: 上传合法 PDF 文件应返回 true', () => {
      expect(validateFileType('document.pdf')).toBe(true);
      expect(validateFileType('DOCUMENT.PDF')).toBe(true);
      expect(validateFileType('my-file.pdf')).toBe(true);
    });

    // TC-FILE-002: 合法 DOCX 文件
    it('TC-FILE-002: 上传合法 DOCX 文件应返回 true', () => {
      expect(validateFileType('document.docx')).toBe(true);
      expect(validateFileType('DOCUMENT.DOCX')).toBe(true);
      expect(validateFileType('my-file.docx')).toBe(true);
    });

    // TC-FILE-003: 非法类型文件
    it('TC-FILE-003: 上传非法类型文件应返回 false', () => {
      expect(validateFileType('document.txt')).toBe(false);
      expect(validateFileType('image.png')).toBe(false);
      expect(validateFileType('archive.zip')).toBe(false);
      expect(validateFileType('document.doc')).toBe(false);
      expect(validateFileType('document.xlsx')).toBe(false);
      expect(validateFileType('')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    // TC-FILE-004: 合法大小文件
    it('TC-FILE-004: 小于等于 10MB 的文件应返回 true', () => {
      expect(validateFileSize(0)).toBe(true);
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(validateFileSize(10 * 1024 * 1024)).toBe(true); // 10MB
    });

    // TC-FILE-005: 非法大小文件
    it('TC-FILE-005: 大于 10MB 的文件应返回 false', () => {
      expect(validateFileSize(10 * 1024 * 1024 + 1)).toBe(false);
      expect(validateFileSize(50 * 1024 * 1024)).toBe(false);
      expect(validateFileSize(100 * 1024 * 1024)).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('应正确提取文件扩展名', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('document.docx')).toBe('.docx');
      expect(getFileExtension('DOCUMENT.PDF')).toBe('.pdf');
      expect(getFileExtension('path/to/file.docx')).toBe('.docx');
    });

    it('无扩展名文件应返回原始字符串', () => {
    expect(getFileExtension('README')).toBe('readme');
  });
  });
});
