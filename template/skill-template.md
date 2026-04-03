# Cursor Skill 官方模板（适配 Cursor）

## 技能标识

name:
description:
type:
tags:

## 核心能力

1.
2.

## 使用场景

-

## 接口规范

请求：
响应：{ success: boolean, data: any, error: string }

## 代码模板（Monorepo 后端）

```typescript
// 服务层模板
export const xxxService = {
  exec: async () => {
    try {
      // 业务逻辑
      return data
    } catch (e) {
      throw new Error()
    }
  }
}
```

## 测试用例
TC-001:
TC-002:
