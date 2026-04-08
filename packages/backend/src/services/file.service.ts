import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import {
  FileParseResult,
  FILE_ERROR_MESSAGES,
  MAX_UPLOAD_DIR_FILES,
  MAX_UPLOAD_DIR_SIZE_MB
} from '../types/file.types';

/** 设置 pdfjs-dist Worker（Node.js 环境） */
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  'node_modules/pdfjs-dist/build/pdf.worker.js'
);

/** 预初始化 pdfjs-dist Worker，确保首次解析时已就绪 */
let pdfJsInitialized = false;
let pdfJsInitPromise: Promise<void> | null = null;

function initPdfJsWorker(): Promise<void> {
  if (pdfJsInitialized) {
    return Promise.resolve();
  }
  if (pdfJsInitPromise) {
    return pdfJsInitPromise;
  }

  pdfJsInitPromise = (async () => {
    try {
      // 通过加载一个空 PDF 来预热 Worker
      const emptyPdf = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A,       // %...comment
        0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46, 0x0A        // %%EOF
      ]);
      await pdfjsLib.getDocument(emptyPdf).promise;
      pdfJsInitialized = true;
    } catch {
      // 即使预热失败也不阻塞，后续请求会再次尝试
      pdfJsInitialized = true;
    }
  })();

  return pdfJsInitPromise;
}

// 启动 Worker 预初始化（异步，不阻塞模块加载）
initPdfJsWorker();

/** PDF 文件存储目录 */
const PDF_UPLOAD_DIR = path.join(process.cwd(), 'packages/backend/uploads/pdfs');

/** 临时 PDF 图片目录 */
const TEMP_PDF_IMAGES_DIR = path.join(process.cwd(), 'temp-pdf-images');

/** ImageMagick convert 命令路径 */
const IMAGEMAGICK_CONVERT = '/opt/homebrew/bin/convert';

/** 确保上传目录存在 */
function ensureUploadDir() {
  if (!fs.existsSync(PDF_UPLOAD_DIR)) {
    fs.mkdirSync(PDF_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * 检查上传目录状态，必要时清理旧文件
 * 按文件修改时间排序，删除最旧的文件直到满足限制
 */
async function cleanupOldFiles(): Promise<void> {
  if (!fs.existsSync(PDF_UPLOAD_DIR)) return;

  const files = await fs.readdir(PDF_UPLOAD_DIR);
  if (files.length <= MAX_UPLOAD_DIR_FILES) return;

  const fileInfos = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(PDF_UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      return { file, filePath, mtime: stats.mtime.getTime() };
    })
  );

  // 按修改时间升序（最旧的在前）
  fileInfos.sort((a, b) => a.mtime - b.mtime);

  // 删除最旧的文件，直到数量达到限制
  const filesToDelete = fileInfos.slice(0, files.length - MAX_UPLOAD_DIR_FILES);
  for (const { filePath } of filesToDelete) {
    await fs.remove(filePath);
    console.log(`[FileService] 已清理旧文件: ${path.basename(filePath)}`);
  }
}

/**
 * 检查目录总大小，必要时清理
 */
async function cleanupBySize(): Promise<void> {
  if (!fs.existsSync(PDF_UPLOAD_DIR)) return;

  const maxBytes = MAX_UPLOAD_DIR_SIZE_MB * 1024 * 1024;
  const files = await fs.readdir(PDF_UPLOAD_DIR);
  let totalSize = 0;

  for (const file of files) {
    const filePath = path.join(PDF_UPLOAD_DIR, file);
    const stats = await fs.stat(filePath);
    totalSize += stats.size;
  }

  if (totalSize <= maxBytes) return;

  // 按修改时间升序排序，删除最旧的文件直到大小满足限制
  const fileInfos = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(PDF_UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      return { file, filePath, mtime: stats.mtime.getTime(), size: stats.size };
    })
  );
  fileInfos.sort((a, b) => a.mtime - b.mtime);

  for (const { filePath } of fileInfos) {
    if (totalSize <= maxBytes) break;
    const stats = await fs.stat(filePath);
    await fs.remove(filePath);
    totalSize -= stats.size;
    console.log(`[FileService] 已按大小清理文件: ${path.basename(filePath)}`);
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
      const result = await this.parsePdf(buffer, filename);
      text = result.text;
      pdfPath = result.pdfPath;
    } else if (isDocx) {
      const result = await this.parseDocxToHtml(buffer);
      text = result.text;
      html = result.html;
    } else {
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
   * 解析 PDF：原生文本 + 图片 OCR 文字，合并输出
   * 使用 pdfjs-dist 提取原生文本，ImageMagick + tesseract.js 识别图片文字
   */
  private async parsePdf(buffer: Buffer, filename: string): Promise<{ text: string; pdfPath: string }> {
    ensureUploadDir();

    // 等待 Worker 初始化完成，避免竞态条件
    await initPdfJsWorker();

    // 上传前检查并清理（按数量和大小）
    await cleanupOldFiles();
    await cleanupBySize();

    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pdfFilename = `${timestamp}_${safeFilename}`;
    const pdfPath = path.join(PDF_UPLOAD_DIR, pdfFilename);

    fs.writeFileSync(pdfPath, buffer);

    const relativePdfPath = `/uploads/pdfs/${pdfFilename}`;
    let totalText = '';

    try {
      const uint8Array = new Uint8Array(buffer);
      const pdfDoc = await pdfjsLib.getDocument(uint8Array).promise;

      let nativeText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageStr = content.items.map((item: any) => item.str).join(' ');
        nativeText += pageStr + '\n';
      }

      if (nativeText.trim()) {
        totalText += '【原生文本】\n' + nativeText.trim() + '\n\n';
      }

      const ocrText = await this.extractAndOcrPdfImages(buffer);

      if (ocrText.trim()) {
        totalText += '【图片OCR文本】\n' + ocrText.trim();
      }

      if (!totalText.trim()) {
        throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
      }

      return {
        text: totalText.trim(),
        pdfPath: relativePdfPath
      };
    } catch (error) {
      console.error('[FileService] PDF 解析失败:', error);
      throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
    }
  }

  /**
   * 使用 ImageMagick 提取 PDF 图片并使用 OCR 识别文字
   */
  private async extractAndOcrPdfImages(buffer: Buffer): Promise<string> {
    const tempDir = TEMP_PDF_IMAGES_DIR;

    try {
      await fs.ensureDir(tempDir);

      // 保存临时 PDF 文件
      const tempPdfPath = path.join(tempDir, 'temp.pdf');
      fs.writeFileSync(tempPdfPath, buffer);

      // 使用 ImageMagick 逐页转换为图片
      const imagePaths: string[] = [];
      let pageNum = 0;

      while (true) {
        const outPath = path.join(tempDir, `page-${pageNum}.png`);
        try {
          execSync(
            `${IMAGEMAGICK_CONVERT} -density 150 "${tempPdfPath}[${pageNum}]" -quality 90 "${outPath}"`,
            { timeout: 30000, stdio: 'pipe' }
          );

          if (!fs.existsSync(outPath)) {
            break;
          }
          imagePaths.push(outPath);
          pageNum++;
        } catch {
          break;
        }
      }

      if (imagePaths.length === 0) {
        await fs.remove(tempDir);
        return '';
      }

      // 使用 tesseract.js 进行 OCR 识别
      const worker = await createWorker('chi_sim+eng');
      let ocrText = '';

      for (const imgPath of imagePaths) {
        try {
          const { data: { text } } = await worker.recognize(imgPath);
          ocrText += text + '\n';
        } finally {
          if (fs.existsSync(imgPath)) {
            await fs.unlink(imgPath);
          }
        }
      }

      await worker.terminate();
      await fs.remove(tempDir);

      return ocrText.trim();
    } catch (error) {
      console.warn('[FileService] PDF 图片 OCR 失败:', error);
      try {
        if (fs.existsSync(tempDir)) {
          await fs.remove(tempDir);
        }
      } catch { /* ignore cleanup errors */ }
      return '';
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
