import { Router } from 'express';
import { procurementController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.post('/enquiries', procurementController.createEnquiry);
router.post('/quotations', procurementController.createQuotation);
router.get('/quotations/compare', procurementController.compareQuotations);
router.post('/orders', procurementController.createPO);
router.patch('/orders/:id/approve', procurementController.approvePO);
router.post('/grns', procurementController.createGRN);
router.post('/quality-inspections', procurementController.submitQualityInspection);

export default router;
