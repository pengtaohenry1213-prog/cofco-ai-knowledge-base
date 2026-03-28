<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>💬 智能对话</h2>
      <p class="description">基于知识库的智能问答助手</p>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <el-icon class="empty-icon"><ChatDotRound /></el-icon>
        <p>开始向 AI 助手提问吧</p>
      </div>
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
        :class="msg.role"
      >
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'user'"><User /></el-icon>
          <el-icon v-else><Robot /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)"></div>
          <div class="message-time">{{ msg.time }}</div>
        </div>
      </div>
      <div v-if="loading" class="message assistant">
        <div class="message-avatar">
          <el-icon><Robot /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-text typing">
            <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        placeholder="请输入您的问题..."
        :disabled="loading"
        @keydown.enter.ctrl="handleSend"
      />
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!userInput.trim()"
        @click="handleSend"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { ChatDotRound, User, Robot } from '@element-plus/icons-vue';
import { request } from '@/utils/request';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const messagesContainer = ref<HTMLElement | null>(null);
const userInput = ref('');
const loading = ref(false);
const messages = ref<Message[]>([]);

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatMessage = (content: string): string => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

const handleSend = async () => {
  if (!userInput.value.trim() || loading.value) return;

  const userMessage: Message = {
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
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.chat-header {
  text-align: center;
  margin-bottom: 24px;
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

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.message {
  display: flex;
  margin-bottom: 20px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user .message-avatar {
  background: #409eff;
  color: #fff;
}

.assistant .message-avatar {
  background: #67c23a;
  color: #fff;
}

.message-content {
  max-width: 70%;
  margin: 0 12px;
}

.user .message-content {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-break: break-word;
}

.user .message-text {
  background: #409eff;
  color: #fff;
}

.assistant .message-text {
  background: #fff;
  color: #303133;
}

.message-text :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.typing .dot {
  animation: blink 1.4s infinite;
}

.typing .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 60%, 100% { opacity: 0; }
  30% { opacity: 1; }
}

.chat-input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input-area .el-textarea {
  flex: 1;
}

.chat-input-area .el-button {
  height: auto;
  padding: 12px 24px;
}
</style>
