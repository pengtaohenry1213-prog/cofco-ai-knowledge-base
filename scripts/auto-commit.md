## 最简单的方式（无需脚本）
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

也可简单化，每次任务完成后，直接对 Cursor 说："帮我提交当前的更改，使用 conventional commits 格式"

### 
加上“可以执行”的权限