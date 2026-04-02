import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  KnowledgeBaseItem,
  KnowledgeBaseFormPayload,
  FieldMappingRow
} from '@/types/knowledgeBase';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const seed: KnowledgeBaseItem[] = [
  {
    id: 'kb-1',
    name: '测试Excel账号',
    description: '示例知识库',
    kind: 'local',
    status: 'published',
    creator: '张三',
    createdAt: '2024-01-15 14:30:00'
  },
  {
    id: 'kb-2',
    name: '产品说明文档库',
    description: '',
    kind: 'local',
    status: 'draft',
    creator: '李四',
    createdAt: '2024-02-01 09:00:00'
  },
  {
    id: 'kb-3',
    name: '外部合规数据',
    description: '自定义对接',
    kind: 'custom',
    status: 'published',
    creator: '王五',
    createdAt: '2024-02-20 16:45:00',
    customConnectionId: 'conn-a',
    apiName: 'compliance-api'
  }
];

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  const list = ref<KnowledgeBaseItem[]>([...seed]);

  const filterName = ref('');
  const filterCreator = ref('');
  const filterKind = ref<'' | 'local' | 'custom'>('');

  const filteredList = computed(() => {
    return list.value.filter((item) => {
      if (filterName.value && !item.name.includes(filterName.value.trim())) {
        return false;
      }
      if (filterCreator.value && !item.creator.includes(filterCreator.value.trim())) {
        return false;
      }
      if (filterKind.value && item.kind !== filterKind.value) {
        return false;
      }
      return true;
    });
  });

  function resetFilters() {
    filterName.value = '';
    filterCreator.value = '';
    filterKind.value = '';
  }

  function getById(id: string) {
    return list.value.find((x) => x.id === id);
  }

  function add(payload: KnowledgeBaseFormPayload) {
    const row: KnowledgeBaseItem = {
      id: uid(),
      name: payload.name.trim(),
      description: payload.description.trim(),
      kind: payload.kind,
      status: 'draft',
      creator: '当前用户',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      customConnectionId: payload.kind === 'custom' ? payload.customConnectionId : undefined,
      apiName: payload.kind === 'custom' ? payload.apiName : undefined,
      fieldMappings:
        payload.kind === 'custom' ? payload.fieldMappings.map((m) => ({ ...m })) : undefined
    };
    list.value.unshift(row);
    return row.id;
  }

  function update(id: string, payload: KnowledgeBaseFormPayload) {
    const idx = list.value.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    const prev = list.value[idx];
    list.value[idx] = {
      ...prev,
      name: payload.name.trim(),
      description: payload.description.trim(),
      kind: payload.kind,
      customConnectionId: payload.kind === 'custom' ? payload.customConnectionId : undefined,
      apiName: payload.kind === 'custom' ? payload.apiName : undefined,
      fieldMappings:
        payload.kind === 'custom'
          ? payload.fieldMappings.map((m) => ({ ...m }))
          : undefined
    };
    return true;
  }

  function remove(id: string) {
    const idx = list.value.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    list.value.splice(idx, 1);
    return true;
  }

  return {
    list,
    filterName,
    filterCreator,
    filterKind,
    filteredList,
    resetFilters,
    getById,
    add,
    update,
    remove
  };
});
