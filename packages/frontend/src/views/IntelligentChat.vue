<template>
  <div class="chat-view">
    <div class="chat-header">
      <h2>💬 智能对话</h2>
      <p class="description">
        <span v-if="documentStore.hasDocument">
          基于知识库的智能问答助手
        </span>
        <span v-else class="no-document">
          请先上传文档后再进行对话
        </span>
      </p>
    </div>

    <div class="chat-main">
      <!-- 历史对话列表 -->
      <div class="chat-sidebar" v-if="chatHistory.length > 0">
        <h3 class="sidebar-title">对话历史</h3>
        <div class="history-list">
          <div
            v-for="(chat, index) in chatHistory"
            :key="index"
            class="history-item"
            :class="{ active: currentChatIndex === index }"
            @click="loadChat(index)"
          >
            <span class="history-title">{{ chat.title }}</span>
            <span class="history-date">{{ chat.date }}</span>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="chat-content">
        <ChatList
          ref="chatListRef"
          :chat-list="messages"
          :is-loading="loading"
        />

        <!-- 空状态 -->
        <div v-if="!documentStore.hasDocument" class="no-document-overlay">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>请先上传文档</p>
          <el-button type="primary" @click="goToUpload">
            去上传文档
          </el-button>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        :placeholder="documentStore.hasDocument ? '请输入您的问题...' : '请先上传文档后再提问'"
        :disabled="loading || !documentStore.hasDocument"
        @keydown.enter.ctrl="handleSend"
      />
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="!userInput.trim() || !documentStore.hasDocument"
        @click="handleSend"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { request } from '@/utils/request';
import ChatList from '@/components/ChatList.vue';
import { useDocumentStore } from '@/store/modules/document';
import type { ChatItem } from '@/types/chat';

interface Message extends ChatItem {
  time: string;
}

interface ChatHistory {
  title: string;
  date: string;
  messages: Message[];
}

const router = useRouter();
const documentStore = useDocumentStore();

const chatListRef = ref<InstanceType<typeof ChatList> | null>(null);
const userInput = ref('');
const loading = ref(false);
const messages = ref<Message[]>([]);
const chatHistory = ref<ChatHistory[]>([]);
const currentChatIndex = ref(-1);

const scrollToBottom = async () => {
  await nextTick();
  chatListRef.value?.scrollToBottom();
};

const formatMessage = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
};

const goToUpload = () => {
  router.push('/upload');
};

const handleSend = async () => {
  if (!userInput.value.trim() || loading.value) return;

  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: userInput.value.trim(),
    time: new Date().toLocaleString('zh-CN')
  };

  messages.value.push(userMessage);
  userInput.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await request.post<{ answer: string }>('/chat/stream', {
      message: userMessage.content,
      history: messages.value.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.data.data.answer,
      time: new Date().toLocaleString('zh-CN')
    };
    messages.value.push(assistantMessage);
  } catch (error) {
    ElMessage.error('发送消息失败，请稍后重试');
    console.error(error);
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const loadChat = (index: number) => {
  currentChatIndex.value = index;
  messages.value = [...chatHistory.value[index].messages];
};
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.chat-header {
  text-align: center;
  margin-bottom: 16px;
}

.chat-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #303133;
}

.description {
  color: #909399;
  margin: 0;
}

.description .no-document {
  color: #e6a23c;
}

.chat-main {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

.chat-sidebar {
  width: 200px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
}

.sidebar-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.history-title {
  display: block;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-date {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.no-document-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(245, 247, 250, 0.95);
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  color: #909399;
}

.no-document-overlay p {
  color: #606266;
  margin: 0;
}

.chat-input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-top: 16px;
}

.chat-input-area :deep(.el-textarea) {
  flex: 1;
}

.chat-input-area :deep(.el-button) {
  height: auto;
  padding: 12px 24px;
}
</style>
