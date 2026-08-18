import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { financeService } from './service';
import { sendSuccess } from '../../utils/response';

export const financeController = {
  postVoucher: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const voucher = await financeService.postVoucher(req.body, email);
      sendSuccess(res, 'Voucher posted successfully and accounts updated', voucher, 201);
    } catch (err) {
      next(err);
    }
  },

  listLedger: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = req.query.accountName as string;
      const list = await financeService.listLedgerEntries(account);
      sendSuccess(res, 'Ledger entries retrieved successfully', list);
    } catch (err) {
      next(err);
    }
  },

  listVouchers: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await financeService.listVouchers();
      sendSuccess(res, 'Vouchers retrieved successfully', list);
    } catch (err) {
      next(err);
    }
  },

  getReceivablesAging: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const aging = await financeService.getReceivablesAging();
      sendSuccess(res, 'Customer receivables outstanding aging report generated', aging);
    } catch (err) {
      next(err);
    }
  },

  getPayablesAging: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const aging = await financeService.getPayablesAging();
      sendSuccess(res, 'Vendor payables outstanding aging report generated', aging);
    } catch (err) {
      next(err);
    }
  }
};
