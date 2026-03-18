export interface ChatItem {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface HistoryItem {
  sessionId: string;
  title: string;
  chats: ChatItem[];
  createTime: number;
}
