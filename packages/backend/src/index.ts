import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index';
import { logger } from './middlewares/logger.middleware';
import { errorHandler, BusinessError } from './middlewares/error.middleware';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件 - 首位：记录所有请求
app.use(logger);

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ code: 200, msg: 'server is running' });
});

// 404 catch-all 路由（必须在 errorHandler 之前）
app.use((_req, _res, next) => {
  next(new BusinessError('Not Found', 404));
});

// 异常处理中间件 - 末尾：捕获所有未处理异常
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
