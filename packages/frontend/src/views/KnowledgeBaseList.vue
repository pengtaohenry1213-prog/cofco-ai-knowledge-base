<template>
  <div class="kb-page">
    <h1 class="page-title">知识库</h1>

    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" class="filter-form" @submit.prevent>
        <el-form-item label="知识库名称">
          <el-input
            v-model="store.filterName"
            placeholder="请输入"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="创建人">
          <el-input
            v-model="store.filterCreator"
            placeholder="请输入"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="知识库类型">
          <el-select
            v-model="store.filterKind"
            placeholder="请选择"
            clearable
            style="width: 160px"
          >
            <el-option label="本地文档库" value="local" />
            <el-option label="自定义知识库" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="toolbar">
      <el-button type="primary" @click="router.push('/knowledge/new')">
        <el-icon class="el-icon--left"><Plus /></el-icon>
        新建知识库
      </el-button>
    </div>

    <el-row :gutter="20" class="card-grid">
      <el-col
        v-for="item in store.filteredList"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <el-card class="kb-card" shadow="hover">
          <div class="kb-card-head">
            <el-icon class="kb-icon"><FolderOpened /></el-icon>
            <div class="kb-card-titles">
              <div class="kb-name" :title="item.name">{{ item.name }}</div>
              <el-tag
                :type="item.status === 'published' ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ item.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </div>
          <div class="kb-meta">
            <span>创建人：{{ item.creator }}</span>
            <span>{{ item.createdAt }}</span>
          </div>
          <div class="kb-actions">
            <el-button link type="primary" @click="openDetail(item)">详情</el-button>
            <el-button link type="primary" @click="goConfig(item.id)">配置</el-button>
            <el-button link type="danger" @click="onDelete(item)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty
      v-if="store.filteredList.length === 0"
      description="暂无知识库"
      class="empty-block"
    />

    <el-dialog v-model="detailVisible" title="知识库详情" width="520px" destroy-on-close>
      <template v-if="detailItem">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="名称">{{ detailItem.name }}</el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ detailItem.description || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ detailItem.kind === 'custom' ? '自定义知识库' : '本地文档库' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            {{ detailItem.status === 'published' ? '已发布' : '草稿' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detailItem.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailItem.createdAt }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, FolderOpened } from '@element-plus/icons-vue';
import { useKnowledgeBaseStore } from '@/store/modules/knowledgeBase';
import type { KnowledgeBaseItem } from '@/types/knowledgeBase';

const router = useRouter();
const store = useKnowledgeBaseStore();

const detailVisible = ref(false);
const detailItem = ref<KnowledgeBaseItem | null>(null);

function onSearch() {
  /* 筛选由 store 与 computed 实时生效；后续可改为请求服务端 */
}

function onReset() {
  store.resetFilters();
}

function openDetail(item: KnowledgeBaseItem) {
  detailItem.value = item;
  detailVisible.value = true;
}

function goConfig(id: string) {
  router.push({ name: 'KnowledgeBaseEdit', params: { id } });
}

async function onDelete(item: KnowledgeBaseItem) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.name}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    store.remove(item.id);
    ElMessage.success('已删除');
  } catch {
    /* 用户取消 */
  }
}
</script>

<style scoped>
.kb-page {
  padding: 24px 28px 40px;
  max-width: 1280px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 4px;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.toolbar {
  margin-bottom: 20px;
}

.card-grid {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.kb-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.kb-card-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.kb-icon {
  font-size: 36px;
  color: #409eff;
  flex-shrink: 0;
}

.kb-card-titles {
  flex: 1;
  min-width: 0;
}

.kb-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.kb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.empty-block {
  padding: 48px 0;
}
</style>
