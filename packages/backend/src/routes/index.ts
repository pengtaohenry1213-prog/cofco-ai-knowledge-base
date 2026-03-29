import { Router } from 'express';
import fileRouter from './file.route';
import chatRouter from './chat.route';

const router = Router();

router.use('/file', fileRouter);
router.use('/chat', chatRouter);

export default router;
