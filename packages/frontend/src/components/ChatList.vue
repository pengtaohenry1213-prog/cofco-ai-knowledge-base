<template>
  <div class="chat-list-container">
    <!-- 空状态 -->
    <div v-if="!chatList.length && !isLoading" class="empty-state">
      <el-icon class="empty-icon"><ChatDotRound /></el-icon>
      <p class="empty-text">请上传文档后提问</p>
    </div>

    <!-- 消息列表 -->
    <div v-else class="chat-list" ref="listContainer">
      <div
        v-for="item in chatList"
        :key="item.id"
        class="message-item"
        :class="item.role"
      >
        <div class="message-avatar">
          <el-icon v-if="item.role === 'user'"><User /></el-icon>
          <el-icon v-else><Service /></el-icon>
        </div>
        <div class="message-bubble">
          <div class="message-content" v-html="formatContent(item.content)"></div>
        </div>
      </div>

      <!-- AI 正在输入的打字机效果 -->
      <div v-if="isLoading && streamingText !== undefined" class="message-item assistant">
        <div class="message-avatar">
          <el-icon><Robot /></el-icon>
        </div>
        <div class="message-bubble">
          <div class="message-content" v-html="formatContent(streamingText)"></div>
          <span class="typing-cursor">|</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ChatDotRound, User, Service } from '@element-plus/icons-vue';
import type { ChatListProps, ChatItem } from '@/types/chat';

const props = withDefaults(defineProps<ChatListProps>(), {
  chatList: () => [],
  isLoading: false
});

const listContainer = ref<HTMLElement | null>(null);
const streamingText = ref<string | undefined>(undefined);

let typingEffectInstance: { stop: () => void } | null = null;

/**
 * 滚动到底部
 */
const scrollToBottom = async () => {
  await nextTick();
  if (listContainer.value) {
    listContainer.value.scrollTop = listContainer.value.scrollHeight;
  }
};

/**
 * 格式化消息内容
 */
const formatContent = (content: string): string => {
  if (!content) return '';
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
};

/**
 * 监听流式内容变化
 */
watch(() => props.chatList, async (newList) => {
  const lastItem = newList[newList.length - 1];
  if (lastItem && lastItem.role === 'assistant') {
    streamingText.value = lastItem.content;
    await scrollToBottom();
  }
}, { deep: true });

/**
 * 监听 loading 状态
 */
watch(() => props.isLoading, async (loading) => {
  if (!loading) {
    streamingText.value = undefined;
  }
  await nextTick();
  await scrollToBottom();
});

// 暴露方法给父组件
defineExpose({
  scrollToBottom
});
</script>

<style scoped>
.chat-list-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 40px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

/* 消息列表 */
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
}

.chat-list::-webkit-scrollbar {
  width: 6px;
}

.chat-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.chat-list::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

/* 消息项 */
.message-item {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户消息靠右 */
.message-item.user {
  flex-direction: row-reverse;
}

/* 头像 */
.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: #409eff;
  color: #fff;
  margin-left: 12px;
}

.message-item.assistant .message-avatar {
  background: #67c23a;
  color: #fff;
  margin-right: 12px;
}

/* 消息气泡 */
.message-bubble {
  max-width: 70%;
  position: relative;
}

.message-item.user .message-bubble {
  text-align: right;
}

.message-content {
  display: inline-block;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.user .message-content {
  background: #409eff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-content {
  background: #fff;
  color: #303133;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 代码块样式 */
.message-content :deep(code) {
  background: rgba(0, 0, 0, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.message-item.user .message-content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

/* 强调样式 */
.message-content :deep(strong) {
  font-weight: 600;
}

/* 打字机光标 */
.typing-cursor {
  display: inline-block;
  animation: blink 0.8s infinite;
  color: #67c23a;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
