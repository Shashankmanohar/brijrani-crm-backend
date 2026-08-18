import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { procurementService } from './service';
import { sendSuccess } from '../../utils/response';

export const procurementController = {
  createEnquiry: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const pe = await procurementService.createEnquiry(req.body, email);
      sendSuccess(res, 'Purchase Enquiry created successfully', pe, 201);
    } catch (err) {
      next(err);
    }
  },

  createQuotation: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const pq = await procurementService.createQuotation(req.body, email);
      sendSuccess(res, 'Purchase Quotation logged successfully', pq, 201);
    } catch (err) {
      next(err);
    }
  },

  compareQuotations: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const commId = req.query.commodityId as string;
      const comparison = await procurementService.compareQuotations(commId);
      sendSuccess(res, 'Quotation comparison generated', comparison);
    } catch (err) {
      next(err);
    }
  },

  createPO: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const po = await procurementService.createPO(req.body, email);
      sendSuccess(res, 'Purchase Order created successfully', po, 201);
    } catch (err) {
      next(err);
    }
  },

  approvePO: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.user?.id || 'admin';
      const po = await procurementService.approvePO(req.params.id as string, username);
      sendSuccess(res, 'Purchase Order approved', po);
    } catch (err) {
      next(err);
    }
  },

  createGRN: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const grn = await procurementService.createGRN(req.body, email);
      sendSuccess(res, 'Goods Receipt Note logged successfully', grn, 201);
    } catch (err) {
      next(err);
    }
  },

  submitQualityInspection: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const qi = await procurementService.submitQualityInspection(req.body, email);
      sendSuccess(res, 'Quality Inspection logged and inventory updated successfully', qi, 201);
    } catch (err) {
      next(err);
    }
  }
};
