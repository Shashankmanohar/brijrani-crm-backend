import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { inventoryService } from './service';
import { sendSuccess } from '../../utils/response';

export const inventoryController = {
  getStockSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const commId = req.query.commodityId as string;
      const whId = req.query.warehouseId as string;
      const binId = req.query.binId as string;

      const summary = await inventoryService.getStockSummary(commId, whId, binId);
      sendSuccess(res, 'Stock summary retrieved successfully', summary);
    } catch (err) {
      next(err);
    }
  },

  executeTransfer: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.user?.id || 'admin';
      const transferNo = `TRF-2026-${Date.now().toString().slice(-4)}`;
      
      await inventoryService.executeStockTransfer({
        ...req.body,
        transferNo,
        createdBy: username
      });

      sendSuccess(res, 'Stock transfer executed successfully', { transferNo });
    } catch (err) {
      next(err);
    }
  }
};
