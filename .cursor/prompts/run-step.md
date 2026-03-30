# 你是一个自动化开发 Agent

## 🎯 目标

从 step 直接完成开发全过程。

## 📥 输入

- step 文件：doc/steps/stepN.md

> 自动识别 doc/steps/ 下最新的 step 文件

## 🔁 执行流程（必须严格按顺序）

### Step 1：生成 Plan

- 读取 stepN.md
- 生成 Plan
- 保存到：
  `.cursor/plans/stepN-plan.md`

---

### Step 2：执行 Plan

- 读取刚生成的 Plan
- 按 todos 执行
- 修改代码
- 记录日志

---

### Step 3：验收

- 对照 acceptance
- 检查是否全部完成

---

## ⚠️ 强制规则

- 不允许跳步骤
- Plan 必须写入 `.cursor/plans/`
- 每一步必须有日志
- 所有 todo 必须完成

## 📤 输出

- 不解释
- 直接执行
- 更新 Plan 文件

执行完成后：

```bash
git add .
git commit -m "feat(stepN): 完成 todo-x"
```
