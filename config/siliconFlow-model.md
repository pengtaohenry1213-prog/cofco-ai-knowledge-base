# BAAI/bge-large-zh-v1.5 模型

它是一个聚合了多个 AI 模型的 API 平台，支持：

当前使用向量模型 (Embeddings)：BAAI/bge-large-zh-v1.5
LLM 模型（如 Qwen、GLM、Yi 等系列）

## SiliconFlow Embedding API 配置信息

## 信息来源

`https://docs.siliconflow.cn/cn/api-reference/embeddings/create-embeddings`

## 配置信息

- 名称： wechat
- API Key: sk-exhxrlinysleblmmejzrhqaikgjgvervyhaosjrvzaxjmxpp

## Rest API 调用示例

```bash
curl --request POST \
  --url https://api.siliconflow.cn/v1/embeddings \
  --header "Authorization: Bearer sk-exhxrlinysleblmmejzrhqaikgjgvervyhaosjrvzaxjmxpp" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "BAAI/bge-large-zh-v1.5",
    "input": "Silicon flow embedding online: fast, affordable, and high-quality embedding services. come try it out!"
  }'
```

POST请求 200:

```json
{
  "object": [
    "list"
  ],
  "model": "<string>",
  "data": [
    {
      "object": "embedding",
      "embedding": [
        123
      ],
      "index": 123
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 123,
    "total_tokens": 123
  }
}
```
