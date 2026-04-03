
# 🚀 Step 3：适配「Skill 技能」→ Cursor 自定义命令

打开 Cursor → 设置 → **Commands** → 把下面技能全部粘贴进去
输入 `/技能名` 即可**直接使用官方技能**！

我把最常用的 5 个适配好了（贴合你的知识库项目）：

---

## 命令 1：/pdf-skill（PDF 解析 + OCR 技能）

基于 pdfjs-dist 解析 PDF，提取原生文本 + 图片 OCR，合并输出知识库文本
适配 Monorepo 架构，临时文件自动清理
返回标准化格式 {success, data: {text}, error}

## 命令 2：/docx-skill（Word 解析技能）

使用 mammoth 解析 docx 文档，提取纯文本，用于知识库录入
保持段落结构，无格式冗余

## 命令 3：/file-upload-skill（文件上传接口技能）

生成后端文件上传接口：multer + 类型校验 + 大小限制 (10MB)
适配 Monorepo apps/backend 结构

## 命令 4：/frontend-design-skill（前端设计技能）

生成 Vue3 + Vite 前端界面：文件上传 + PDF 预览 + 对话窗口
简约科技风格，响应式布局

## 命令 5：/skill-creator（自定义技能生成器）

按照官方 Spec 模板，帮我创建一个新的 Cursor 技能
生成标准结构：规则 + 模板 + 命令

---

# ✅ Step 4：如何在 Cursor 里一键使用？（超简单）
## 1. 加载规范
复制 `.cursorrules` 内容 → 发给 Cursor
AI 立刻遵守官方技能规范

## 2. 使用模板
输入：使用 skill-template 生成 PDF 解析服务


## 3. 触发技能
直接输入命令：/pdf-skill
/file-upload-skill 代码：
```plaintext
Cursor 就会**完全按照 Anthropic 官方 Skill 逻辑**生成代码！

# 🎯 适配你的知识库项目（真实演示）
你只需要在 Cursor 里输入：
使用 /pdf-skill 解析我的 PDF 文件，合并原生文本 + OCR，生成 Monorepo 后端服务


Cursor 会自动生成：
✅ `apps/backend/src/services/pdf.service.ts`
✅ 基于 `pdfjs-dist`
✅ 图片 OCR 识别
✅ 临时目录自动清理
✅ 标准化返回格式
✅ 完全符合官方 Skill 规范

---

# 📁 最终项目结构（适配完成后）
```

your-monorepo/
├── .cursorrules # 官方 Spec 适配
├── template/
│ └── skill-template.md # 官方 Template 适配
├── cursor-commands.md # 所有 Skill 命令
└── apps/
├── frontend/
└── backend/


---

# ✨ 最终总结
1. **官方 Spec** → 变成 `.cursorrules`，强制 AI 遵守规则
2. **官方 Template** → 变成代码模板，一键生成结构
3. **官方 Skill** → 变成 Cursor 命令，`/命令` 直接触发
4. **100% 适配你的项目**：Monorepo + pnpm + Vite + PDF 知识库

我可以帮你**把所有 16 个官方 Skill 全部转换成 Cursor 命令**，你要我直接生成完整版吗？