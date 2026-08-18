import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { reportsService } from './service';
import { sendSuccess } from '../../utils/response';

export const reportsController = {
  getDashboardSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await reportsService.getDashboardSummary();
      sendSuccess(res, 'Dashboard metrics retrieved successfully', summary);
    } catch (err) {
      next(err);
    }
  }
};
