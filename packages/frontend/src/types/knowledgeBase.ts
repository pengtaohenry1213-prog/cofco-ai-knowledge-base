/** 知识库类型：本地文档 / 自定义对接外部 API */
export type KnowledgeBaseKind = 'local' | 'custom';

export type KnowledgeBaseStatus = 'published' | 'draft';

export interface FieldMappingRow {
  id: string;
  fieldName: string;
  paramName: string;
  updater: string;
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  kind: KnowledgeBaseKind;
  status: KnowledgeBaseStatus;
  creator: string;
  createdAt: string;
  /** 自定义对接：连接标识、API 名称（展示用） */
  customConnectionId?: string;
  apiName?: string;
  fieldMappings?: FieldMappingRow[];
  /** 本地文档库：关联的文档数量 */
  documentCount?: number;
  /** 本地文档库：总块数 */
  totalChunks?: number;
}

export interface KnowledgeBaseFormPayload {
  name: string;
  description: string;
  kind: KnowledgeBaseKind;
  customConnectionId: string;
  apiName: string;
  fieldMappings: FieldMappingRow[];
}
