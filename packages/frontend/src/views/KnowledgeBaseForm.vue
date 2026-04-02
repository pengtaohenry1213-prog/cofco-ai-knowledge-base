<template>
  <div class="kb-form-page">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/knowledge' }">知识库</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? '配置知识库' : '新建知识库' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="kb-form"
      @submit.prevent
    >
      <el-card shadow="never" class="section-card">
        <template #header>
          <span class="section-title">基础信息</span>
        </template>

        <el-form-item label="知识库名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入知识库名称" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="知识库类型" prop="kind" required>
          <div class="kind-row">
            <el-select v-model="form.kind" placeholder="请选择" style="width: 280px">
              <el-option label="本地文档库" value="local" />
              <el-option label="自定义知识库" value="custom" />
            </el-select>
            <el-tooltip
              v-if="form.kind === 'custom'"
              content="自定义对接外部 API 获取发布知识库数据"
              placement="right"
            >
              <el-icon class="hint-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
      </el-card>

      <el-card v-show="form.kind === 'custom'" shadow="never" class="section-card">
        <template #header>
          <span class="section-title">自定义对接配置</span>
        </template>

        <el-form-item label="选择自定义对接" prop="customConnectionId">
          <el-select
            v-model="form.customConnectionId"
            placeholder="请选择已配置的连接"
            clearable
            style="width: 320px"
          >
            <el-option
              v-for="c in connectionOptions"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="API名称" prop="apiName">
          <el-input v-model="form.apiName" placeholder="请输入 API 名称" style="max-width: 400px" />
        </el-form-item>

        <el-form-item label="字段映射" class="mapping-form-item">
          <div class="mapping-table-wrap">
            <el-table :data="form.fieldMappings" border stripe style="width: 100%">
              <el-table-column prop="fieldName" label="字段名称" min-width="140">
                <template #default="{ row }">
                  <el-input v-model="row.fieldName" placeholder="字段名称" />
                </template>
              </el-table-column>
              <el-table-column prop="paramName" label="参数名称" min-width="140">
                <template #default="{ row }">
                  <el-input v-model="row.paramName" placeholder="参数名称" />
                </template>
              </el-table-column>
              <el-table-column prop="updater" label="更新人" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.updater" placeholder="更新人" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="removeMappingRow($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="add-field-btn" @click="addMappingRow">
              <el-icon class="el-icon--left"><Plus /></el-icon>
              添加字段
            </el-button>
          </div>
        </el-form-item>
      </el-card>

      <div class="form-footer">
        <el-button type="primary" size="large" :loading="saving" @click="submit">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Plus, QuestionFilled } from '@element-plus/icons-vue';
import { useKnowledgeBaseStore } from '@/store/modules/knowledgeBase';
import type { FieldMappingRow, KnowledgeBaseKind } from '@/types/knowledgeBase';

const route = useRoute();
const router = useRouter();
const kbStore = useKnowledgeBaseStore();

const formRef = ref<FormInstance>();
const saving = ref(false);

const isEdit = computed(() => route.name === 'KnowledgeBaseEdit');
const editId = computed(() =>
  isEdit.value ? (route.params.id as string) : undefined
);

const connectionOptions = [
  { label: '默认外部连接 A', value: 'conn-a' },
  { label: '默认外部连接 B', value: 'conn-b' }
];

function emptyMappingRow(): FieldMappingRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fieldName: '',
    paramName: '',
    updater: ''
  };
}

const form = reactive({
  name: '',
  description: '',
  kind: 'local' as KnowledgeBaseKind,
  customConnectionId: '',
  apiName: '',
  fieldMappings: [] as FieldMappingRow[]
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  kind: [{ required: true, message: '请选择知识库类型', trigger: 'change' }],
  customConnectionId: [
    {
      validator: (_r, v, cb) => {
        if (form.kind === 'custom' && !String(v || '').trim()) {
          cb(new Error('请选择自定义对接'));
        } else {
          cb();
        }
      },
      trigger: 'change'
    }
  ]
};

watch(
  () => form.kind,
  (k) => {
    if (k === 'custom' && form.fieldMappings.length === 0) {
      form.fieldMappings.push(emptyMappingRow());
    }
  }
);

function loadEdit() {
  const id = editId.value;
  if (!id) return;
  const item = kbStore.getById(id);
  if (!item) {
    ElMessage.warning('知识库不存在');
    router.replace('/knowledge');
    return;
  }
  form.name = item.name;
  form.description = item.description;
  form.kind = item.kind;
  form.customConnectionId = item.customConnectionId ?? '';
  form.apiName = item.apiName ?? '';
  form.fieldMappings =
    item.fieldMappings?.length && item.kind === 'custom'
      ? item.fieldMappings.map((m) => ({ ...m, id: m.id || emptyMappingRow().id }))
      : item.kind === 'custom'
        ? [emptyMappingRow()]
        : [];
}

function resetFormForCreate() {
  form.name = '';
  form.description = '';
  form.kind = 'local';
  form.customConnectionId = '';
  form.apiName = '';
  form.fieldMappings = [];
  formRef.value?.clearValidate();
}

function syncFormWithRoute() {
  if (isEdit.value) {
    loadEdit();
  } else {
    resetFormForCreate();
  }
}

onMounted(syncFormWithRoute);

watch(
  () => [route.name, route.params.id] as const,
  () => {
    syncFormWithRoute();
  }
);

function addMappingRow() {
  form.fieldMappings.push(emptyMappingRow());
}

function removeMappingRow(index: number) {
  form.fieldMappings.splice(index, 1);
}

async function submit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    if (form.kind === 'custom' && form.fieldMappings.length === 0) {
      ElMessage.warning('请至少添加一行字段映射');
      return;
    }
    saving.value = true;
    try {
      const payload = {
        name: form.name,
        description: form.description,
        kind: form.kind,
        customConnectionId: form.customConnectionId,
        apiName: form.apiName,
        fieldMappings: form.kind === 'custom' ? [...form.fieldMappings] : []
      };
      if (isEdit.value && editId.value) {
        kbStore.update(editId.value, payload);
        ElMessage.success('保存成功');
      } else {
        kbStore.add(payload);
        ElMessage.success('创建成功');
      }
      router.push('/knowledge');
    } finally {
      saving.value = false;
    }
  });
}
</script>

<style scoped>
.kb-form-page {
  padding: 20px 28px 48px;
  max-width: 960px;
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 20px;
}

.section-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.section-title {
  font-weight: 600;
  color: #303133;
}

.kind-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-icon {
  font-size: 18px;
  color: #909399;
  cursor: help;
}

.mapping-form-item :deep(.el-form-item__content) {
  display: block;
}

.mapping-table-wrap {
  width: 100%;
}

.add-field-btn {
  margin-top: 12px;
}

.form-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.form-footer .el-button {
  min-width: 120px;
}
</style>
