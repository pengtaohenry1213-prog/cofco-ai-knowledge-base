
## 🎯 任务目标
实现历史对话CRUD接口，内存存储历史对话记录

## 🧱 项目背景
用户需要查看/回显历史对话，提升使用体验，该接口是第二优先级核心功能。

## 📋 任务要求
* 在 src/routes/history.route.ts 实现3个接口：
  1. POST /api/history：新增对话（接收question/answer，生成id和创建时间）
  2. GET /api/history：查询所有历史对话
  3. DELETE /api/history：清空历史对话
* TS类型：HistoryItem = { id: string; question: string; answer: string; createTime: string }
* 所有接口添加参数校验、错误处理
* 预留分页查询扩展空间

## ⚠️ 强约束
* 内存存储仅用数组，保证重启后数据清空（符合轻量要求）
* 完整TS类型定义，参数校验严格
* 接口返回结构化响应（success/error/data）

## 📤 输出格式
### 文件1：src/routes/history.route.ts
```ts
// 历史对话路由完整代码
```
### 文件2：src/services/history.service.ts
```ts
// 历史对话逻辑封装完整代码
```
### 文件3：src/types/history.types.ts
```ts
// 历史对话类型定义完整代码
```

## 🚫 禁止行为
* 不要引入数据库依赖
* 不要忽略参数校验
* 不要返回非结构化数据


---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试

### 测试范围
- POST /api/history 新增对话
- GET /api/history 查询历史
- DELETE /api/history 清空历史

### 测试用例
| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-HIST-001 | POST 新增对话 | 返回 `{success: true, data: {id, createTime}}` | - | - |
| TC-HIST-002 | POST 缺少 question 参数 | 返回 `{success: false, error: "question 为必填"}` | - | - |
| TC-HIST-003 | POST 缺少 answer 参数 | 返回 `{success: false, error: "answer 为必填"}` | - | - |
| TC-HIST-004 | GET 查询所有历史 | 返回历史列表，按 createTime 倒序 | - | - |
| TC-HIST-005 | GET 空数据库 | 返回 `{success: true, data: []}` | - | - |
| TC-HIST-006 | DELETE 清空历史 | 返回 `{success: true}`，历史列表为空 | - | - |
| TC-HIST-007 | DELETE 后 GET | 返回空数组 | - | - |
| TC-HIST-008 | 新增后立即 GET | 新增的对话在列表中 | - | - |
| TC-HIST-009 | 并发新增多个对话 | 每个都有唯一 id | - | - |
| TC-HIST-010 | 重启服务后 GET | 数据已清空（内存存储） | - | - |

### 问题清单
| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）
- 参考：`md/项目结构.md`

## 项目 git commit 规范
- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step11.md - 实现历史对话 CRUD 接口