import { Router } from 'express';
import { salesController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.post('/enquiries', salesController.createEnquiry);
router.post('/quotations', salesController.createQuotation);
router.post('/orders', salesController.createSO);
router.post('/picking/complete', salesController.completePicking);
router.post('/dispatch', salesController.dispatchOrder);
router.post('/pod', salesController.submitPOD);
router.get('/invoices', salesController.listInvoices);

export default router;
