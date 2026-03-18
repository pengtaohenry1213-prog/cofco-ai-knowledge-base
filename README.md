# cofco-ai-knowledge-base
cofco AI 智能知识库助手，一个AI知识库问答系统。

这份代码文件集合属于**企业级AI智能知识库助手**项目的基础架构，采用 `pnpm monorepo` 多包管理模式，拆分为「前端（Vue3+TS+Vite）、后端（Express+TS）、共享类型包」三个核心子包，以下是各文件的详细说明：

## 一、根目录文件（项目全局配置）
| 文件路径                | 核心作用                                                                 |
|-------------------------|--------------------------------------------------------------------------|
| `ai-knowledge-assistant/package.json` | 根项目配置：<br>1. 定义 `workspaces` 管理子包；<br>2. 提供启动脚本（并行/单独启动前后端）；<br>3. 指定 `pnpm` 包管理器版本。 |
| `ai-knowledge-assistant/tsconfig.json` | 全局 TypeScript 配置：<br>1. 启用严格模式（`strict: true`）；<br>2. 统一编译目标（ES2020）、模块解析规则；<br>3. 排除 `node_modules`/`dist` 目录。 |
| `ai-knowledge-assistant/.env` | 全局环境变量：<br>1. 配置后端服务端口（`PORT=3000`）；<br>2. 配置豆包API密钥/基础地址（业务核心配置）。 |
| `ai-knowledge-assistant/pnpm-workspace.yaml` | pnpm 工作区配置：指定子包目录（`packages/*`），让pnpm识别并管理多包依赖。 |

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
| `src/router/index.ts`             | 路由配置：<br>1. 定义两个核心路由（文档上传页 `/upload`、智能对话页 `/chat`）；<br>2. 配置路由模式/基础路径。 |
| `src/store/index.ts`              | Pinia 状态管理：<br>1. 创建根Store；<br>2. 定义基础状态（如会话列表、上传文件列表）；<br>3. 提供增删改查的action。 |
| `src/utils/request.ts`            | Axios 封装：<br>1. 创建Axios实例（配置基础URL/超时时间）；<br>2. 请求拦截器（添加token/统一请求格式）；<br>3. 响应拦截器（统一解析/错误处理）；<br>4. 导出请求方法（get/post等）。 |
| `src/App.vue`                     | 根组件：<br>1. 包含导航栏（切换上传/对话页）；<br>2. 提供路由出口（`<router-view>`）；<br>3. 基础布局样式。 |
| `src/views/`                      | 页面组件目录：存放 `Upload.vue`（文档上传）、`Chat.vue`（智能对话）核心页面。 |
| `src/components/`                 | 公共组件目录：存放可复用组件（如上传按钮、聊天消息气泡）。 |
| `src/api/`                        | API接口目录：封装前后端交互的接口函数（基于request.ts）。 |

## 四、backend 后端包（@ai-ka/backend）
基于 Express + TypeScript 的后端服务，目录路径：`packages/backend/`

| 文件路径                          | 核心作用                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `package.json`                    | 后端项目配置：<br>1. 脚本：`dev`（ts-node启动开发服务）、`build`（TS编译）、`start`（启动编译后代码）；<br>2. 依赖：Express（Web框架）、cors（跨域）、dotenv（环境变量）；<br>3. 开发依赖：TS、ts-node、Express/cors/Node类型声明。 |
| `tsconfig.json`                   | 后端TS配置：<br>1. 启用严格模式；<br>2. 配置编译目标/模块解析；<br>3. 路径别名（`@` 指向 `src`）；<br>4. 排除编译输出/第三方依赖。 |
| `src/index.ts`                    | 后端入口：<br>1. 加载根目录 `.env` 环境变量；<br>2. 配置中间件（CORS、JSON解析、URL编码）；<br>3. 提供健康检查接口（`/api/health`）；<br>4. 启动HTTP服务（监听3000端口）。 |

## 核心协作关系
1. **类型统一**：前端/后端均导入 `@ai-ka/shared` 的类型，保证聊天/会话数据格式一致；
2. **接口通信**：前端通过Axios（`request.ts`）请求 `/api` 接口，Vite代理转发到后端3000端口；
3. **工程化管理**：根目录脚本通过 `pnpm --filter` 指令分别启动/管理前后端子包；
4. **环境隔离**：全局 `.env` 管理核心配置，前后端各自的配置文件按需读取。

该架构的核心优势是**模块化拆分**（前后端/共享逻辑分离）、**类型安全**（全栈TS+共享类型）、**工程化便捷**（pnpm monorepo统一管理依赖/脚本），为企业级AI知识库助手提供了可扩展的基础骨架。


## 启动命令：
### 并行启动前后端
pnpm run dev

### 单独启动后端
pnpm run dev:backend

### 单独启动前端
pnpm run dev:frontend

## 补充说明
所有代码遵循 Vue3 Composition API 规范，TypeScript 严格模式已启用，类型定义完整；
Axios 拦截器包含请求头（token）注入、响应业务码校验、统一错误提示（需提前安装 element-plus 或替换为项目 UI 库的消息组件）；
路由配置包含基础导航守卫，默认跳转至智能对话页；
Pinia 状态管理封装了文档上传和智能对话的核心状态，方法均为响应式；
路径别名 @/ 已配置并指向 src 目录，可直接在代码中使用。