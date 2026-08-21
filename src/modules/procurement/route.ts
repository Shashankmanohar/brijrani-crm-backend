import { Router } from 'express';
import { procurementController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.get('/enquiries', procurementController.getEnquiries);
router.post('/enquiries', procurementController.createEnquiry);
router.patch('/enquiries/:id', procurementController.updateEnquiry);
router.get('/quotations', procurementController.getQuotations);
router.post('/quotations', procurementController.createQuotation);
router.patch('/quotations/:id', procurementController.updateQuotation);
router.get('/quotations/compare', procurementController.compareQuotations);
router.get('/orders', procurementController.getPOs);
router.post('/orders', procurementController.createPO);
router.patch('/orders/:id/approve', procurementController.approvePO);
router.patch('/orders/:id', procurementController.updatePO);
router.get('/grns', procurementController.getGRNs);
router.post('/grns', procurementController.createGRN);
router.patch('/grns/:id', procurementController.updateGRN);
router.get('/quality-inspections', procurementController.getQualityInspections);
router.post('/quality-inspections', procurementController.submitQualityInspection);
router.patch('/quality-inspections/:id', procurementController.updateQualityInspection);
router.get('/invoices', procurementController.getInvoices);
router.post('/invoices', procurementController.createInvoice);
router.patch('/invoices/:id/approve', procurementController.approveInvoice);
router.patch('/invoices/:id', procurementController.updateInvoice);

export default router;
