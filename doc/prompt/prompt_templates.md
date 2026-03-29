# 通用 Prompt 模板（所有任务通用）

## 🎯 任务目标

<这里写任务，例如：实现文件上传组件 FileUpload.vue>

## 🧱 项目背景（必须保留）

这是一个「RAG 智能知识库项目」：

* 前端：Vue3 + TypeScript + Vite
* 后端：Express + Node.js
* AI：Embedding + 相似度检索 + LLM（豆包 API）
* 当前目标：**优先跑通核心链路（上传 → embedding → 检索 → 对话）**

## 📦 当前上下文（非常重要）

<粘贴当前已有代码 or 简要说明当前已完成什么>

## 📋 任务要求（严格执行）

<粘贴你原文档中的某一个任务>

## ⚠️ 强约束（必须遵守）

1. 使用 TypeScript，所有类型必须定义清晰
2. 按“分层结构”写代码（route / service / utils / types）
3. 不要引入额外重型依赖
4. 代码必须可运行，不要伪代码
5. 输出完整文件代码（不要只写片段）
6. 如果涉及多个文件，请按“文件路径 + 代码”结构输出

## 📤 输出格式（必须严格）

请按如下格式输出：

### 文件1：<文件路径>

```ts
// 完整代码
```

### 文件2：<文件路径>

```ts
// 完整代码
```

## 🚫 禁止行为

* 不要省略代码
* 不要只写思路
* 不要假设未提供的上下文
* 不要修改未要求的模块

---

# 整体工程流（你要建立这个脑图）

```text
需求（你的文档）
   ↓
拆任务（你已经有了 ✅）
   ↓
Cursor 单任务生成代码
   ↓
人工 Review（关键！）
   ↓
Git 提交（原子提交）
   ↓
继续下一个任务
```

# 核心原则（非常重要）

### 1️⃣ 永远“小步提交”（禁止一把梭）

❌ 错误：

```bash
feat: 完成整个RAG系统
```

✅ 正确：

```bash
feat: 初始化前端项目
feat: 实现文件上传组件
feat: 实现embedding服务
```

---

### 2️⃣ 一个任务 = 一个 commit
👉 你的文档刚好已经满足这个原则（非常优秀）

---

### 3️⃣ Cursor 只负责“写代码”，你负责“做决策”
👉 你是 Tech Lead，不是打字员


# 开发节奏

## 🥇 Step 1：创建任务分支

```bash
git checkout -b feat/file-upload
```

---

## 🥈 Step 2：喂 Cursor（用你刚才的 Prompt 模板）

👉 比如：

```text
任务：实现 FileUpload.vue
（贴模板）
```

---

## 🥉 Step 3：人工 Review（必须做）

重点检查👇

### ✅ 是否真的满足需求

* 文件类型限制 ✔
* 大小限制 ✔
* 进度条 ✔

---

### ⚠️ 是否“AI 常见坑”

* ❌ 类型写 any
* ❌ 错误处理缺失
* ❌ 写死路径
* ❌ 假逻辑（mock）

---

# 《AI智能知识库助手》Cursor - Prompt 专用任务模板

# 🧩 模板1：前端初始化（高成功率版）

## 🎯 任务目标
初始化 Vue3 + TS + Vite 前端项目结构，搭建基础可扩展的项目骨架

## 🧱 项目背景
这是一个企业级AI智能知识库助手项目，需前后端分离开发，前端负责文档上传、智能对话、流式输出等核心交互。

## 📋 任务要求
* 使用 `npm create vite@latest` 创建 Vue + TypeScript 模板项目
* 清理默认无用代码（HelloWorld组件、默认样式等）
* 配置 tsconfig.json（补充路径别名、启用严格模式）
* 封装 Axios 请求库（请求拦截器、响应拦截器、错误处理）
* 集成 Pinia 实现内存级状态管理
* 配置基础路由（文档上传页 / 智能对话页）
* 按「views / components / utils / api」分层搭建目录结构

## ⚠️ 强约束
* 必须提供完整可运行的项目结构和代码
* 所有代码使用 Vue3 Composition API 编写
* TypeScript 类型定义完整，启用严格模式
* 路由、Pinia、Axios 配置需直接可用

## 📤 输出格式
请输出：
1. 项目目录结构（tree 形式）
2. 关键文件完整代码：
   * main.ts
   * tsconfig.json
   * router/index.ts
   * store/index.ts
   * utils/request.ts

## 🚫 禁止行为
* 不要省略关键配置项
* 不要写伪代码或占位符
* 不要引入非必要依赖

---

# 🧩 模板2：前端文件上传组件（核心交互）

## 🎯 任务目标
开发独立可复用的 FileUpload.vue 组件，支持PDF/Word上传、校验、解析调用

## 🧱 项目背景
AI智能知识库助手需要先上传解析文档，才能基于文档内容进行智能对话，该组件是核心入口。

## 📋 任务要求
* 基于 Vue3 Composition API + TS 编写
* 支持选择/拖拽上传 PDF (.pdf) / Word (.docx) 文件
* 前端校验：文件类型（仅允许pdf/docx）、文件大小（≤10MB），校验失败给出清晰文字提示
* 上传时显示进度条，成功/失败显示对应状态图标
* 调用后端 /api/file/upload 接口，解析返回文本并通过 emit 传递给父组件
* 组件样式简洁，仅保留核心交互（无需复杂UI）

## ⚠️ 强约束
* 必须添加完整 TS 类型定义（文件上传结果、错误类型等）
* 拖拽上传需处理边界（如多文件拖拽仅取第一个）
* 接口调用封装到 api/file.ts 中，组件仅调用封装方法

## 📤 输出格式
### 文件1：src/components/FileUpload.vue
```vue
// 完整可运行代码（模板+脚本+样式）
```
### 文件2：src/api/file.ts
```ts
// 封装文件上传/解析接口的完整代码
```

## 🚫 禁止行为
* 不要忽略文件大小/类型校验
* 不要硬编码接口地址
* 不要使用 Options API

---

# 🧩 模板3：前端文本预览组件

## 🎯 任务目标
开发 TextPreview.vue 组件，展示解析后的文档文本，支持基础交互

## 🧱 项目背景
用户上传文档后需要预览解析结果，确认文档内容是否正确解析，为后续对话提供依据。

## 📋 任务要求
* 接收父组件传递的解析后文本内容，以只读滚动容器展示
* 支持文本长度统计（显示“当前文本长度：XXX字”）
* 支持一键复制全部文本功能
* 空状态（无文本时）显示“请先上传并解析文档”提示
* 组件适配基础响应式（宽度自适应）

## ⚠️ 强约束
* 使用 TS 严格定义 props 类型（text: string）
* 复制功能需处理成功/失败提示
* 文本展示区域需限制最大高度并支持滚动

## 📤 输出格式
### 文件：src/components/TextPreview.vue
```vue
// 完整可运行代码（模板+脚本+样式）
```

## 🚫 禁止行为
* 不要省略空状态处理
* 不要忽略复制功能的异常捕获

---

# 🧩 模板4：前端流式请求工具函数（核心工具）

## 🎯 任务目标
在 utils/request.ts 中封装 Fetch 流式请求函数，适配AI流式回答

## 🧱 项目背景
前端需要接收后端流式返回的AI回答，实现打字机效果，需专门封装流式请求逻辑。

## 📋 任务要求
* 基于 Fetch API 编写（非 Axios）
* 接收请求URL、请求参数（用户问题）
* 逐行解析流式响应（JSON行格式：每行独立JSON，\n分隔）
* 通过回调函数传递数据：
  - onChunk：每段文本chunk和finish状态
  - onFinish：标记流式结束
  - onError：处理异常（网络中断、后端报错）
* 支持取消请求（AbortController）

## ⚠️ 强约束
* 完整 TS 类型定义（流式响应类型、回调函数类型）
* 必须处理流式响应的异常边界
* 函数需通用可复用，不耦合业务逻辑

## 📤 输出格式
### 文件：src/utils/request.ts
```ts
// 包含常规Axios请求 + 新增流式Fetch请求的完整代码
```

## 🚫 禁止行为
* 不要使用 Axios 实现流式请求
* 不要忽略 AbortController 取消请求逻辑
* 不要写死请求参数或URL

---

# 🧩 模板5：前端对话列表+打字机效果组件

## 🎯 任务目标
开发 ChatList.vue 组件，渲染对话列表并实现AI回答打字机流式效果

## 🧱 项目背景
用户与AI知识库对话时，需要直观展示对话记录，且AI流式回答需有打字机效果提升交互体验。

## 📋 任务要求
* 接收对话列表数据（TS类型：ChatItem = { id: string; role: 'user' | 'assistant'; content: string }）
* 渲染用户/AI消息气泡（样式区分角色）
* 接收AI流式回答的实时内容，实现逐字追加的打字机效果
* 回答过程中禁用重复发送（通过props控制）
* 空状态显示“请上传文档后提问”提示
* 封装打字机效果工具函数（基于setTimeout/requestAnimationFrame）

## ⚠️ 强约束
* 打字机效果需流畅无卡顿
* 流式内容追加时需保留历史对话，不覆盖
* 完整 TS 类型定义（props、emit、ChatItem类型）

## 📤 输出格式
### 文件1：src/components/ChatList.vue
```vue
// 完整可运行代码（模板+脚本+样式）
```
### 文件2：src/utils/typingEffect.ts
```ts
// 封装打字机效果的工具函数完整代码
```

## 🚫 禁止行为
* 不要用假数据模拟流式效果
* 不要忽略角色样式区分
* 不要省略空状态处理

---

# 🧩 模板6：后端初始化（Express+TS）

## 🎯 任务目标
初始化 Express + TypeScript 后端项目，搭建基础分层结构

## 🧱 项目背景
AI智能知识库助手后端需提供文件解析、Embedding、RAG检索、流式对话等接口，需先搭建规范的项目骨架。

## 📋 任务要求
* 使用 npm init 初始化项目，安装核心依赖（express、typescript、@types/express、ts-node、cors、dotenv）
* 配置 tsconfig.json（启用严格模式、指定输出目录、路径别名）
* 搭建分层结构：src/routes、src/services、src/utils、src/types、src/middlewares
* 实现基础Express服务启动逻辑，添加cors、json解析中间件
* 实现健康检查接口（GET /api/health），返回 { code: 200, msg: 'server is running' }

## ⚠️ 强约束
* 所有代码使用 TypeScript 编写，类型定义完整
* 服务启动需处理端口占用、异常捕获
* 中间件注册顺序合理（cors → 解析 → 路由 → 异常处理）

## 📤 输出格式
1. 后端项目目录结构（tree形式）
2. 关键文件完整代码：
   * src/index.ts（服务入口）
   * tsconfig.json
   * src/middlewares/error.middleware.ts（全局异常处理）
   * src/middlewares/logger.middleware.ts（简单日志）

## 🚫 禁止行为
* 不要省略核心依赖
* 不要忽略跨域配置
* 不要写无类型的松散代码

---

# 🧩 模板7：后端PDF/Word上传解析接口

## 🎯 任务目标
开发 /api/file/upload 接口，实现文件接收、校验、解析返回文本

## 🧱 项目背景
后端需解析用户上传的PDF/Word文档，提取文本内容用于后续RAG流程，该接口是数据入口。

## 📋 任务要求
* 在 src/routes/file.route.ts 中实现 POST /api/file/upload 接口
* 使用 multer 处理 multipart/form-data 上传，限制单文件≤10MB、仅允许.pdf/.docx
* PDF解析使用 pdf-parse，Word解析使用 mammoth，封装到 src/services/file.service.ts
* 接口返回结构化数据：{ success: boolean, data: { text: string }, error: string }
* 完整错误处理（文件类型/大小错误、解析失败、空文件、multer异常等）

## ⚠️ 强约束
* 所有请求/响应使用 TS 类型定义（FileUploadRequest、FileUploadResponse等）
* 解析逻辑封装到service层，路由仅负责接收请求和返回响应
* 不要将解析后的大文本存储到内存（仅返回，后续Embedding时再处理）

## 📤 输出格式
### 文件1：src/routes/file.route.ts
```ts
// 路由定义完整代码
```
### 文件2：src/services/file.service.ts
```ts
// 文件解析逻辑完整代码
```
### 文件3：src/types/file.types.ts
```ts
// 文件相关类型定义完整代码
```

## 🚫 禁止行为
* 不要忽略文件大小限制
* 不要直接在路由中写解析逻辑
* 不要返回非结构化的错误信息

---

# 🧩 模板8：后端Embedding服务（RAG核心）

## 🎯 任务目标
实现 embedding.service.ts，完成文本分块、豆包Embedding调用、内存存储

## 🧱 项目背景
RAG的核心是将文本转为向量（Embedding），通过向量相似度检索相关内容，该服务是RAG的基础。

## 📋 任务要求
1. 文本分块函数：
   * 每块500字，上下文重叠100字
   * 保留段落/句子完整性，不截断完整句子
   * TS类型：TextChunk = { id: string; content: string }
2. Embedding调用函数：
   * 调用豆包Embedding API，API Key从环境变量读取
   * 超时10s，重试2次，完整错误捕获
3. 内存存储：
   * 类型：VectorItem = { id: string; content: string; embedding: number[] }
   * 提供 addDocument(text: string)、getAllVectors() 方法

## ⚠️ 强约束
* 必须使用 TS 严格定义所有类型
* API调用需处理网络异常、密钥缺失等情况
* 内存存储仅用数组，预留数据库扩展接口

## 📤 输出格式
### 文件：src/services/embedding.service.ts
```ts
// 完整可运行代码（分块+Embedding调用+内存存储）
```

## 🚫 禁止行为
* 不要硬编码API Key
* 不要忽略分块的句子完整性
* 不要省略超时和重试逻辑

---

# 🧩 模板9：后端相似度计算+RAG检索

## 🎯 任务目标
实现余弦相似度计算和TopK检索，完成RAG核心检索逻辑

## 🧱 项目背景
用户提问后，需通过相似度检索找到文档中最相关的文本块，拼接Prompt后调用LLM，是RAG的核心环节。

## 📋 任务要求
1. 余弦相似度函数（src/utils/similarity.ts）：
   * 接收两个number[]类型的embedding数组
   * 返回0-1之间的相似度值
   * 处理边界：长度不一致、空数组
2. 检索服务（src/services/retrieval.service.ts）：
   * 实现 searchTopK(question: string, k: number): string[]
   * 流程：问题→embedding→计算相似度→排序→返回TopK文本块
   * 无文档/无相关内容时返回明确提示

## ⚠️ 强约束
* 完整TS类型定义
* 相似度计算逻辑准确，需包含测试用例验证
* 检索函数不耦合LLM调用，仅返回相关文本块

## 📤 输出格式
### 文件1：src/utils/similarity.ts
```ts
// 余弦相似度函数+测试用例完整代码
```
### 文件2：src/services/retrieval.service.ts
```ts
// 检索服务完整代码
```

## 🚫 禁止行为
* 不要使用错误的相似度计算公式
* 不要忽略空数据边界处理
* 不要耦合Prompt拼接逻辑

---

# 🧩 模板10：后端流式对话接口（核心交互）

## 🎯 任务目标
实现 /api/chat/stream 流式接口，推送AI回答的逐段内容

## 🧱 项目背景
前端需要实现打字机效果，后端需将LLM的流式响应逐行推送给前端，该接口是流式交互的核心。

## 📋 任务要求
* 在 src/routes/chat.route.ts 中扩展 POST /api/chat/stream 接口
* 调用豆包流式对话API，设置 stream: true
* 通过 response.write 逐行返回JSON行格式：{"chunk":"文本片段","finish":false}
* 设置正确响应头：Content-Type: text/event-stream、Transfer-Encoding: chunked、Cache-Control: no-cache
* 处理异常：客户端断开连接、API流式返回中断，确保资源释放

## ⚠️ 强约束
* 必须处理客户端断开连接（req.on('close')）
* 必须封装流式响应工具函数保证复用
* 不要使用setTimeout模拟流式返回

## 📤 输出格式
### 文件1：src/routes/chat.route.ts
```ts
// 包含非流式+流式接口的完整代码
```
### 文件2：src/utils/streamResponse.ts
```ts
// 流式响应工具函数完整代码
```

## 🚫 禁止行为
* 不要忽略响应头配置
* 不要未处理客户端断开连接导致内存泄漏
* 不要返回非约定格式的流式数据

---

# 🧩 模板11：后端历史对话管理接口

## 🎯 任务目标
实现历史对话CRUD接口，内存存储历史对话记录

## 🧱 项目背景
用户需要查看/回显历史对话，提升使用体验，该接口是第二优先级核心功能。

## 📋 任务要求
* 在 src/routes/history.route.ts 实现3个接口：
  1. POST /api/history：新增对话（接收question/answer，生成id和创建时间）
  2. GET /api/history：查询所有历史对话
  3. DELETE /api/history：清空历史对话
* TS类型：HistoryItem = { id: string; question: string; answer: string; createTime: string }
* 所有接口添加参数校验、错误处理
* 预留分页查询扩展空间

## ⚠️ 强约束
* 内存存储仅用数组，保证重启后数据清空（符合轻量要求）
* 完整TS类型定义，参数校验严格
* 接口返回结构化响应（success/error/data）

## 📤 输出格式
### 文件1：src/routes/history.route.ts
```ts
// 历史对话路由完整代码
```
### 文件2：src/services/history.service.ts
```ts
// 历史对话逻辑封装完整代码
```
### 文件3：src/types/history.types.ts
```ts
// 历史对话类型定义完整代码
```

## 🚫 禁止行为
* 不要引入数据库依赖
* 不要忽略参数校验
* 不要返回非结构化数据

---

# 🧩 模板12：前端页面整合+路由跳转

## 🎯 任务目标
将所有前端组件整合到对应页面，实现路由跳转和数据共享

## 🧱 项目背景
分散的组件需要整合为完整页面，实现“上传文档→跳转到对话页→进行对话”的完整流程。

## 📋 任务要求
1. 页面整合：
   * 文档上传页（UploadView.vue）：整合 FileUpload + TextPreview
   * 智能对话页（ChatView.vue）：整合 ChatInput + ChatList + HistoryChatList
2. 路由配置：
   * 配置路由跳转（上传成功后一键跳转到对话页）
   * App.vue 添加导航栏（仅“上传文档”“智能对话”按钮）
3. 数据共享：
   * 通过Pinia存储上传的文本内容，页面切换数据不丢失
   * 对话页可读取Pinia中的文档文本，用于RAG对话

## ⚠️ 强约束
* 页面切换时数据仅内存级存储（不持久化）
* 路由跳转逻辑清晰，有加载状态提示
* 所有交互符合用户直觉（如上传成功后按钮跳转）

## 📤 输出格式
### 文件1：src/views/UploadView.vue
```vue
// 上传页面整合代码
```
### 文件2：src/views/ChatView.vue
```vue
// 对话页面整合代码
```
### 文件3：src/App.vue
```vue
// 包含导航栏的根组件代码
```
### 文件4：src/store/modules/document.ts
```ts
// 文档数据存储的Pinia模块代码
```

## 🚫 禁止行为
* 不要省略页面空状态/加载状态
* 不要硬编码路由路径
* 不要忽略Pinia数据共享逻辑