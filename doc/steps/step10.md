
## 🎯 任务目标
实现 /api/chat/stream 流式接口，推送AI回答的逐段内容

## 🧱 项目背景
前端需要实现打字机效果，后端需将LLM的流式响应逐行推送给前端，该接口是流式交互的核心。

## 📋 任务要求
* 在 src/routes/chat.route.ts 中扩展 POST /api/chat/stream 接口
* 调用豆包流式对话API，设置 stream: true
* 通过 response.write 逐行返回JSON行格式：{"chunk":"文本片段","finish":false}
* 设置正确响应头：Content-Type: text/event-stream、Transfer-Encoding: chunked、Cache-Control: no-cache
* 处理异常：客户端断开连接、API流式返回中断，确保资源释放

## ⚠️ 强约束
* 必须处理客户端断开连接（req.on('close')）
* 必须封装流式响应工具函数保证复用
* 不要使用setTimeout模拟流式返回

## 📤 输出格式
### 文件1：src/routes/chat.route.ts
```ts
// 包含非流式+流式接口的完整代码
```
### 文件2：src/utils/streamResponse.ts
```ts
// 流式响应工具函数完整代码
```

## 🚫 禁止行为
* 不要忽略响应头配置
* 不要未处理客户端断开连接导致内存泄漏
* 不要返回非约定格式的流式数据


---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围
- 流式对话接口 `/api/chat/stream`
- SSE 响应格式
- 客户端断开连接处理

### 测试用例
| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-STREAM-001 | 正常流式请求 | 返回 SSE 流，包含多个 chunk | - | - |
| TC-STREAM-002 | 验证响应头 Content-Type | 为 `text/event-stream` | - | - |
| TC-STREAM-003 | 验证响应头 Transfer-Encoding | 为 `chunked` | - | - |
| TC-STREAM-004 | 验证响应头 Cache-Control | 为 `no-cache` | - | - |
| TC-STREAM-005 | 验证 JSON 行格式 | 每行为独立 JSON，包含 chunk 和 finish | - | - |
| TC-STREAM-006 | 验证 finish=true 出现在最后 | 最后一行 `{"finish":true}` | - | - |
| TC-STREAM-007 | 客户端中途断开连接 | 服务器正常关闭连接，释放资源 | - | - |
| TC-STREAM-008 | API 调用失败 | 返回错误信息，finish=true | - | - |
| TC-STREAM-009 | 发送空问题 | 返回 `{success: false, error: "问题不能为空"}` | - | - |
| TC-STREAM-010 | 并发多个流式请求 | 每个请求独立返回，互不干扰 | - | - |

### 问题清单
| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）
- 参考：`md/项目结构.md`

## 项目 git commit 规范
- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step10.md - 实现流式输出 API 