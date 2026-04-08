## 豆包-API Key
- 名称： doubao-api-key-20260329184551
- API Key：： 279dxxx-xxx-xxx-xxx-xxx
- Embedding向量化接口的正确地址为：https://ark.cn-beijing.volces.com/api/v3/embeddings4

- 接入模型： Doubao-Seed-2.0-Code
- Model ID: doubao-seed-2-0-code-preview-260215 
- 接入点 ID：ep-m-20260329204658-gwg5p
- 购买方式: 按Token付费
- 所属项目: 豆包-知识库

### Rest API 调用示例
```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 279dxxx-xxx-xxx-xxx-xxx" \
  -d $'{
    "model": "doubao-seed-2-0-code-preview-260215",
    "messages": [
        {
            "content": [
                {
                    "image_url": {
                        "url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"
                    },
                    "type": "image_url"
                },
                {
                    "text": "图片主要讲了什么?",
                    "type": "text"
                }
            ],
            "role": "user"
        }
    ]
}'
```

### OpenAI SDK 调用示例
1. 请按如下命令安装环境
`pip install --upgrade "openai>=1.0"`

2. 请参考如下示例代码进行调用
```python
import os
from openai import OpenAI
# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中
# 初始化Ark客户端，从环境变量中读取您的API Key
client = OpenAI(
    # 此为默认路径，您可根据业务所在地域进行配置
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    # 从环境变量中获取您的 API Key。此为默认方式，您可根据需要进行修改
    api_key="279dxxx-xxx-xxx-xxx-xxx",
)
response = client.chat.completions.create(
    # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
    model="doubao-seed-2-0-code-preview-260215",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"
                    },
                },
                {"type": "text", "text": "这是哪里？"},
            ],
        }
    ],
)
print(response.choices[0])
```

### 火山调用 SDK
1. 请按如下命令安装环境
`pip install --upgrade "volcengine-python-sdk[ark]"`

2. 请参考如下示例代码进行调用
```python
import os
from volcenginesdkarkruntime import Ark

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中
# 初始化Ark客户端，从环境变量中读取您的API Key
client = Ark(
    # 此为默认路径，您可根据业务所在地域进行配置
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    # 从环境变量中获取您的 API Key。此为默认方式，您可根据需要进行修改
    api_key="279dxxx-xxx-xxx-xxx-xxx",
)

response = client.chat.completions.create(
    # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
    model="doubao-seed-2-0-code-preview-260215",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"
                    },
                },
                {"type": "text", "text": "这是哪里？"},
            ],
        }
    ],
    
)

print(response.choices[0])
```