<template>
  <div class="doc-manager-page">
    <div class="page-header">
      <h1 class="page-title">文档管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleUploadClick">
          <el-icon class="el-icon--left"><Upload /></el-icon>
          上传文档
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon class="el-icon--left"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 知识库筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="知识库">
          <el-select
            v-model="filterKbId"
            placeholder="全部知识库"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="kb in knowledgeBases"
              :key="kb.id"
              :label="kb.name"
              :value="kb.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文档列表 -->
    <el-card shadow="never" class="list-card">
      <template #header>
        <div class="card-header">
          <span>文档列表</span>
          <span class="doc-count">共 {{ filteredDocuments.length }} 个文档</span>
        </div>
      </template>

      <DocumentList
        :documents="filteredDocuments"
        :loading="loading"
        @delete="handleDeleteDocument"
      />

      <el-empty v-if="!loading && filteredDocuments.length === 0" description="暂无文档" />
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文档"
      width="500px"
      destroy-on-close
    >
      <div class="upload-dialog-content">
        <FileUpload @success="handleUploadSuccess" @error="handleUploadError" />

        <div class="kb-select-section">
          <div class="section-label">关联到知识库</div>
          <el-checkbox-group v-model="selectedKbIds">
            <el-checkbox
              v-for="kb in knowledgeBases"
              :key="kb.id"
              :label="kb.id"
            >
              {{ kb.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, Refresh } from '@element-plus/icons-vue';
import DocumentList from '@/components/DocumentList.vue';
import FileUpload from '@/components/FileUpload.vue';
import { useDocumentStore } from '@/store/modules/document';
import { useKnowledgeBaseStore } from '@/store/modules/knowledgeBase';
import type { DocumentItem } from '@/types/document';

const docStore = useDocumentStore();
const kbStore = useKnowledgeBaseStore();

const loading = computed(() => docStore.loading);
const knowledgeBases = computed(() => kbStore.list);

const filterKbId = ref<string>('');
const uploadDialogVisible = ref(false);
const selectedKbIds = ref<string[]>([]);
const pendingUploadData = ref<{ filename: string; content: string } | null>(null);

const filteredDocuments = computed(() => {
  if (!filterKbId.value) {
    return docStore.documents;
  }
  return docStore.documents.filter((doc) =>
    doc.knowledgeBaseIds.includes(filterKbId.value)
  );
});

onMounted(async () => {
  await Promise.all([
    docStore.fetchDocuments(),
    kbStore.list
  ]);
});

function handleRefresh() {
  docStore.fetchDocuments();
  ElMessage.success('已刷新');
}

function handleUploadClick() {
  selectedKbIds.value = [];
  pendingUploadData.value = null;
  uploadDialogVisible.value = true;
}

async function handleUploadSuccess(data: { filename: string; content: string }) {
  pendingUploadData.value = data;

  if (selectedKbIds.value.length === 0) {
    ElMessage.warning('请选择要关联的知识库');
    return;
  }

  // 创建 FormData 上传到后端
  try {
    const formData = new FormData();
    // 创建一个虚拟文件用于保存文档信息
    const blob = new Blob([data.content], { type: 'text/plain' });
    const file = new File([blob], data.filename, { type: 'text/plain' });
    formData.append('file', file);
    formData.append('knowledgeBaseIds', JSON.stringify(selectedKbIds.value));

    const success = await docStore.uploadDocument(file, selectedKbIds.value);
    if (success) {
      ElMessage.success('上传成功');
      uploadDialogVisible.value = false;
      pendingUploadData.value = null;
    } else {
      ElMessage.error('上传失败');
    }
  } catch (error) {
    ElMessage.error('上传失败: ' + (error as Error).message);
  }
}

function handleUploadError(error: { type: string; message: string }) {
  ElMessage.error(error.message);
}

async function handleDeleteDocument(doc: DocumentItem) {
  const success = await docStore.deleteDocument(doc.id);
  if (success) {
    ElMessage.success('删除成功');
  } else {
    ElMessage.error('删除失败');
  }
}
</script>

<style scoped>
.doc-manager-page {
  padding: 24px 28px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 4px;
}

.list-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
}

.doc-count {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
}

.upload-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kb-select-section {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.section-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.kb-select-section :deep(.el-checkbox) {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>
