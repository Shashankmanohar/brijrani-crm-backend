import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { crmService } from './service';
import { sendSuccess } from '../../utils/response';

export const crmController = {
  createLead: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const result = await crmService.createLead(req.body, email);
      sendSuccess(res, 'Lead logged and salesperson allocated successfully', result, 201);
    } catch (err) {
      next(err);
    }
  },

  listLeads: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignedTo = req.query.assignedTo as string;
      const list = await crmService.listLeads(assignedTo);
      sendSuccess(res, 'Leads retrieved successfully', list);
    } catch (err) {
      next(err);
    }
  },

  createOpportunity: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const opp = await crmService.createOpportunity(req.body, email);
      sendSuccess(res, 'Opportunity logged successfully', opp, 201);
    } catch (err) {
      next(err);
    }
  },

  listOpportunities: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await crmService.listOpportunities();
      sendSuccess(res, 'Opportunities retrieved successfully', list);
    } catch (err) {
      next(err);
    }
  },

  getWeightedPipeline: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pipeline = await crmService.getWeightedPipeline();
      sendSuccess(res, 'Weighted pipeline metrics computed', pipeline);
    } catch (err) {
      next(err);
    }
  },

  createFollowUp: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fup = await crmService.createFollowUp(req.body);
      sendSuccess(res, 'Follow-up task scheduled successfully', fup, 201);
    } catch (err) {
      next(err);
    }
  },

  listFollowUps: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignedTo = req.query.assignedTo as string;
      const list = await crmService.listFollowUps(assignedTo);
      sendSuccess(res, 'Follow-ups retrieved successfully', list);
    } catch (err) {
      next(err);
    }
  }
};
