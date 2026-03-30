<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>💬 智能对话</h2>
      <p class="description">基于知识库的智能问答助手</p>
    </div>

    <ChatList
      :messages="chatMessages"
      :loading="isTyping"
      :disabled="loading"
      empty-text="开始向 AI 助手提问吧"
      @scroll-to-bottom="handleScrollToBottom"
    />

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
        :disabled="!userInput.trim() || loading"
        @click="handleSend"
      >
        {{ loading ? '思考中...' : '发送' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import ChatList from '@/components/ChatList.vue';
import type { ChatItem } from '@/types/chat';
import { streamPost } from '@/utils/request';
import type { StreamCallbacks } from '@/utils/request';
import { createTypingEffect } from '@/utils/typingEffect';

const userInput = ref('');
const loading = ref(false);
const isTyping = ref(false);
const chatMessages = shallowRef<ChatItem[]>([]);
let typingInstance: ReturnType<typeof createTypingEffect> | null = null;
let abortController: AbortController | null = null;

const handleScrollToBottom = () => {
  // ChatList handles its own scrolling internally
};

const handleSend = async () => {
  if (!userInput.value.trim() || loading.value) return;

  const userMessage: ChatItem = {
    id: Date.now().toString(),
    role: 'user',
    content: userInput.value.trim(),
    time: new Date().toLocaleString('zh-CN')
  };

  chatMessages.value = [...chatMessages.value, userMessage];
  userInput.value = '';
  loading.value = true;
  isTyping.value = true;

  abortController = new AbortController();

  const assistantMessage: ChatItem = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: '',
    time: new Date().toLocaleString('zh-CN')
  };
  chatMessages.value = [...chatMessages.value, assistantMessage];

  const callbacks: StreamCallbacks = {
    onChunk: (text: string, done: boolean) => {
      typingInstance?.stop();

      const lastMessage = chatMessages.value[chatMessages.value.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        chatMessages.value = [
          ...chatMessages.value.slice(0, -1),
          { ...lastMessage, content: lastMessage.content + text }
        ];
      }

      if (!done) {
        startTypingEffect();
      }
    },
    onFinish: () => {
      isTyping.value = false;
      typingInstance?.stop();
    },
    onError: (error: Error) => {
      ElMessage.error('发送消息失败，请稍后重试');
      console.error(error);
      isTyping.value = false;
      loading.value = false;

      const lastMessage = chatMessages.value[chatMessages.value.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        chatMessages.value = [
          ...chatMessages.value.slice(0, -1),
          { ...lastMessage, content: lastMessage.content || '抱歉，发生了错误。' }
        ];
      }
    }
  };

  const params = {
    message: userMessage.content,
    history: chatMessages.value.slice(-10, -1).map(m => ({
      role: m.role,
      content: m.content
    }))
  };

  const startTypingEffect = () => {
    const lastMessage = chatMessages.value[chatMessages.value.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const originalContent = lastMessage.content;

      typingInstance = createTypingEffect('', {
        speed: 15,
        onChar: (char: string, fullText: string) => {
          const currentMsg = chatMessages.value[chatMessages.value.length - 1];
          if (currentMsg && currentMsg.id === lastMessage.id) {
            chatMessages.value = [
              ...chatMessages.value.slice(0, -1),
              { ...currentMsg, content: originalContent + fullText }
            ];
          }
        }
      });
    }
  };

  try {
    await new Promise<void>((resolve) => {
      streamPost(params, callbacks, abortController!.signal);
      const checkDone = setInterval(() => {
        if (!loading.value) {
          clearInterval(checkDone);
          resolve();
        }
      }, 100);
    });
  } finally {
    loading.value = false;
    isTyping.value = false;
    typingInstance?.stop();
  }
};

onUnmounted(() => {
  typingInstance?.stop();
  abortController?.abort();
});
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

.chat-input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-top: 16px;
}

.chat-input-area :deep(.el-textarea) {
  flex: 1;
}

.chat-input-area .el-button {
  height: auto;
  padding: 12px 24px;
}
</style>
