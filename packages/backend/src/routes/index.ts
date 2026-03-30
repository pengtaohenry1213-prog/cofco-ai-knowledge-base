import { Router } from 'express';
import fileRouter from './file.route';
import chatRouter from './chat.route';
import historyRouter from './history.route';

const router = Router();

router.use('/file', fileRouter);
router.use('/chat', chatRouter);
router.use('/history', historyRouter);

export default router;
