<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>智能对话</h2>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in appStore.chatMessages"
        :key="index"
        :class="['message', msg.role]"
      >
        <div class="message-avatar">
          {{ msg.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          {{ msg.content }}
        </div>
      </div>
      
      <div v-if="isLoading" class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content loading">
          <span>正在思考...</span>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <textarea
        v-model="inputMessage"
        placeholder="请输入您的问题..."
        @keydown.enter.exact.prevent="sendMessage"
        :disabled="isLoading"
      ></textarea>
      <button @click="sendMessage" :disabled="isLoading || !inputMessage.trim()">
        {{ isLoading ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useAppStore } from '@/store'
import { post } from '@/utils/request'

const appStore = useAppStore()
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return
  
  // 添加用户消息
  appStore.addChatMessage('user', message)
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()
  
  try {
    // 调用后端API
    const response = await post<string>('/chat', { message })
    appStore.addChatMessage('assistant', response)
  } catch (error: any) {
    appStore.addChatMessage('assistant', error.message || '抱歉，请稍后重试')
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
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
  font-size: 20px;
  background: #f0f0f0;
  margin: 0 10px;
}

.message.assistant .message-avatar {
  background: #e3f2fd;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f5f5f5;
  line-height: 1.5;
}

.message.user .message-content {
  background: #2196f3;
  color: white;
}

.message.assistant .message-content {
  background: #f5f5f5;
  color: #333;
}

.message-content.loading {
  color: #999;
  font-style: italic;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
}

.chat-input textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  font-family: inherit;
}

.chat-input textarea:focus {
  outline: none;
  border-color: #2196f3;
}

.chat-input button {
  padding: 12px 24px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.chat-input button:hover:not(:disabled) {
  background: #1976d2;
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
