import { Router } from 'express';
import fileRouter from './file.route';

const router = Router();

router.use('/file', fileRouter);

export default router;
