import { Router } from 'express';
import { inventoryController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.get('/summary', inventoryController.getStockSummary);
router.post('/transfers', inventoryController.executeTransfer);

export default router;
