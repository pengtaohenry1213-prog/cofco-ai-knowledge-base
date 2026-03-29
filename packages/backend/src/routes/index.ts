import { Router } from 'express';
import documentRouter from './document.route.js';

const router = Router();

router.use('/document', documentRouter);

export default router;
