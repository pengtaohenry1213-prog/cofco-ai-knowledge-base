import express from 'express'; // express 框架
import cors from 'cors'; // cors 跨域
import dotenv from 'dotenv'; // dotenv 环境变量

// 加载根目录环境变量
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查接口
app.get('/api/health', (_req, res) => {
  res.json({ code: 200, msg: 'server is running' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
