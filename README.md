<!--
 * @Author: pengtaohenry1213-prog pengtaohenry1213@gmail.com
 * @Date: 2026-03-17 18:37:02
 * @LastEditors: pengtaohenry1213-prog pengtaohenry1213@gmail.com
 * @LastEditTime: 2026-04-08 14:40:00
 * @FilePath: /cofco-ai-knowledge-base/README.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
# cofco-ai-knowledge-base

cofco AI 智能知识库助手，一个AI知识库问答系统。

这份代码文件集合属于**企业级AI智能知识库助手**项目的基础架构，采用 `pnpm monorepo` 多包管理模式，拆分为「前端（Vue3+TS+Vite）、后端（Express+TS）、共享类型包」三个核心子包，采用 RAG（检索增强生成）架构，实现文档上传 → 解析 → 向量化 → 智能问答的完整流程，以下是各文件的详细说明：

**技术栈：**

- 前端：Vue3 + Vite + TypeScript + Element Plus
- 后端：Express + TypeScript + Monorepo (pnpm)
- 共享包：`@ai-ka/shared`（统一类型定义）

## 一、根目录文件（项目全局配置）

| 文件路径                           | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `package.json`                    | 根项目配置：<br>1. 定义 `workspaces` 管理子包（frontend、backend、shared）；<br>2. 提供启动脚本（并行/单独启动前后端）；<br>3. 指定 `pnpm` 包管理器版本。 |
| `tsconfig.json`                   | 全局 TypeScript 配置：<br>1. 启用严格模式（`strict: true`）；<br>2. 统一编译目标（ES2020）、模块解析规则；<br>3. 排除 `node_modules`/`dist` 目录。 |
| `.env`                            | 全局环境变量：<br>1. 配置后端服务端口（`PORT=3000`）；<br>2. 配置豆包API密钥/基础地址（业务核心配置）。 |
| `pnpm-workspace.yaml`              | pnpm 工作区配置：指定子包目录（`packages/*`），让pnpm识别并管理多包依赖。 |

## 二、shared 共享包（@ai-ka/shared）

前后端**统一数据类型**的核心包，避免类型不一致问题，目录路径：`packages/shared/`

| 文件路径                          | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `package.json`                    | 子包元配置：<br>1. 命名 `@ai-ka/shared`，标记私有；<br>2. 指定入口（`src/index.ts`）和TS依赖。 |
| `src/index.ts`                    | 共享类型统一出口：导出 `src/types` 下的所有类型，简化前后端导入方式。     |
| `src/types/chat.ts`               | 定义核心业务类型：<br>1. `ChatItem`：单条聊天消息（ID/内容/角色/时间戳）；<br>2. `HistoryItem`：会话历史（会话ID/标题/消息列表/创建时间）。 |

## 三、frontend 前端包（@ai-ka/frontend）

基于 Vue3 + TypeScript + Vite 的前端项目，目录路径：`packages/frontend/`

### 基础配置文件

| 文件路径                          | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `package.json`                    | 前端项目配置：<br>1. 脚本：`dev`（启动开发服务）、`build`（构建）、`preview`（预览）；<br>2. 依赖：Vue3、Pinia（状态管理）、VueRouter（路由）、Axios（请求）；<br>3. 开发依赖：Vite、Vue插件、TS、vue-tsc（TS类型检查）。 |
| `vite.config.ts`                  | Vite 核心配置：<br>1. 注册 Vue 插件；<br>2. 路径别名（`@` 指向 `src`，`@ai-ka/shared` 指向共享包）；<br>3. 开发服务器（端口8080）、接口代理（`/api` 转发到后端3000端口）。 |
| `tsconfig.json`                   | 前端TS配置：<br>1. 继承全局TS配置；<br>2. 补充路径别名、DOM相关库、代码包含范围；<br>3. 严格模式（继承全局配置）。 |
| `index.html`                      | 前端入口HTML：挂载Vue应用到 `#app` 节点，引入 `src/main.ts` 作为入口脚本。 |
| `src/vite-env.d.ts`               | Vite 类型声明：<br>1. 声明 `.vue` 文件模块类型；<br>2. 补充Vite客户端类型。 |

### Step1 补充的核心业务文件（前端功能骨架）

| 文件路径                          | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `src/main.ts`                     | Vue应用入口：<br>1. 创建App实例；<br>2. 集成Pinia（状态管理）、VueRouter（路由）；<br>3. 挂载到 `#app` 节点。 |
| `src/router/index.ts`             | 路由配置：<br>1. 定义核心路由（文档上传页、智能对话页、知识库管理等）；<br>2. 配置路由模式/基础路径。 |
| `src/store/index.ts`              | Pinia 状态管理：<br>1. 创建根Store；<br>2. 定义基础状态（如会话列表、上传文件列表）；<br>3. 提供增删改查的action。 |
| `src/store/modules/knowledgeBase.ts` | 知识库状态管理模块 |
| `src/store/modules/document.ts`   | 文档状态管理模块 |
| `src/utils/request.ts`            | Axios 封装：<br>1. 创建Axios实例（配置基础URL/超时时间）；<br>2. 请求拦截器（添加token/统一请求格式）；<br>3. 响应拦截器（统一解析/错误处理）；<br>4. 导出请求方法（get/post等）。 |
| `src/App.vue`                     | 根组件：<br>1. 包含导航栏（切换上传/对话页）；<br>2. 提供路由出口（`<router-view>`）；<br>3. 基础布局样式。 |
| `src/views/`                      | 页面组件目录：<br>1. `DocumentUpload.vue`（文档上传）；<br>2. `IntelligentChat.vue`（智能对话）；<br>3. `KnowledgeBaseForm.vue`（知识库表单）；<br>4. `KnowledgeBaseList.vue`（知识库列表）；<br>5. `DocumentManager.vue`（文档管理）。 |
| `src/components/`                 | 公共组件目录：存放可复用组件（如上传按钮、聊天消息气泡、PDF预览）。 |
| `src/api/`                        | API接口目录：封装前后端交互的接口函数（基于request.ts）。 |

## 四、backend 后端包（@ai-ka/backend）

基于 Express + TypeScript 的后端服务，目录路径：`packages/backend/`

### 基础配置文件

| 文件路径                          | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `package.json`                    | 后端项目配置：<br>1. 脚本：`dev`（ts-node启动开发服务）、`build`（TS编译）、`start`（启动编译后代码）；<br>2. 依赖：Express（Web框架）、cors（跨域）、dotenv（环境变量）；<br>3. 开发依赖：TS、ts-node、Express/cors/Node类型声明。 |
| `tsconfig.json`                   | 后端TS配置：<br>1. 启用严格模式；<br>2. 配置编译目标/模块解析；<br>3. 路径别名（`@` 指向 `src`）；<br>4. 排除编译输出/第三方依赖。 |
| `src/index.ts`                    | 后端入口：<br>1. 加载根目录 `.env` 环境变量；<br>2. 配置中间件（CORS、JSON解析、URL编码）；<br>3. 注册路由（chat、document、file、history）；<br>4. 提供健康检查接口（`/api/health`）；<br>5. 启动HTTP服务（监听3000端口）。 |
| `src/config/index.ts`             | 配置管理：统一管理所有配置项（API密钥、端点、超时等），添加配置项缺失校验。 |
| `vitest.config.ts`               | Vitest 测试配置。 |

### 核心业务文件（后端服务层）

| 文件路径                          | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `src/routes/chat.route.ts`        | 聊天路由：非流式对话 `/chat/normal`、流式对话 `/chat/stream`。 |
| `src/routes/document.route.ts`   | 文档路由：上传 `/documents/upload`、列表 `/documents`、详情 `/documents/:id`、删除 `/documents/:id`、知识库关联。 |
| `src/routes/file.route.ts`        | 文件路由：文件上传解析 `/file/upload`。 |
| `src/routes/history.route.ts`     | 历史记录路由：查询、清空对话历史。 |
| `src/services/llm.service.ts`     | LLM 服务：调用豆包对话 API，支持非流式/流式输出、自动重试、超时控制。 |
| `src/services/embedding.service.ts` | Embedding 服务：文本向量化、向量存储与检索（VectorStore 类）。 |
| `src/services/retrieval.service.ts` | 检索服务：向量相似度检索 `searchTopK`。 |
| `src/services/chat.service.ts`   | 聊天服务：RAG 核心流程、Prompt 构造。 |
| `src/services/file.service.ts`    | 文件解析服务：PDF/Word 解析、文本提取。 |
| `src/services/document.service.ts` | 文档管理服务：CRUD 文档记录、关联知识库。 |
| `src/services/history.service.ts` | 历史记录服务：对话历史存储与查询。 |
| `src/services/prompt.service.ts`  | Prompt 服务：Prompt 模板管理。 |
| `src/utils/similarity.ts`         | 相似度计算：余弦相似度计算工具函数。 |
| `src/utils/file.util.ts`          | 文件工具：文件名编码修正、文件清理等。 |
| `src/utils/streamResponse.ts`     | 流式响应工具：Express 流式响应封装。 |
| `src/types/*.ts`                  | 类型定义：config、document、embedding、file、history 等类型。 |

## 核心协作关系

1. **类型统一**：前端/后端均导入 `@ai-ka/shared` 的类型，保证聊天/会话数据格式一致；
2. **接口通信**：前端通过Axios（`request.ts`）请求 `/api` 接口，Vite代理转发到后端3000端口；
3. **工程化管理**：根目录脚本通过 `pnpm --filter` 指令分别启动/管理前后端子包；
4. **环境隔离**：全局 `.env` 管理核心配置，前后端各自的配置文件按需读取。

该架构的核心优势是**模块化拆分**（前后端/共享逻辑分离）、**类型安全**（全栈TS+共享类型）、**工程化便捷**（pnpm monorepo统一管理依赖/脚本），为企业级AI知识库助手提供了可扩展的基础骨架。

## 五、AI 模型配置

### 1. LLM（大型语言模型）

| 配置项 | 值 |
|--------|-----|
| **服务商** | 豆包（字节跳动） |
| **模型** | Doubao-Seed-2.0-Code (`doubao-seed-2-0-code-preview-260215`) |
| **API 端点** | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` |
| **计费方式** | 按 Token 收费 |

### 2. Embedding（文本向量化）

| 配置项 | 主方案 | 备用方案 |
|--------|--------|----------|
| **服务商** | SiliconFlow（免费） | 豆包 |
| **模型** | `BAAI/bge-large-zh-v1.5` | `doubao-embedding` |
| **向量维度** | 1024+ | - |
| **费用** | **免费** | 按量收费 |

---

## 六、核心 AI 服务

### 1. LLM 对话服务 (`llm.service.ts`)

```
packages/backend/src/services/llm.service.ts
```

**功能：**

- `chatCompletion(prompt)` - 非流式对话
- `chatCompletionStream(prompt, onChunk, onError)` - 流式对话
- 自动重试机制（最多 2 次）
- 超时控制（30 秒）

```typescript
// 调用示例
const result = await chatCompletion(prompt);
if (result.success) {
  console.log(result.data.answer);
}
```

### 2. Embedding 服务 (`embedding.service.ts`)

```
packages/backend/src/services/embedding.service.ts
```

**功能：**

- `createEmbedding(text)` - 将文本转为向量
- `splitIntoChunks(text, chunkSize, overlap)` - 智能分块（按句子边界）
- `VectorStore` 类 - 向量存储与检索

**分块策略：**

- 默认块大小：500 字
- 重叠字数：100 字
- 按中英文句号/感叹号/问号切分

```typescript
// 分块示例
const chunks = splitIntoChunks(text, 500, 100);
// [{ id: 'chunk-0', content: '...' }, ...]
```

### 3. 检索服务 (`retrieval.service.ts`)

```
packages/backend/src/services/retrieval.service.ts
```

**功能：**

- `searchTopK(question, k, knowledgeBaseId?)` - 向量相似度检索
- 支持按知识库隔离检索
- 使用余弦相似度计算

```typescript
const result = await searchTopK('如何配置知识库？', 5);
if (result.success) {
  console.log(result.chunks); // 最相关的 5 个文本块
}
```

### 4. 文档问答服务 (`chat.service.ts`)

```
packages/backend/src/services/chat.service.ts
```

**功能：**

- `chatWithDocument(question, documentText?, topK?)` - RAG 核心流程
- 自动判断字数统计类问题
- 构造系统提示词

**RAG 流程：**

```
用户问题 → 向量化问题 → 向量库检索 TopK → 拼接 Prompt → LLM 生成回答
```

---

## 七、知识库架构

### 1. 知识库类型

| 类型 | 说明 |
|------|------|
| **local** | 本地文档库 - 上传 PDF/Word 文件 |
| **custom** | 自定义知识库 - 对接外部 API |

### 2. 文档解析

支持格式：

- **PDF**：`pdfjs-dist` 提取原生文本
- **Word**：`.docx` 文件解析

### 3. 知识库配置

- 字段映射：支持自定义字段到 API 参数的映射
- API 配置：外部知识库的对接设置

---

## 八、前端 AI 交互

### 1. 智能对话页面 (`IntelligentChat.vue`)

```
packages/frontend/src/views/IntelligentChat.vue
```

**功能：**

- 知识库选择下拉
- 实时流式输出（打字机效果）
- 多轮对话历史
- 对话历史切换

### 2. 聊天消息组件 (`ChatList.vue`)

```
packages/frontend/src/components/ChatList.vue
```

**特性：**

- 用户/助手消息样式区分
- Markdown 格式渲染（代码块、加粗等）
- 加载状态动画
- 自动滚动到底部

### 3. 知识库表单 (`KnowledgeBaseForm.vue`)

```
packages/frontend/src/views/KnowledgeBaseForm.vue
```

**功能：**

- 创建/编辑知识库
- 上传文档
- 字段映射配置

### 4. 文档上传页面 (`DocumentUpload.vue`)

```
packages/frontend/src/views/DocumentUpload.vue
```

**功能：**

- 文件上传组件集成
- PDF 预览组件集成
- 上传进度显示

### 5. PDF 预览组件 (`PdfPreview.vue`)

```
packages/frontend/src/components/PdfPreview.vue
```

**功能：**

- PDF 文件预览
- 页码导航
- 缩放控制

### 6. 文件上传组件 (`FileUpload.vue`)

```
packages/frontend/src/components/FileUpload.vue
```

**功能：**

- 拖拽上传
- 文件类型校验
- 上传进度显示

---

## 九、环境配置

### `.env` 文件配置

```bash
# 豆包 LLM（必需）
DOUBAO_API_KEY=279dc1d3-2003-4aa2-baea-xxx

# SiliconFlow Embedding（可选，免费）
SILICONFLOW_API_KEY=sk-exhxrlinysleblmmejzrhqaikgjgvervyhaosjrvzaxjmxpp

# 服务器端口
PORT=3000
```

### 配置加载逻辑

```typescript
// packages/backend/src/config/index.ts
if (config.siliconFlow?.apiKey) {
  // 使用 SiliconFlow（免费）
  endpoint: "https://api.siliconflow.cn/v1/embeddings"
  model: "BAAI/bge-large-zh-v1.5"
} else {
  // 回退到豆包（收费）
  endpoint: "https://ark.cn-beijing.volces.com/api/v3/embeddings4"
  model: "doubao-embedding"
}
```

---

## 十、API 接口

### 聊天接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/chat/normal` | POST | 非流式文档问答 |
| `/api/chat/stream` | POST | 流式文档问答 |

### 文档接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/documents/upload` | POST | 上传文档到知识库 |
| `/api/documents` | GET | 获取文档列表 |
| `/api/documents/:id` | GET | 获取文档详情 |
| `/api/documents/:id` | DELETE | 删除文档 |
| `/api/documents/:id/knowledgebases` | POST | 添加文档到知识库 |
| `/api/documents/:id/knowledgebases/:kbId` | DELETE | 从知识库移除文档 |

### 文件接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/file/upload` | POST | 上传并解析文件 |

### 历史记录接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/history` | GET | 获取对话历史 |
| `/api/history` | DELETE | 清空对话历史 |

---

## 十一、数据流图

```mermaid
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (Vue3)                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ 文档上传页    │    │ 智能对话页    │    │ 知识库管理页      │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘   │
└─────────┼───────────────────┼─────────────────────┼─────────────┘
          │                   │                     │
          ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端 (Express)                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ file.service │    │ chat.service │    │ knowledge.service│  │
│  │  - PDF解析    │    │  - RAG流程   │    │  - 知识库CRUD    │  │
│  │  - Word解析   │    │  - Prompt    │    │                  │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                     │             │
│         ▼                   ▼                     │             │
│  ┌──────────────┐    ┌──────────────┐            │             │
│  │embedding.   │    │  llm.service  │            │             │
│  │service      │    │  - 豆包LLM    │            │             │
│  │  - 向量化    │    └──────┬───────┘            │             │
│  │  - 分块      │           │                    │             │
│  └──────┬───────┘           │                    │             │
│         │                   │                    │             │
│         ▼                   │                    │             │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              VectorStore (内存向量库)               │        │
│  │   Map<knowledgeBaseId, VectorItem[]>               │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
          │                   │
          ▼                   ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│  SiliconFlow    │  │         豆包 ARK API                    │
│  (Embedding)    │  │         (LLM)                           │
│  免费 · BGE     │  │         Seed-2.0-Code                   │
└─────────────────┘  └─────────────────────────────────────────┘
```

---

## 十二、RAG 数据流：检索 → Prompt → LLM

### 1. 检索环节 (`retrieval.service.ts`)

``` packages/backend/src/services/retrieval.service.ts
export async function searchTopK(
  question: string,
  k: number = 1,
  knowledgeBaseId?: string
): Promise<RetrievalResult> {
  // ...
  const vectors = knowledgeBaseId
    ? await vectorStore.queryByKnowledgeBase(question, knowledgeBaseId, k)
    : await vectorStore.query(question, k);

  // 无文档时返回错误
  if (vectors.length === 0) {
    return {
      success: false,
      error: knowledgeBaseId ? '该知识库暂无文档' : '暂无文档'
    };
  }

  // 直接返回检索结果
  return {
    success: true,
    chunks: vectors.map((v) => v.content)  // ← 只返回文本内容，不返回向量
  };
}
```

`searchTopK` 返回的是 **文本块数组**（`chunks`），而不是向量本身。

### 2. 拼接待 LLM 的 Prompt (`chat.service.ts`)

```10:22:packages/backend/src/services/chat.service.ts
export function buildDocumentQaPrompt(question: string, contextText: string): string {
  return `你是一名知识库助手。下方「文档内容」是当前知识库提供的文本（可能为全文或检索片段），请严格依据该文本作答。

规则：
1. 若问题与文档本身相关（例如字数、字符数、段落数、标题、摘要、主题、关键词、语言风格等），请根据所给文本直接统计或归纳，并给出明确结果。
2. 若问题询问文档中的事实、观点、数据，仅在文本有据可查或可合理推断时回答；否则说明无法根据现有文档回答。
3. 不要编造文本中不存在的内容。

文档内容：
${contextText}

问题：${question}`;
}
```

### 3. 完整流程图

```
用户提问："如何配置知识库？"
        │
        ▼
┌─────────────────────────────────────┐
│  retrieval.service.ts               │
│  searchTopK(question, k=5)         │
│                                     │
│  1. 将问题转为向量 (createEmbedding)│
│  2. 与内存中的向量计算余弦相似度     │
│  3. 排序取 TopK                     │
│  4. 返回 { chunks: [文本块1, ...] }│
└─────────────────┬───────────────────┘
                  │
                  ▼
        [ "配置知识库需要...",
          "点击新建知识库...",
          "上传文档后..." ]  ← 检索到的相关文本
                  │
                  ▼
┌─────────────────────────────────────┐
│  chat.service.ts                    │
│  buildDocumentQaPrompt()           │
│                                     │
│  拼接为：                           │
│  "你是一名知识库助手。..."          │
│  "文档内容：\n[检索文本1]\n\n[检索文本2]..." │
│  "问题：如何配置知识库？"          │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  llm.service.ts                    │
│  chatCompletion(prompt)            │
│                                     │
│  → 豆包 LLM API                     │
│  → 返回生成的回答                   │
└─────────────────────────────────────┘
```

### 关键点

| 环节 | 职责 | 输出 |
|------|------|------|
| `vectorStore.query()` | 计算余弦相似度，取 TopK | `VectorItem[]`（含 content 和 embedding） |
| `searchTopK()` | 提取文本，返回数组 | `chunks: string[]` |
| `buildDocumentQaPrompt()` | 拼接系统提示 + 上下文 + 问题 | 完整 prompt 字符串 |
| `chatCompletion()` | 发送请求到豆包 | LLM 回答 |

所以 **检索服务只负责找到最相关的文本块**，拼接到 prompt 里喂给 LLM 是 `chat.service.ts` 的职责。

## 十三、关键文件索引

| 功能模块 | 文件路径 |
|---------|---------|
| LLM 对话 | `packages/backend/src/services/llm.service.ts` |
| Embedding | `packages/backend/src/services/embedding.service.ts` |
| 检索 | `packages/backend/src/services/retrieval.service.ts` |
| 文档问答 | `packages/backend/src/services/chat.service.ts` |
| 配置文件 | `packages/backend/src/config/index.ts` |
| 智能对话 | `packages/frontend/src/views/IntelligentChat.vue` |
| 聊天组件 | `packages/frontend/src/components/ChatList.vue` |
| 知识库表单 | `packages/frontend/src/views/KnowledgeBaseForm.vue` |
| 环境配置 | `.env` |
| 模型说明 | `config/doubao-model.md`, `config/siliconFlow-model.md` |

---

## 启动命令

### 并行启动前后端

`pnpm run dev`

### 单独启动后端

`pnpm run dev:backend`

### 单独启动前端

`pnpm run dev:frontend`

## 补充说明

所有代码遵循 Vue3 Composition API 规范，TypeScript 严格模式已启用，类型定义完整；
Axios 拦截器包含请求头（token）注入、响应业务码校验、统一错误提示（需提前安装 element-plus 或替换为项目 UI 库的消息组件）；
路由配置包含基础导航守卫，默认跳转至智能对话页；
Pinia 状态管理封装了文档上传和智能对话的核心状态，方法均为响应式；
路径别名 @/ 已配置并指向 src 目录，可直接在代码中使用。

## 操作文档

`doc/steps-dev.md`
