import { Router } from 'express';
import { crmController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.post('/leads', crmController.createLead);
router.get('/leads', crmController.listLeads);
router.post('/opportunities', crmController.createOpportunity);
router.get('/opportunities', crmController.listOpportunities);
router.get('/pipeline', crmController.getWeightedPipeline);
router.post('/followups', crmController.createFollowUp);
router.get('/followups', crmController.listFollowUps);

export default router;
