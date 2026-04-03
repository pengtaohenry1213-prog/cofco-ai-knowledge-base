<template>
  <div class="chat-view">
    <div class="chat-header">
      <h2>智能对话</h2>
      <div class="header-controls">
        <div class="kb-selector">
          <el-select
            v-model="selectedKbId"
            placeholder="选择知识库（可选）"
            clearable
            size="default"
            style="width: 200px"
            @change="handleKbChange"
          >
            <el-option
              v-for="kb in availableKbs"
              :key="kb.id"
              :label="kb.name"
              :value="kb.id"
            >
              <span>{{ kb.name }}</span>
              <span class="kb-option-hint">{{ kb.documentCount || 0 }} 个文档</span>
            </el-option>
          </el-select>
        </div>
      </div>
      <p class="description">
        <span v-if="hasActiveDocument">
          基于「{{ selectedKbName || '已上传文档' }}」的智能问答助手
        </span>
        <span v-else class="no-document">
          请先选择知识库或上传文档后再进行对话
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
        <div v-if="!hasActiveDocument" class="no-document-overlay">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>请先选择知识库或上传文档</p>
          <el-button type="primary" @click="goToKnowledge">
            去知识库
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
        :placeholder="hasActiveDocument ? '请输入您的问题...' : '请先选择知识库或上传文档后再提问'"
        :disabled="loading || !hasActiveDocument"
        @keydown.enter.ctrl="handleSend"
      />
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="!userInput.trim() || !hasActiveDocument"
        @click="handleSend"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { streamPost } from '@/utils/request';
import ChatList from '@/components/ChatList.vue';
import { useDocumentStore } from '@/store/modules/document';
import { useKnowledgeBaseStore } from '@/store/modules/knowledgeBase';
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
const kbStore = useKnowledgeBaseStore();

const chatListRef = ref<InstanceType<typeof ChatList> | null>(null);
const userInput = ref('');
const loading = ref(false);
const messages = ref<Message[]>([]);
const chatHistory = ref<ChatHistory[]>([]);
const currentChatIndex = ref(-1);
const selectedKbId = ref<string>('');

// 可用的知识库列表（仅显示本地文档库）
const availableKbs = computed(() => {
  return kbStore.list.filter((kb) => kb.kind === 'local');
});

// 当前选中的知识库名称
const selectedKbName = computed(() => {
  const kb = kbStore.getById(selectedKbId.value);
  return kb?.name || '';
});

// 是否有可用的文档
const hasActiveDocument = computed(() => {
  // 如果选择了知识库，且该知识库有文档
  if (selectedKbId.value) {
    const kbDocs = documentStore.documents.filter((doc) =>
      doc.knowledgeBaseIds.includes(selectedKbId.value)
    );
    return kbDocs.length > 0;
  }
  // 否则使用旧的 documentStore
  return documentStore.hasDocument;
});

onMounted(async () => {
  // 加载知识库列表（不需要等待）
  // 加载文档列表
  await documentStore.fetchDocuments();
});

// 处理知识库选择变化
async function handleKbChange(kbId: string) {
  if (kbId) {
    // 加载该知识库的文档
    await documentStore.fetchDocuments(kbId);
  }
}

const scrollToBottom = async () => {
  await nextTick();
  chatListRef.value?.scrollToBottom();
};

const goToKnowledge = () => {
  router.push('/knowledge');
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

  // 创建助手消息占位
  const assistantMessage: Message = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
    time: new Date().toLocaleString('zh-CN')
  };
  messages.value.push(assistantMessage);

  const abortController = new AbortController();

  // 构建请求参数
  const requestParams: Record<string, unknown> = {
    question: userMessage.content
  };

  // 如果选择了知识库，传递知识库 ID
  if (selectedKbId.value) {
    requestParams.knowledgeBaseId = selectedKbId.value;
  } else if (documentStore.documentText) {
    // 否则使用直接传入的文档文本
    requestParams.documentText = documentStore.documentText;
  }

  streamPost(
    requestParams,
    {
      onChunk: (text: string, _done: boolean) => {
        assistantMessage.content += text;
        scrollToBottom();
      },
      onFinish: () => {
        loading.value = false;
      },
      onError: (error: Error) => {
        ElMessage.error('发送消息失败：' + error.message);
        // 移除失败的助手消息
        messages.value.pop();
        loading.value = false;
      }
    },
    abortController.signal
  );
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
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.chat-header {
  text-align: center;
  margin-bottom: 16px;
}

.chat-header h2 {
  margin: 0 0 12px;
  font-size: 24px;
  color: #303133;
}

.header-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.kb-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kb-option-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
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
