/**
 * 文档状态管理
 * 存储上传的文档文本，用于跨页面数据共享
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDocumentStore = defineStore('document', () => {
  /** 解析后的文档文本内容 */
  const documentText = ref<string>('');

  /** 是否有已上传的文档 */
  const hasDocument = ref<boolean>(false);

  /** 当前文档文件名 */
  const filename = ref<string>('');

  /**
   * 设置文档内容
   * @param text 文档文本内容
   * @param name 文件名
   */
  function setDocumentText(text: string, name: string = '') {
    documentText.value = text;
    filename.value = name;
    hasDocument.value = text.length > 0;
  }

  /**
   * 清除文档内容
   */
  function clearDocument() {
    documentText.value = '';
    filename.value = '';
    hasDocument.value = false;
  }

  return {
    documentText,
    hasDocument,
    filename,
    setDocumentText,
    clearDocument
  };
});
