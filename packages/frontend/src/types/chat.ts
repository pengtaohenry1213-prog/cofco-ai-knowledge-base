/**
 * 聊天消息类型定义
 */

export interface ChatItem {
  /** 消息唯一标识 */
  id: string;
  /** 消息角色：user-用户消息，assistant-AI助手消息 */
  role: 'user' | 'assistant';
  /** 消息内容 */
  content: string;
}

export interface ChatListProps {
  /** 对话列表数据 */
  chatList: ChatItem[];
  /** 是否正在等待AI回答 */
  isLoading?: boolean;
}
