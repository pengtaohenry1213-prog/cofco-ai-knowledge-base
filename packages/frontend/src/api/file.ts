import axios from 'axios';

/** 文件上传结果 */
export interface FileUploadResult {
  filename: string;
  content: string;
  html?: string;    // HTML 格式，用于预览
  pdfPath?: string; // PDF 文件路径（前端渲染用）
  isPdf?: boolean;  // 是否为 PDF 文件
}

/** 上传错误类型 */
export type UploadErrorType = 'size' | 'type' | 'network' | 'server';

/** 上传错误 */
export interface UploadError {
  type: UploadErrorType;
  message: string;
}

/** 上传配置 */
export interface UploadConfig {
  onProgress?: (percent: number) => void;
}

/** 文件类型白名单 */
const ALLOWED_TYPES = ['.pdf', '.docx', '.txt'];

/** 最大文件大小 (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 校验文件类型
 * @param filename 文件名
 * @returns 是否合法
 */
export function validateFileType(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_TYPES.includes(ext);
}

/**
 * 校验文件大小
 * @param size 文件大小（字节）
 * @returns 是否合法
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（含点）
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

/** 文件上传成功响应 */
export interface FileUploadResponse {
  success: boolean;
  data: {
    text: string;
    html?: string;     // HTML 格式，用于预览
    filename: string;
    pdfPath?: string;   // PDF 文件路径（前端渲染用）
    isPdf?: boolean;    // 是否为 PDF 文件
  } | null;
  error: string | null;
}

/**
 * 上传文件到服务器
 * @param file 文件对象
 * @param config 上传配置
 * @returns Promise<FileUploadResult>
 */
export async function uploadFile(
  file: File,
  config?: UploadConfig
): Promise<FileUploadResult> {
  // 前端校验：文件类型
  if (!validateFileType(file.name)) {
    return Promise.reject({
      type: 'type' as UploadErrorType,
      message: `不支持的文件类型，仅支持 ${ALLOWED_TYPES.join('、')} 格式`
    });
  }

  // 前端校验：文件大小
  if (!validateFileSize(file.size)) {
    return Promise.reject({
      type: 'size' as UploadErrorType,
      message: `文件大小超过限制，最大支持 ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    });
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post<FileUploadResponse>(
      '/api/file/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && config?.onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            config.onProgress(percent);
          }
        }
      }
    );

    if (!response.data.success || !response.data.data) {
      return Promise.reject({
        type: 'server' as UploadErrorType,
        message: response.data.error || '服务器处理失败'
      });
    }

    return {
      filename: response.data.data.filename || file.name,
      content: response.data.data.text,
      html: response.data.data.html,
      pdfPath: response.data.data.pdfPath,
      isPdf: response.data.data.isPdf
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return Promise.reject({
          type: 'network' as UploadErrorType,
          message: '网络连接失败，请检查网络'
        });
      }
      const errorData = error.response.data as FileUploadResponse | undefined;
      return Promise.reject({
        type: 'server' as UploadErrorType,
        message: errorData?.error || error.response.data?.message || `服务器错误 (${error.response.status})`
      });
    }
    return Promise.reject({
      type: 'server' as UploadErrorType,
      message: '上传失败，请重试'
    });
  }
}

/**
 * 创建带进度回调的上传 Promise
 * @param file 文件对象
 * @returns { upload: Promise, onProgress: (fn) => void }
 */
export function createUploadWithProgress(file: File) {
  const progressCallbacks: Array<(percent: number) => void> = [];

  const uploadPromise = uploadFile(file, {
    onProgress: (percent) => {
      progressCallbacks.forEach((cb) => cb(percent));
    }
  });

  return {
    upload: uploadPromise,
    onProgress: (callback: (percent: number) => void) => {
      progressCallbacks.push(callback);
    }
  };
}
