
## 生成 git commit message

请根据以下代码变更，生成一条规范的 git commit message：

### 要求

- 使用 feat/fix 等规范前缀
- 简洁清晰
- 一句话描述核心改动

### 代码如下

```bash
feat: add embedding service with chunking and vector storage
```

# AI友好型 commit 规范

## 📌 commit 模板

```bash
<type>: <简要描述>

<详细说明（可选）>
```

---

## 📌 type 规范

| 类型       | 含义    |
| -------- | ----- |
| feat     | 新功能   |
| fix      | 修复    |
| refactor | 重构    |
| chore    | 配置/构建 |
| docs     | 文档    |

---

## 📌 示例（你的项目）

```bash
feat: stepN.md - 初始化前端项目结构

feat: stepN.md - 实现文件上传组件（支持pdf/docx）

feat: stepN.md - 实现文本分块与embedding服务

feat: stepN.md - 实现余弦相似度计算工具

feat: stepN.md - 实现RAG检索逻辑（TopK）
```
