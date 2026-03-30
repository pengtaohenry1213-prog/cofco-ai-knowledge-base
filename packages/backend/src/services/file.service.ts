import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { FileParseResult, FILE_ERROR_MESSAGES } from '../types/file.types';

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

    if (!isPdf && !isDocx) {
      throw new Error(FILE_ERROR_MESSAGES.UNSUPPORTED_TYPE);
    }

    const text = isPdf
      ? await this.parsePdf(buffer)
      : await this.parseDocx(buffer);

    if (!text || text.trim().length === 0) {
      throw new Error(FILE_ERROR_MESSAGES.EMPTY_FILE);
    }

    return {
      text,
      filename,
      originalSize: buffer.length
    };
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (error) {
      throw new Error(FILE_ERROR_MESSAGES.PARSE_FAILED);
    }
  }
}

export const fileService = new FileService();
