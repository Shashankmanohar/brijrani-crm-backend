import { Router } from 'express';
import { authController } from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/refresh', authController.refresh);
router.post('/seed', authController.seed);
router.post('/logout', authenticate as any, authController.logout);

export default router;
