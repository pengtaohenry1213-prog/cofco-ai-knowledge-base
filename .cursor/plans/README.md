# 🎯 任务目标

```plaintext
输入：stepN.md
↓
AI 自动：
1. 读取 stepN.md
2. 生成 plan
3. 写入 .cursor/plans/stepN-plan.md
4. 自动开始执行 todos
5. 记录执行日志
```

## 目录职责

| 路径 | 职责 |
|------|------|
| `.cursor/plans/` | AI 执行计划、正在进行的规划 |
| `doc/steps-dev.md` | 产品开发路线（长期有效） |
| `doc/steps/` | step 任务规格说明书 |

## Plan 文件命名规范

```
stepN-plan.md                    # step 执行计划（如 step1-plan.md）
{年月}-{简述}.plan.md            # 非 step 主题规划（如 2026-04-vite-migration.plan.md）
```

## Plan 文件结构模板

```yaml
---
name: stepN-任务简述
overview: 一句话描述任务目标
todos:
  - id: todo-1
    content: 具体任务描述
    status: pending
  - id: todo-2
    content: 具体任务描述
    status: pending
files:
  - packages/frontend/src/...
  - packages/backend/src/...
acceptance:
  - 验收标准1
  - 验收标准2
---

## 执行日志

### 10:00 - [agent: fast]

**操作**: 定义类型接口

**执行**:
- 读取文件: packages/frontend/src/utils/request.ts
- 新增 StreamResponse、StreamCallbacks、StreamRequestConfig 接口

**结果**: 完成

### 10:01 - [agent: default]

**操作**: 实现 fetchStream 函数

**执行**:
```ts
// 读取 packages/frontend/src/utils/request.ts
// 新增 fetchStream 函数
```

**结果**: 完成

### 10:02 - [agent: default]

**操作**: 验证类型检查

**执行**:
```bash
cd packages/frontend && ./node_modules/.bin/tsc --noEmit
```

**输出**: 无错误

**结果**: 通过

### 10:03 - [agent: default]

**操作**: 所有 todos 完成

**结果**: 完成
```

## 详细执行日志格式说明

```
### HH:MM - [agent: <类型>]

**操作**: 简要描述
**文件**: affected files
**命令**: shell commands
**输出**: command output
**结果**: 完成/失败/跳过
**备注**: 关键发现
```

| 字段 | 说明 |
|------|------|
| HH:MM | 执行时间 |
| agent | 使用的 agent 类型：`fast` / `default` / `generalPurpose` |
| 操作 | 简要描述当前步骤 |
| 文件 | 读取/修改的文件 |
| 命令 | 执行的 shell 命令 |
| 输出 | 命令输出结果 |
| 结果 | `完成` / `失败` / `跳过` |
| 备注 | 踩坑记录、特殊决策等 |

## 工作流约定

1. **读取规格** → `doc/steps/stepN.md`
2. **生成 Plan** → Plan 模式生成 `.cursor/plans/stepN-plan.md`
3. **执行 Plan** → Agent 模式按 todos 执行
4. **验收闭环** → 对照验收标准确认完成

## 归档约定

- 所有 todos 完成后，可将 Plan 文件移至 `doc/steps/plans/` 或删除
- 不在 `.cursor/plans/` 中保留已完成的历史记录堆

## 强制约定

- 所有 `.cursor/plans/` 下的 plan 文件执行日志必须使用上述详细格式
- 日志按时间顺序记录，每步包含：时间、操作、执行内容（文件/命令）、结果
- 所有 `.cursor/plans/` 下的 plan 文件执行日志必须使用上述详细格式，并保存到 `doc/steps/plans/` 或删除