import { Router } from 'express';
import fileRouter from './file.route';
import chatRouter from './chat.route';
import historyRouter from './history.route';
import documentRouter from './document.route';

const router = Router();

router.use('/file', fileRouter);
router.use('/chat', chatRouter);
router.use('/history', historyRouter);
router.use('/documents', documentRouter);

export default router;
