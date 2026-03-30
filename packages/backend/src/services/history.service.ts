/**
 * 历史对话服务
 * 内存存储，重启后数据清零
 */

import { randomUUID } from 'crypto';
import type { HistoryItem, CreateHistoryDto } from '../types/history.types';

class HistoryService {
  /** 内存存储：历史对话列表 */
  private historyList: HistoryItem[] = [];

  /**
   * 创建新对话
   * @param dto 创建对话的数据
   * @returns 创建的对话项
   */
  create(dto: CreateHistoryDto): HistoryItem {
    const item: HistoryItem = {
      id: randomUUID(),
      question: dto.question,
      answer: dto.answer,
      createTime: new Date().toISOString()
    };

    this.historyList.push(item);
    return item;
  }

  /**
   * 获取所有历史对话（按创建时间倒序）
   * @returns 历史对话列表
   */
  findAll(): HistoryItem[] {
    return [...this.historyList].sort(
      (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    );
  }

  /**
   * 根据 ID 获取单条对话
   * @param id 对话 ID
   * @returns 对话项或 null
   */
  findById(id: string): HistoryItem | null {
    return this.historyList.find(item => item.id === id) || null;
  }

  /**
   * 清空所有历史对话
   */
  clearAll(): void {
    this.historyList = [];
  }

  /**
   * 删除指定对话
   * @param id 对话 ID
   * @returns 是否删除成功
   */
  deleteById(id: string): boolean {
    const index = this.historyList.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    this.historyList.splice(index, 1);
    return true;
  }

  /**
   * 获取对话总数
   */
  getCount(): number {
    return this.historyList.length;
  }
}

export const historyService = new HistoryService();
