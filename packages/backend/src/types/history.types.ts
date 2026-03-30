/**
 * 历史对话类型定义
 */

export interface HistoryItem {
  /** 唯一标识符 */
  id: string;
  /** 用户问题 */
  question: string;
  /** AI 回答 */
  answer: string;
  /** 创建时间 */
  createTime: string;
}

export interface CreateHistoryDto {
  /** 用户问题 */
  question: string;
  /** AI 回答 */
  answer: string;
}

export interface HistoryListQuery {
  /** 页码（预留扩展） */
  page?: number;
  /** 每页数量（预留扩展） */
  pageSize?: number;
}

export interface HistoryResponse {
  success: boolean;
  data: HistoryItem | HistoryItem[] | null;
  error: string | null;
}
