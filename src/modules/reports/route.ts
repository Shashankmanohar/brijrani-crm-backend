import { Router } from 'express';
import { reportsController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.get('/dashboard', reportsController.getDashboardSummary);

export default router;
