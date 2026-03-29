import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { logger } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ code: 200, msg: 'server is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
