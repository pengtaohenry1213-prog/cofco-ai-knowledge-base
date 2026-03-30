# Step 15 Plan: 历史对话 CRUD 接口

## 📋 需求分析

### 任务目标
实现历史对话 CRUD 接口，内存存储历史对话记录

### 实现文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 类型定义 | `src/types/history.types.ts` | HistoryItem 接口 |
| 服务层 | `src/services/history.service.ts` | 业务逻辑封装 |
| 路由层 | `src/routes/history.route.ts` | API 路由定义 |
| 注册路由 | `src/routes/index.ts` | 挂载到 /api/history |

### 接口设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/history | 新增对话 |
| GET | /api/history | 查询所有（倒序） |
| DELETE | /api/history | 清空历史 |
| GET | /api/history/:id | 查询单条 |

## 📝 执行计划

### Todo List

```yaml
todos:
  - id: 1
    type: backend
    desc: 创建 history.types.ts 类型定义
    depends_on: []
  - id: 2
    type: backend
    desc: 创建 history.service.ts 服务层
    depends_on: [1]
  - id: 3
    type: backend
    desc: 创建 history.route.ts 路由层
    depends_on: [2]
  - id: 4
    type: backend
    desc: 注册 history 路由到 index.ts
    depends_on: [3]
  - id: 5
    type: test
    desc: 编写接口测试用例
    depends_on: [4]
```

## ✅ 验收标准

| 用例ID | 测试场景 | 状态 |
|--------|---------|------|
| TC-HIST-101 | POST 新增对话 | 待验证 |
| TC-HIST-102 | POST 缺少 question 参数 | 待验证 |
| TC-HIST-103 | POST 缺少 answer 参数 | 待验证 |
| TC-HIST-104 | POST 参数类型错误 | 待验证 |
| TC-HIST-105 | GET 查询所有历史 | 待验证 |
| TC-HIST-106 | GET 空数据库 | 待验证 |
| TC-HIST-107 | DELETE 清空历史 | 待验证 |
| TC-HIST-108 | DELETE 后 GET | 待验证 |
| TC-HIST-109 | 新增后立即 GET | 待验证 |
| TC-HIST-110 | GET /api/history/:id 存在记录 | 待验证 |
| TC-HIST-111 | GET /api/history/:id 不存在 | 待验证 |
| TC-HIST-112 | 并发新增多个对话 | 待验证 |
| TC-HIST-113 | 重启服务后 GET | 待验证 |

## ⚠️ 强约束

- [x] 内存存储用数组（重启后数据清零）
- [x] 完整 TS 类型定义
- [x] 接口返回结构化响应 {success, data, error}
- [x] 预留分页查询扩展空间
