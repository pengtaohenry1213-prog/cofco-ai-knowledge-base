## 最简单的方式（无需脚本）[待定]
### 步骤 1：切换到 Cursor Agent 模式
点击 Cursor 右上角「Agent」按钮（或快捷键 Ctrl+Shift+A），进入智能代理模式。

### 步骤 2：输入指令（直接复制）
```
请帮我完成以下操作：
1. 分析当前项目中已完成的「模板8 后端Embedding服务」的代码变更
2. 按照 conventional commits 规范生成 Commit 信息（前缀用feat）
3. 执行 git add . → git commit → git push 推送到远程仓库
4. 远程仓库地址：https://github.com/pengtaohenry1213-prog/cofco-ai-knowledge-base.git

要求：
- Commit 信息要和模板任务对应，简洁清晰
- 执行命令前告知我要提交的内容，确认后再执行
```
### 步骤 3：确认执行
Cursor 会先列出要提交的文件、生成的 Commit 信息，你确认后，它会自动在 Terminal 执行所有命令，完成提交 + 推送。

> 也可简单化，每次任务完成后，直接对 Cursor 说："帮我提交当前的更改，使用 conventional commits 格式"

---

## ✅ sh 方式 【使用中】,`auto-commit.sh` 功能
为 `auto-commit.sh` 加上“可以执行”的权限: `chmod +x scripts/auto-commit.sh`

### 使用方式

| 命令 | 说明 |
|------|------|
| `./scripts/auto-commit.sh` | **自动模式**：自动识别变更并生成 commit |
| `./scripts/auto-commit.sh "任务名称"` | **手动模式**：指定任务名称 |
| `./scripts/auto-commit.sh --push` | 自动识别 + 自动推送 |
| `./scripts/auto-commit.sh "任务名称" --push` | 手动模式 + 自动推送 |

### 核心功能

1. **自动识别任务步骤**：根据变更文件自动匹配 `step1` ~ `step12`
2. **自动判断类型**：根据文件类型判断 `feat/docs/chore`
3. **彩色输出**：更好的交互体验
4. **兼容 macOS**：使用 case 语句替代关联数组，兼容 bash 3.2

### 任务步骤映射

```
step1  → 初始化前端项目结构
step2  → 开发文件上传组件
step3  → 开发文本预览组件
step4  → 开发对话输入组件
step5  → 开发消息展示组件
step6  → 实现后端 Express + TS 基础服务
step7  → 实现文件上传解析 API
step8  → 实现 Embedding 向量化服务
step9  → 实现 RAG 检索与生成 API
step10 → 集成前端对话页面
step11 → 实现流式输出
step12 → 优化用户体验与性能
```

### 现在你只需要：

1. 完成代码变更后
2. 在 Cursor Terminal 执行 `./scripts/auto-commit.sh`
3. 脚本会自动分析变更 → 生成 commit message → 询问是否提交 → 可选推送



