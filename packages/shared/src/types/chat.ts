// 对话项类型（前后端共用）
export interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 流式响应类型（前后端共用）
export interface StreamResponseChunk {
  chunk: string;
  finish: boolean;
}

// 历史对话类型（前后端共用）
export interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  createTime: string;
}
