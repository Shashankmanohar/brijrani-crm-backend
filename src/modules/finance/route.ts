import { Router } from 'express';
import { financeController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.post('/vouchers', financeController.postVoucher);
router.get('/vouchers', financeController.listVouchers);
router.get('/ledger', financeController.listLedger);
router.get('/aging/receivables', financeController.getReceivablesAging);
router.get('/aging/payables', financeController.getPayablesAging);

export default router;
