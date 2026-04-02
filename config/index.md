# AI 模型配置信息

## LLM

使用 Doubao LLM，见 doubao-model.md

## Embedding

使用 SiliconFlow 里的 BAAI/bge-large-zh-v1.5， 请见： siliconFlow-model.md

---

## 当前状态

| 配置项 | 值 |
|--------|-----|
| **SiliconFlow API Key** | `sk-exhxrlinysleblmmejzrhqaikgjgvervyhaosjrvzaxjmxpp` |
| **Embedding 模型** | `BAAI/bge-large-zh-v1.5` (免费) |
| **LLM 模型** | 继续使用豆包 `doubao-seed-2-0-code-preview-260215` (收费) |

## 您需要做的配置

只需在项目的 `.env` 文件中添加一行：

```bash
SILICONFLOW_API_KEY=sk-exhxrlinysleblmmejzrhqaikgjgvervyhaosjrvzaxjmxpp
```

## 配置生效后的效果

根据 `config/index.ts` 的逻辑：

```typescript
if (config.siliconFlow?.apiKey) {
  // 使用 SiliconFlow Embedding (免费)
  endpoint: "https://api.siliconflow.cn/v1/embeddings"
  model: "BAAI/bge-large-zh-v1.5"
} else {
  // 回退到豆包 Embedding (收费)
  endpoint: "https://ark.cn-beijing.volces.com/api/v3/embeddings4"
  model: "doubao-embedding"
}
```

## 执行步骤

```bash
# 1. 编辑 .env 文件
vim packages/backend/.env

# 2. 添加或修改这一行
SILICONFLOW_API_KEY=sk-exhxrlinysleblmmejzrhqaikgjgvervyhaosjrvzaxjmxpp

# 3. 重启后端服务
npm run dev
```

## 成本对比

| 服务 | 用途 | 费用 |
|------|------|------|
| **SiliconFlow Embedding** | 文档向量化 | **免费** |
| **豆包 Embedding** | 文档向量化 (备用) | 按量收费 |
| **豆包 LLM** | 对话生成 | 按 Token 收费 |

这样配置后：
- **Embedding** 会使用 SiliconFlow 免费模型
- **LLM 对话** 继续使用豆包

如果您想让我切换到 Agent 模式帮您修改配置，请告诉我！