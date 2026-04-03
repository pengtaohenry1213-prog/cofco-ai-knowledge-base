import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { FileParseResult, FILE_ERROR_MESSAGES } from '../types/file.types';

/** PDF 文件存储目录 */
const PDF_UPLOAD_DIR = path.join(__dirname, '../../uploads/pdfs');

/** 确保上传目录存在 */
function ensureUploadDir() {
  if (!fs.existsSync(PDF_UPLOAD_DIR)) {
    fs.mkdirSync(PDF_UPLOAD_DIR, { recursive: true });
  }
}

export class FileService {
  async parseFile(
    buffer: Buffer,
    mimetype: string,
    filename: string
  ): Promise<FileParseResult> {
    const isPdf = mimetype === 'application/pdf';
    const isDocx =
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isTxt = mimetype === 'text/plain';

    if (!isPdf && !isDocx && !isTxt) {
      throw new Error(FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE);
    }

    let text: string;
    let html: string | undefined;
    let pdfPath: string | undefined;

    if (isPdf) {
      const result = await this.parsePdfToHtml(buffer, filename);
      text = result.text;
      html = result.html;
      pdfPath = result.pdfPath;
    } else if (isDocx) {
      const result = await this.parseDocxToHtml(buffer);
      text = result.text;
      html = result.html;
    } else {
      // TXT 文件 - 也生成简单 HTML
      text = buffer.toString('utf-8');
      html = this.txtToHtml(text);
    }

    if (!text || text.trim().length === 0) {
      throw new Error(FILE_ERROR_MESSAGES.EMPTY_FILE);
    }

    return {
      text,
      html,
      filename,
      originalSize: buffer.length,
      pdfPath,
      isPdf
    };
  }

  /**
   * 解析 PDF：纯文本用于向量检索；PDF 文件存储用于前端渲染
   */
  private async parsePdfToHtml(buffer: Buffer, filename: string): Promise<{ text: string; html?: string; pdfPath: string }> {
    // 确保上传目录存在
    ensureUploadDir();

    // 生成唯一文件名（时间戳 + 原始文件名）
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pdfFilename = `${timestamp}_${safeFilename}`;
    const pdfPath = path.join(PDF_UPLOAD_DIR, pdfFilename);

    // 保存 PDF 文件到磁盘
    fs.writeFileSync(pdfPath, buffer);

    // 使用 pdf-parse 提取文本
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();

      // PDF 前端渲染时使用相对路径
      const relativePdfPath = `/uploads/pdfs/${pdfFilename}`;

      return {
        text: textResult.text,
        html: undefined, // PDF 不生成 HTML，由前端渲染
        pdfPath: relativePdfPath
      };
    } catch (error) {
      console.error('[FileService] PDF 解析失败:', error);
      throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
    } finally {
      await parser.destroy();
    }
  }

  /**
   * 解析 DOCX 文件为纯文本（用于向量存储）
   */
  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (error) {
      throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
    }
  }

  /**
   * 解析 DOCX 文件为 HTML（用于预览）
   * 保留表格、标题等格式
   */
  async parseDocxToHtml(buffer: Buffer): Promise<{ text: string; html: string }> {
    try {
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer })
      ]);

      return {
        text: textResult.value || '',
        html: htmlResult.value || ''
      };
    } catch (error) {
      throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
    }
  }

  /**
   * TXT 转 HTML
   */
  private txtToHtml(text: string): string {
    const lines = text.split('\n');
    const paragraphs = lines
      .map((line) => {
        const trimmed = line.trim();
        return trimmed ? `<p>${this.escapeHtml(trimmed)}</p>` : '';
      })
      .filter(Boolean);
    return `<div class="txt-content">${paragraphs.join('\n')}</div>`;
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const fileService = new FileService();
