### `@ai-ka/xxx` 包的核心说明
`@ai-ka/xxx` 并非 npm 公共包，而是该 **Monorepo 项目（ai-knowledge-assistant）** 下基于 `npm/yarn workspaces` 实现的**私有本地子包**，其中：
- `@ai-ka/` 是自定义的 npm 作用域（Scope），用于区分项目内私有子包、避免与公共包重名；
- `xxx` 对应 `packages/` 目录下的子包名称（如 `shared`/`frontend`/`backend`）。

### 典型示例：`@ai-ka/shared`
`@ai-ka/shared` 对应项目目录 `packages/shared/`，是**前后端共享的工具包**，核心职责：
1. 存放前后端通用的 TS 类型（如 `ChatItem`、`HistoryItem`、流式响应类型等），避免前后端重复定义；
2. 提供通用工具函数（如字符串处理、类型校验等），供前端（`@ai-ka/frontend`）和后端（`@ai-ka/backend`）直接引用；
3. 仅依赖基础 TS 相关包，无业务逻辑，保证轻量通用。

### 实现逻辑
根目录 `package.json` 会通过 `workspaces` 字段声明子包路径（如 `"workspaces": ["packages/*"]`），使得：
- 子包（如 `shared`/`frontend`/`backend`）可通过 `@ai-ka/xxx` 的形式互相引用（如同安装的 npm 包）；
- 无需将这些子包发布到 npm 仓库，仅作为本地私有包在项目内复用。

### 其他同类型包
- `@ai-ka/frontend`：对应 `packages/frontend/`，前端业务包（Vue3 + TS + Vite）；
- `@ai-ka/backend`：对应 `packages/backend/`，后端业务包（Express + TS）。

