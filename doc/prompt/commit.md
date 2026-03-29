# 让 Cursor 帮你写 commit（强烈推荐）


## 👉 Prompt

```text
请根据以下代码变更，生成一条规范的 git commit message：
要求：
- 使用 feat/fix 等规范前缀
- 简洁清晰
- 一句话描述核心改动

代码如下：
（粘 diff）
```

---

👉 Cursor 会帮你生成：

```bash
feat: add embedding service with chunking and vector storage
```