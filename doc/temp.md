
request.ts
+94
};
export function streamPost(
  params: Record<string, unknown>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): void {
Now let me update the todos and verify the TypeScript types.
在 request.ts 中定义流式请求相关类型接口
实现 fetchStream 函数（基于 Fetch API + ReadableStream）
实现 streamPost 便捷封装函数
验证 TypeScript 类型检查通过
cd /Users/taopeng/Desktop/Resume/Doing/cofco-ai-knowledge-base && pnpm -F @ai-ka/frontend type-check 2>&1 || true
None of the selected packages has a "type-check" script
No type-check script. Let me try tsc directly or vite build to check for TypeScript errors.
cd /Users/taopeng/Desktop/Resume/Doing/cofco-ai-knowledge-base/packages/frontend && npx tsc --noEmit 2>&1
npm warn Unknown env config "devdir". This will stop working in the next major version of npm.
Let me check the output of that background process.
The command is still running. Let me wait for it to finish by checking again.
sleep 10 && cat /Users/taopeng/.cursor/projects/Users-taopeng-Desktop-Resume-Doing-cofco-ai-knowledge-base/terminals/575533.txt
running_for_ms: 46112    
---
npm warn Unknown env config "devdir". This will stop working in the next major version of npm.
It seems like tsc is still running. Let me check if it's still running or if it finished with exit code 0 (meaning no type errors). Since the exit code is 0, it likely means no type errors were found. Let me wait a bit more and check again.
sleep 15 && cat /Users/taopeng/.cursor/projects/Users-taopeng-Desktop-Resume-Doing-cofco-ai-knowledge-base/terminals/575533.txt
elapsed_ms: 71613
ended_at: 2026-03-30T02:42:21.160Z
---
Sandbox is blocking network access. Let me try to find tsc locally and run it without network.
cd /Users/taopeng/Desktop/Resume/Doing/cofco-ai-knowledge-base/packages/frontend && ls node_modules/.bin/tsc 2>/dev/null && ./node_modules/.bin/tsc --noEmit 2>&1
node_modules/.bin/tsc
TypeScript 类型检查通过了（没有输出表示没有错误）。让我更新 todo 状态并完成任务。
TypeScript 编译通过，没有类型错误。

在 request.ts 中定义流式请求相关类型接口
实现 fetchStream 函数（基于 Fetch API + ReadableStream）
实现 streamPost 便捷封装函数
验证 TypeScript 类型检查通过
All tasks completed. Let me summarize what was done.
Step4 已完成。以下是修改内容摘要：

修改文件: packages/frontend/src/utils/request.ts

新增内容:

流式请求类型定义:

StreamResponse - 流式响应数据结构
StreamCallbacks - 回调函数类型（onChunk/onFinish/onError）
StreamRequestConfig - 流式请求配置类型
fetchStream 函数:

基于 Fetch API + ReadableStream 实现
逐行解析 SSE 格式响应（data: {...}）
支持 AbortController 取消请求
正确处理 AbortError
streamPost 便捷函数:

封装常用配置，默认请求 /chat/stream
自动携带 Authorization token
所有类型检查均已通过验证。